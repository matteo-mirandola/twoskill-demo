import { isValidAccessKey } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : null;
  return Response.json({ ok: isValidAccessKey(key) });
}
