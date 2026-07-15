import { isValidAccessKey } from "@/lib/auth";
import { recordTelemetry } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : null;
  const taskId = typeof body?.taskId === "string" ? body.taskId : null;

  if (!isValidAccessKey(key) || !taskId) {
    return Response.json({ ok: false }, { status: 401 });
  }

  recordTelemetry(key, taskId, {
    wallClockSeconds:
      typeof body?.wallClockSeconds === "number"
        ? body.wallClockSeconds
        : undefined,
    deliverableLength:
      typeof body?.deliverableLength === "number"
        ? body.deliverableLength
        : undefined,
  });

  return Response.json({ ok: true });
}
