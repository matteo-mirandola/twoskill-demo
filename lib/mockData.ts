// 2Skill prototype — ALL test content lives here. Components must not invent copy.
// Traps are planted in this content by design. Do not "fix" apparent inconsistencies
// in Task 2 sources: the contradiction between sources is intentional.

export const intakeQuestions = [
  {
    id: "email",
    type: "email" as const,
    question: "What's your work email?",
    note: "We'll send your personal results report to this address.",
  },
  {
    id: "area",
    type: "single" as const,
    question: "What's your main area of work?",
    options: ["Commercial & Partnerships", "Marketing & Content", "Product & Tech", "Operations", "Management", "Other"],
  },
  {
    id: "tools",
    type: "multi" as const,
    question: "Which AI tools do you use for work?",
    options: ["ChatGPT", "Claude", "Gemini", "Copilot", "Other", "None"],
  },
  {
    id: "frequency",
    type: "single" as const,
    question: "How often do you use AI for work?",
    options: ["Never", "A few times a month", "Weekly", "Daily"],
  },
  {
    id: "account",
    type: "single" as const,
    question: "When you use AI for work, on what account?",
    options: ["Free personal", "Paid personal", "Company account", "Not sure"],
  },
  {
    id: "selfRating",
    type: "scale" as const,
    question: "How confident are you in your AI skills?",
    min: 1,
    max: 10,
  },
];

export type TaskDef = {
  id: string;
  title: string;
  minutes: number;
  maxUserMessages: number;
  maxResponseTokens: number;
  brief: string;            // markdown-ish, rendered in the left pane
  deliverableKind: "text" | "slides";
  deliverableLabel: string;
  materials: MaterialDef[];
};

export type MaterialDef =
  | { kind: "csv"; id: string; filename: string; sizeLabel: string; note: string }
  | { kind: "source"; id: string; label: string; title: string; body: string };

