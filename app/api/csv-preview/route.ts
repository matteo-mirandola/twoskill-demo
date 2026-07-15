import { isValidAccessKey } from "@/lib/auth";
import { getCsvPreview } from "@/lib/csv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("k");

  if (!isValidAccessKey(key)) {
    return Response.json({ error: "Invalid access key" }, { status: 401 });
  }

  return Response.json(getCsvPreview(15));
}
