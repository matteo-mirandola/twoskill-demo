import Anthropic from "@anthropic-ai/sdk";
import { isValidAccessKey } from "@/lib/auth";
import {
  decrementUserMessage,
  incrementUserMessage,
  recordRawFileAttached,
  recordRawPasteDetected,
} from "@/lib/telemetryStore";
import { scanForSensitiveData } from "@/lib/sensitiveScan";
import { tasks } from "@/lib/mockData";
import type { ChatMessage } from "@/lib/types";

const MODEL = "claude-sonnet-4-6";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "El servidor no está configurado: falta ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : null;
  const taskId = typeof body?.taskId === "string" ? body.taskId : null;
  const messages: ChatMessage[] = Array.isArray(body?.messages)
    ? body.messages
    : [];

  if (!isValidAccessKey(key)) {
    return Response.json({ error: "Clave de acceso no válida" }, { status: 401 });
  }

  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    return Response.json({ error: "Tarea desconocida" }, { status: 404 });
  }

  // Atomic increment-then-check: never read-then-write, so concurrent
  // requests hitting different serverless instances can't both slip through
  // under the cap.
  const n = await incrementUserMessage(key as string, taskId as string);
  if (n > task.maxUserMessages) {
    return Response.json(
      { error: "Has alcanzado el límite de mensajes para esta tarea" },
      { status: 429 }
    );
  }

  const lastMessage = messages[messages.length - 1];
  const canAttach = task.id === "alert-summary";
  if (canAttach && lastMessage?.role === "user" && lastMessage.attachedFile) {
    await recordRawFileAttached(key as string, taskId as string);
  }

  // Runs globally (every task, not just the one with sensitive materials) -
  // a user can paste raw sensitive data into any chat. Skip the attach-button
  // path: that already logs rawFileAttached and shouldn't be double-counted.
  if (
    lastMessage?.role === "user" &&
    !lastMessage.attachedFile &&
    lastMessage.content
  ) {
    const scan = scanForSensitiveData(lastMessage.content);
    if (scan.triggered) {
      await recordRawPasteDetected(key as string, taskId as string, {
        clientNameCount: scan.clientNameCount,
        clientDomainCount: scan.domainCount,
      });
    }
  }

  const anthropicMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const anthropic = new Anthropic();
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamedAnyTokens = false;
      try {
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: task.maxResponseTokens,
          messages: anthropicMessages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            streamedAnyTokens = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        // The call never actually delivered a turn - give the user their
        // message back rather than burning one of their 12.
        if (!streamedAnyTokens) {
          await decrementUserMessage(key as string, taskId as string);
        }
        const message =
          err instanceof Anthropic.APIError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Algo salió mal.";
        controller.enqueue(
          encoder.encode(`\n\n[Error al contactar con el modelo: ${message}]`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
