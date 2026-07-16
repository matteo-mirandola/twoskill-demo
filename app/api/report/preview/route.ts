import { renderReportPdf } from "@/lib/report/pdf";
import { MOCK_GRADES } from "@/lib/report/mockGrades";

// Dev-only: preview the PDF design with sample grades without completing
// a full assessment. GET /api/report/preview
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  const pdf = await renderReportPdf({
    grades: MOCK_GRADES,
    intakeAnswers: {
      area: "Marketing & Content",
      tools: ["ChatGPT", "Claude"],
      frequency: "Weekly",
      account: "Free personal",
      selfRating: 7,
    },
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=2skill-report-preview.pdf",
    },
  });
}
