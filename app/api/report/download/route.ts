import { isValidAccessKey } from "@/lib/auth";
import { getReportPdf } from "@/lib/report/pdfCache";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!isValidAccessKey(key)) {
    return Response.json({ error: "Invalid access key" }, { status: 401 });
  }

  const pdf = await getReportPdf(key as string);
  if (!pdf) {
    return Response.json(
      { error: "No report available for this session yet." },
      { status: 404 }
    );
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="2skill-assessment-report.pdf"',
    },
  });
}
