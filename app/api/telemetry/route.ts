import { isValidAccessKey } from "@/lib/auth";
import {
  recordTaskStarted,
  recordTaskSubmitted,
  resetSession,
} from "@/lib/telemetryStore";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : null;
  const taskId = typeof body?.taskId === "string" ? body.taskId : null;
  const event = body?.event;

  if (!isValidAccessKey(key)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  // Dev-nav "reset session" - the one event that isn't scoped to a task.
  if (event === "reset") {
    await resetSession(key as string);
    return Response.json({ ok: true });
  }

  if (!taskId) {
    return Response.json({ ok: false, error: "Missing taskId" }, { status: 400 });
  }

  if (event === "started") {
    await recordTaskStarted(key as string, taskId);
  } else if (event === "submitted") {
    const deliverableChars =
      typeof body?.deliverableChars === "number" ? body.deliverableChars : 0;
    await recordTaskSubmitted(key as string, taskId, deliverableChars);
  } else {
    return Response.json({ ok: false, error: "Unknown event" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
