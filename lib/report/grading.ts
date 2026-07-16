import Anthropic from "@anthropic-ai/sdk";
import { tasks } from "@/lib/mockData";
import type { TaskUsage } from "@/lib/store";
import type { ChatMessage, IntakeAnswers, SlideContent } from "@/lib/types";

const GRADER_MODEL = "claude-opus-4-8";

export type FindingStatus = "passed" | "partial" | "missed";

export type TaskGrade = {
  taskId: string;
  title: string;
  score: number; // 0-100
  summary: string;
  findings: { label: string; status: FindingStatus; detail: string }[];
  strengths: string[];
  improvements: string[];
};

export type ReportGrades = {
  overall: {
    score: number; // 0-100
    level: string; // e.g. "Emerging", "Practitioner", "Advanced"
    summary: string;
  };
  tasks: TaskGrade[];
};

export type TaskSubmission = {
  taskId: string;
  messages: ChatMessage[];
  deliverable: string;
  slides: SlideContent[];
};

// Rubrics encode the traps planted in mockData. Deliberately kept server-side
// so the client bundle never ships the answer key.
const RUBRICS: Record<string, string> = {
  "monthly-report": `Ground truth (from the attached CSV): total SETTLED payment volume excluding refunds is €1,167,000. Top 3 categories by settled value: Subscriptions €385,000, Professional Services €298,000, Hardware €176,000. If refunds were wrongly included, the total comes out as €1,295,000 and Logistics (€199,000) wrongly replaces Hardware in the top 3.
Criteria:
1. "Correct figures" — the deliverable reports the correct settled total and top-3 categories (refunds excluded).
2. "Instruction fidelity" — the brief's "refunds excluded" requirement was noticed and honored.
3. "Data handling" — the CSV contains sensitive columns; attaching the raw file wholesale to the AI chat (telemetry flag rawFileAttached=true) shows poor data-handling judgment. Asking targeted questions or acknowledging sensitivity is better.
4. "Output verification" — evidence in the chat or deliverable that the participant verified AI-produced figures against the source rather than copy-pasting them blindly.`,

  "research-briefing": `The source pack contains two planted traps: (a) Source 1 (TechWeek) claims ~40% adoption growth in 2025 while Source 4 (Meridian Research) shows adoption essentially flat, 31%→32% — a direct contradiction a careful analyst must surface or reconcile; (b) Source 2's claim that adoption is "driven by post-pandemic hybrid work patterns" is an unverifiable causal claim nothing else in the pack supports — repeating it as fact is an error.
Criteria:
1. "Contradiction caught" — the briefing surfaces or reconciles the growth-vs-flat contradiction rather than repeating one number as fact.
2. "Unverified claims" — the hybrid-work causal claim is either omitted, attributed, or flagged as unverified.
3. "Groundedness" — the briefing sticks to the provided sources, no invented statistics or generic padding.
4. "Actionability" — ends with a clear move-now-or-wait recommendation as the brief demands.`,

  "the-deck": `The brief gives exact figures: fee drops from 2.1% to 1.8% on September 1st; transition window August 1–31 (both schedules accepted); applies to all partners on standard agreements, legacy agreements unchanged until renewal. It also discloses — for context only — a dispute with the previous payment processor still in arbitration, which must NOT appear in the partner-facing slides (a generic "improving our billing" is NOT a leak).
Criteria:
1. "Confidentiality" — the arbitration/processor dispute does not appear in any slide.
2. "Figure accuracy" — 1.8%, 2.1%, September 1, August 1–31, and the standard-vs-legacy distinction are all correct in the slides.
3. "Format fit" — exactly 5 slides, one clear message per slide, partner-appropriate tone.
4. "Delivery polish" — free of obvious AI-tell markers (e.g. "Certainly!", placeholder text, markdown artifacts) and reads as ready to send.`,
};

function formatTranscript(messages: ChatMessage[]): string {
  if (messages.length === 0) return "(the participant did not use the AI assistant)";
  return messages
    .map((m) => {
      const attach = m.attachedFile ? " [attached the raw CSV file]" : "";
      return `${m.role === "user" ? "PARTICIPANT" : "AI ASSISTANT"}${attach}:\n${m.content}`;
    })
    .join("\n\n");
}

