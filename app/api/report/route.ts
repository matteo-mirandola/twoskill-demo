import { isValidAccessKey } from "@/lib/auth";
import { getSessionTelemetry, type TaskTelemetry } from "@/lib/telemetryStore";
import { tasks } from "@/lib/mockData";
import { gradeSession, type TaskSubmission, type ReportGrades } from "@/lib/report/grading";
import { renderReportPdf } from "@/lib/report/pdf";
import { MOCK_GRADES } from "@/lib/report/mockGrades";
import { storeReportPdf } from "@/lib/report/pdfCache";
import type { IntakeAnswers } from "@/lib/types";

// Grading + PDF rendering comfortably exceeds the default budget.
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : null;
  if (!isValidAccessKey(key)) {
    return Response.json({ error: "Invalid access key" }, { status: 401 });
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

  // Grade with Claude; fall back to mock grades if the key is missing or the
  // call fails, so the participant always gets a report.
  // Telemetry reads let Redis errors propagate (by design, for /debug);
  // the report should degrade gracefully instead.
  let telemetry: Record<string, TaskTelemetry> = {};
  try {
    telemetry = (await getSessionTelemetry(key as string)).tasks;
  } catch (err) {
    console.error("[report] telemetry read failed, grading without it:", err);
  }

  let grades: ReportGrades = MOCK_GRADES;
  let mocked = true;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      grades = await gradeSession(intakeAnswers, submissions, telemetry);
      mocked = false;
    } catch (err) {
      console.error("[report] grading failed, falling back to mock grades:", err);
    }
  } else {
    console.warn("[report] ANTHROPIC_API_KEY missing — using mock grades.");
  }

  try {
    const pdf = await renderReportPdf({ grades, intakeAnswers });
    await storeReportPdf(key as string, pdf);
    return Response.json({ ok: true, mocked, pdfReady: true });
  } catch (err) {
    console.error("[report] failed:", err);
    return Response.json({ error: "Failed to generate the report." }, { status: 500 });
  }
}