export const tasks: TaskDef[] = [
  // ────────────────────────────────────────────────────────────────────────
  // TASK 1 — The Monthly Report
  // Traps: sensitive columns (attach raw file), missable "refunds excluded",
  // output verification (AI-produced figures vs. the CSV ground truth).
  // Ground truth: settled total €1,167,000 · top 3 settled: Subscriptions
  // €385,000, Professional Services €298,000, Hardware €176,000.
  // Wrong answer (refunds included): €1,295,000 and Logistics (€199,000)
  // replaces Hardware in the top 3.
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "monthly-report",
    title: "The Monthly Report",
    minutes: 11,
    maxUserMessages: 12,
    maxResponseTokens: 1500, // raised: the CSV may sit in context
    deliverableKind: "text",
    deliverableLabel: "Paste your final one-page summary here",
    brief: `**From:** Finance lead
**To:** You
**Subject:** Monthly payments summary for management

I need a one-page summary of last month's payments for the management review. Please cover total settled payment volume (refunds excluded), the three largest categories by value, and one operational note on anything worth their attention.

The full export is attached. Management reviews this Thursday.`,
    materials: [
      {
        kind: "csv",
        id: "payments-csv",
        filename: "payments_march.csv",
        sizeLabel: "1,904 rows · 214 KB",
        note: "Full March export from the payments system.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // TASK 2 — The Research Briefing
  // Traps: T4 contradiction (Source 1 prose: +40% growth in 2025 vs Source 4
  // chart description: essentially flat, 31%→32%) · T6 unverifiable causal
  // claim (Source 2: "driven by post-pandemic hybrid work patterns" — nothing
  // in the pack supports it). Everything else is internally consistent.
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "research-briefing",
    title: "The Research Briefing",
    minutes: 10,
    maxUserMessages: 12,
    maxResponseTokens: 800,
    deliverableKind: "text",
    deliverableLabel: "Paste your final one-page briefing here",
    brief: `**From:** Strategy lead
**To:** You
**Subject:** One-page briefing for the management review

I need a one-page briefing on corporate adoption of AI note-taking tools, ending with a clear recommendation on whether we move now or wait.

I've attached the sources I had time to gather — work from those; I'd rather have it grounded in what we've got than padded with generic background. Management reviews Thursday.`,
    materials: [
      {
        kind: "source",
        id: "src-1",
        label: "Article — TechWeek Business",
        title: "AI note-takers move from novelty to line item",
        body: `Two years ago, AI meeting assistants were a curiosity demoed at conferences. Today they are a budget line. Corporate adoption of AI note-taking tools grew by roughly 40% in 2025, according to procurement data reviewed by TechWeek, with mid-market companies driving most of the new contracts.

Vendors have responded by moving upmarket. Enterprise tiers now bundle meeting summaries with action-item tracking and CRM sync, and per-seat prices have held steady even as the underlying models became cheaper to run. Procurement teams report that the decision is no longer whether to buy, but which security tier to buy.

Not every deployment sticks. Several IT leads interviewed for this piece described "shelfware" seats — licences bought in bulk and never activated — as the quiet failure mode of the category.`,
      },
      {
        kind: "source",
        id: "src-2",
        label: "Article — WorkTools Daily",
        title: "Why meeting notes were the first thing companies automated",
        body: `Of all the tasks AI could take off an office worker's plate, meeting notes went first. The reasons are practical: the input is bounded (one meeting), the output is low-risk (an internal summary), and the time saved is visible to everyone in the room.

The shift is largely driven by post-pandemic hybrid work patterns, which multiplied the number of meetings that happen partly or fully on calls.

Adoption has been uneven across functions. Sales and customer-success teams lead, because call summaries feed directly into CRM records. Legal and HR lag, citing confidentiality concerns about what the tools retain and where recordings are processed.`,
      },
      {
        kind: "source",
        id: "src-3",
        label: "Data table — vendor landscape",
        title: "Leading AI note-taking vendors (compiled)",
        body: `| Vendor        | Entry price (seat/mo) | Enterprise tier | On-prem option |
|---------------|----------------------|-----------------|----------------|
| NotedAI       | €12                  | Yes             | No             |
| MinuteMind    | €9                   | Yes             | No             |
| Scribewell    | €15                  | Yes             | Yes            |
| EchoBrief     | €8                   | No              | No             |

Compiled from public pricing pages, May 2026. Enterprise tiers add SSO, retention controls, and audit logs.`,
      },
      {
        kind: "source",
        id: "src-4",
        label: "Report extract — Meridian Research, Q1 2026",
        title: "Workplace AI tools: adoption tracker (extract)",
        body: `[Figure 3 — omitted in this extract] The chart tracks the share of surveyed companies (n=1,850, EU and UK) with at least one paid AI note-taking deployment, quarterly. As the chart shows, the share of companies using AI note-taking tools remained essentially unchanged through 2025, moving from 31% in Q1 to 32% in Q4 — within the survey's margin of error.

Where movement does show up is depth rather than breadth: among companies already deployed, the median number of active seats grew from 14 to 31 over the same period. Meridian reads this as a consolidation phase — existing buyers expanding, few new buyers entering.

Respondents citing "data governance" as the main blocker to first deployment rose from 22% to 29% year over year.`,
      },
      {
        kind: "source",
        id: "src-5",
        label: "Web page — vendor security & compliance",
        title: "Scribewell — Security & data handling (vendor page)",
        body: `Your meetings stay yours. Scribewell processes audio in-region (EU customers: Frankfurt), retains transcripts for 30 days by default (configurable to zero), and never uses customer content to train models.

Enterprise plans add: single sign-on, per-workspace retention policies, audit logs, and an optional on-premise transcription gateway for regulated industries.

Certifications: ISO 27001, SOC 2 Type II. A signed DPA is available for all paid tiers.`,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // TASK 3 — The Deck
  // Traps: T7 internal detail (processor dispute in arbitration — must not
  // appear in slides; generic "improving our billing" is NOT a leak) ·
  // T8 exact figures (1.8% fee, was 2.1%; Sept 1; Aug 1–31 window; standard
  // agreements only) · T9 format-fit (5 slides, one message per slide) ·
  // T10 delivery-polish (AI-tell markers — demo-level only in the prototype).
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "the-deck",
    title: "The Deck",
    minutes: 7,
    maxUserMessages: 12,
    maxResponseTokens: 800,
    deliverableKind: "slides",
    deliverableLabel: "Write the content of each slide (title + bullets)",
    brief: `**From:** Comms lead
**To:** You
**Subject:** Slides for the partner update

Put together the content for a **5-slide** deck announcing the new billing schedule to our partners. Use these figures: processing fee drops from 2.1% to **1.8%** on **September 1st**; the transition window runs **August 1–31** (both schedules accepted); the change applies to **all partners on standard agreements** — legacy agreements stay as they are until renewal.

Keep it tight — this goes to external partners, one clear message per slide.

For your context only: part of the reason we're changing this is a dispute with our previous payment processor, still in arbitration. That stays internal — it must not appear anywhere in the partner-facing slides.`,
    materials: [],
  },
];

export const completionScreen = {
  title: "Assessment complete",
  body: "Thanks — your session has been recorded. Your report is being prepared and will be shared with you directly.",
  reportSending: "Grading your session and preparing your report…",
  reportSent: "Your results report has been sent to {email}. Check your inbox (and spam folder).",
  reportError:
    "We couldn't send your report automatically. Your session is recorded — we'll follow up by email.",
  reportRetry: "Try sending again",
  reportDownload: "Download your report (PDF)",
};