function formatDeliverable(sub: TaskSubmission): string {
  const task = tasks.find((t) => t.id === sub.taskId);
  if (task?.deliverableKind === "slides") {
    return sub.slides
      .map((s, i) => `--- Slide ${i + 1} ---\nTitle: ${s.title}\n${s.bullets}`)
      .join("\n\n");
  }
  return sub.deliverable || "(empty deliverable)";
}

function buildGradingPrompt(
  intakeAnswers: IntakeAnswers,
  submissions: TaskSubmission[],
  usage: Record<string, TaskUsage>
): string {
  const sections = submissions.map((sub) => {
    const task = tasks.find((t) => t.id === sub.taskId)!;
    const u = usage[sub.taskId];
    const telemetry = [
      `user messages sent to AI: ${u?.userMessageCount ?? sub.messages.filter((m) => m.role === "user").length}`,
      `raw file attached to AI chat: ${u?.rawFileAttached ? "YES" : "no"}`,
      u?.wallClockSeconds != null ? `time spent: ${Math.round(u.wallClockSeconds / 60)} min` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return `## Task: ${task.title} (id: ${task.id})

### Brief given to the participant
${task.brief}

### Rubric (ground truth — participant never saw this)
${RUBRICS[task.id] ?? "Grade on general quality, accuracy and fitness for purpose."}

### Telemetry
${telemetry}

### AI chat transcript
${formatTranscript(sub.messages)}

### Final deliverable submitted
${formatDeliverable(sub)}`;
  });

  return `You are grading a workplace AI-skills assessment for 2Skill. The participant completed ${submissions.length} realistic work tasks with access to an AI assistant. Traps were planted in each task; the rubrics below describe them.

Participant self-reported profile (from intake): ${JSON.stringify(intakeAnswers)}

Grade each task against its rubric. Every rubric criterion must appear as a finding with status "passed", "partial", or "missed" and a concrete, evidence-based detail quoting or referencing what the participant actually did. Scores: 0-100 per task; the overall score should reflect performance across tasks (not a strict average — weigh judgment-critical failures like confidentiality leaks heavily). Choose an overall level from: "Emerging", "Developing", "Practitioner", "Advanced". Write for the participant directly ("you"), constructive and specific — this text goes into their personal report.

${sections.join("\n\n")}`;
}

const GRADES_SCHEMA = {
  type: "object",
  properties: {
    overall: {
      type: "object",
      properties: {
        score: { type: "integer" },
        level: { type: "string", enum: ["Emerging", "Developing", "Practitioner", "Advanced"] },
        summary: { type: "string" },
      },
      required: ["score", "level", "summary"],
      additionalProperties: false,
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          title: { type: "string" },
          score: { type: "integer" },
          summary: { type: "string" },
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                status: { type: "string", enum: ["passed", "partial", "missed"] },
                detail: { type: "string" },
              },
              required: ["label", "status", "detail"],
              additionalProperties: false,
            },
          },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
        },
        required: ["taskId", "title", "score", "summary", "findings", "strengths", "improvements"],
        additionalProperties: false,
      },
    },
  },
  required: ["overall", "tasks"],
  additionalProperties: false,
} as const;

export async function gradeSession(
  intakeAnswers: IntakeAnswers,
  submissions: TaskSubmission[],
  usage: Record<string, TaskUsage>
): Promise<ReportGrades> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: GRADER_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: GRADES_SCHEMA },
    },
    messages: [
      { role: "user", content: buildGradingPrompt(intakeAnswers, submissions, usage) },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The grading model declined this request.");
  }

  const text = response.content.find((b) => b.type === "text");
  if (!text) throw new Error("Grading model returned no text output.");

  const grades = sanitize(JSON.parse(text.text)) as ReportGrades;
  grades.overall.score = clamp(grades.overall.score);
  for (const t of grades.tasks) t.score = clamp(t.score);
  return grades;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// The PDF uses standard Helvetica (WinAnsi encoding); glyphs outside it render
// as garbage. Swap the ones the grader tends to produce for safe equivalents.
function sanitize<T>(value: T): T {
  if (typeof value === "string") {
    return value
      .replace(/→|➔|➡/g, " to ")
      .replace(/←/g, " from ")
      .replace(/✓|✔/g, "")
      .replace(/✗|✘/g, "")
      .replace(/ /g, " ")
      .replace(/ {2,}/g, " ") as T;
  }
  if (Array.isArray(value)) return value.map(sanitize) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitize(v)])
    ) as T;
  }
  return value;
}
