import type { ReportGrades } from "./grading";

// Fallback grades used when the Anthropic API key is missing or the grading
// call fails, and by the dev preview endpoint. Keeps the demo flowing: the
// participant still receives a complete, plausible report.
export const MOCK_GRADES: ReportGrades = {
  overall: {
    score: 68,
    level: "Practitioner",
    summary:
      "You use AI effectively for drafting and synthesis, and your deliverables are well structured. The main gap is verification: in two of three tasks you passed AI output forward without checking it against the source material.",
  },
  tasks: [
    {
      taskId: "monthly-report",
      title: "The Monthly Report",
      score: 62,
      summary:
        "Your summary was clearly written and management-ready in tone, but it reported the refunds-included total, which overstates settled volume by €128,000.",
      findings: [
        {
          label: "Correct figures",
          status: "missed",
          detail:
            "You reported €1,295,000 with Logistics in the top 3 — the refunds-included numbers. The correct settled total is €1,167,000.",
        },
        {
          label: "Instruction fidelity",
          status: "partial",
          detail:
            "The brief asked for refunds to be excluded; your prompt to the AI never mentioned this constraint.",
        },
        {
          label: "Data handling",
          status: "passed",
          detail:
            "You asked targeted questions instead of pasting the raw export, keeping sensitive columns out of the chat.",
        },
        {
          label: "Output verification",
          status: "missed",
          detail:
            "The AI's figures went into your deliverable unchanged, with no spot-check visible in the chat.",
        },
      ],
      strengths: ["Clear one-page structure with a genuinely useful operational note."],
      improvements: [
        "Restate every constraint from the brief in your prompt.",
        "Spot-check at least the headline figure before submitting.",
      ],
    },
    {
      taskId: "research-briefing",
      title: "The Research Briefing",
      score: 71,
      summary:
        "Solid, well-grounded briefing with a clear recommendation. You partially caught the contradiction between sources.",
      findings: [
        {
          label: "Contradiction caught",
          status: "partial",
          detail:
            "You noted 'sources differ on growth' but still led with the 40% figure without the Meridian counter-evidence.",
        },
        {
          label: "Unverified claims",
          status: "passed",
          detail:
            "You attributed the hybrid-work explanation to its source rather than stating it as fact.",
        },
        {
          label: "Groundedness",
          status: "passed",
          detail: "No invented statistics; everything traces to the pack.",
        },
        {
          label: "Actionability",
          status: "passed",
          detail: "Clear 'move now, start small' recommendation.",
        },
      ],
      strengths: ["Good use of the vendor table to compare concrete options."],
      improvements: ["When two sources conflict, lead with the conflict — don't bury it."],
    },
    {
      taskId: "the-deck",
      title: "The Deck",
      score: 70,
      summary:
        "Accurate figures and clean five-slide structure; one slide leaked internal framing.",
      findings: [
        {
          label: "Confidentiality",
          status: "passed",
          detail: "No mention of the processor dispute or arbitration anywhere in the slides.",
        },
        {
          label: "Figure accuracy",
          status: "passed",
          detail:
            "1.8%, September 1, the August window and the legacy-agreement carve-out are all correct.",
        },
        {
          label: "Format fit",
          status: "passed",
          detail: "Exactly five slides, one message each.",
        },
        {
          label: "Delivery polish",
          status: "partial",
          detail: "Slide 4 still contained the AI's 'Certainly — here's a bullet list' preamble.",
        },
      ],
      strengths: ["Partner-appropriate tone throughout."],
      improvements: ["Always re-read AI-drafted content for assistant-speak before it goes external."],
    },
  ],
};
