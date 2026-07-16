import { isValidAccessKey } from "@/lib/auth";
import { getUsageForKey } from "@/lib/store";
import { tasks } from "@/lib/mockData";
import { gradeSession, type TaskSubmission, type ReportGrades } from "@/lib/report/grading";
import { MOCK_GRADES } from "@/lib/report/mockGrades";
import { renderReportPdf } from "@/lib/report/pdf";
import { isMailConfigured, sendReportEmail } from "@/lib/report/mail";
import { storeReportPdf, getReportPdf } from "@/lib/report/pdfCache";
import type { IntakeAnswers } from "@/lib/types";

// Grading + PDF + SMTP round trip comfortably exceeds the default budget.
export const maxDuration = 300;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Same in-memory-per-process tradeoff as lib/store.ts: enough to stop
// double-sends from re-submits within one demo session.
const globalForReport = globalThis as unknown as { __reportSent?: Set<string> };
function sentSet(): Set<string> {
  if (!globalForReport.__reportSent) globalForReport.__reportSent = new Set();
  return globalForReport.__reportSent;
}

export async function POST(request: Request) {
  if (!isMailConfigured()) {
    return Response.json(
      { error: "Server is not configured: SMTP settings are missing." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : null;
  if (!isValidAccessKey(key)) {
    return Response.json({ error: "Invalid access key" }, { status: 401 });
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  const intakeAnswers: IntakeAnswers =
    body?.intakeAnswers && typeof body.intakeAnswers === "object" ? body.intakeAnswers : {};

  const rawSubmissions: unknown[] = Array.isArray(body?.tasks) ? body.tasks : [];
  const submissions: TaskSubmission[] = tasks.map((task) => {
    const found = rawSubmissions.find(
      (s): s is TaskSubmission =>
        typeof s === "object" && s !== null && (s as TaskSubmission).taskId === task.id
    );
    return {
      taskId: task.id,
      messages: Array.isArray(found?.messages) ? found.messages : [],
      deliverable: typeof found?.deliverable === "string" ? found.deliverable : "",
      slides: Array.isArray(found?.slides) ? found.slides : [],
    };
  });

  const dedupeKey = `${key}:${email}`;
  if (sentSet().has(dedupeKey)) {
    return Response.json({
      ok: true,
      alreadySent: true,
      pdfReady: Boolean(getReportPdf(key as string)),
    });
  }

  // Grade with Claude; fall back to mock grades if the key is missing or the
  // call fails, so the participant always receives a report.
  let grades: ReportGrades = MOCK_GRADES;
  let mocked = true;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      grades = await gradeSession(intakeAnswers, submissions, getUsageForKey(key as string));
      mocked = false;
    } catch (err) {
      console.error("[report] grading failed, falling back to mock grades:", err);
    }
  } else {
    console.warn("[report] ANTHROPIC_API_KEY missing — using mock grades.");
  }

  let pdfReady = false;
  try {
    const pdf = await renderReportPdf({ email, grades, intakeAnswers });
    storeReportPdf(key as string, pdf);
    pdfReady = true;
    await sendReportEmail(email, pdf);
    sentSet().add(dedupeKey);
    return Response.json({ ok: true, mocked, pdfReady });
  } catch (err) {
    console.error("[report] failed:", err);
    // pdfReady=true here means the PDF rendered but the email failed —
    // the client can still offer the download.
    return Response.json(
      { error: "Failed to generate or send the report.", pdfReady },
      { status: 500 }
    );
  }
}
