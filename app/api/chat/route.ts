import Anthropic from "@anthropic-ai/sdk";
import { isValidAccessKey } from "@/lib/auth";
import { getCsvText } from "@/lib/csv";
import { recordRawFileAttached, recordUserMessageCount } from "@/lib/store";
import { tasks } from "@/lib/mockData";
import type { ChatMessage } from "@/lib/types";

const MODEL = "claude-sonnet-4-6";

function buildAttachedFileContent(userTypedText: string): string {
  const csv = getCsvText();
  const block = `Attached file: payments_march.csv\n\`\`\`\n${csv}\n\`\`\``;
  return userTypedText ? `${block}\n\n${userTypedText}` : block;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Server is not configured: ANTHROPIC_API_KEY is missing." },
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
    return Response.json({ error: "Invalid access key" }, { status: 401 });
  }

  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    return Response.json({ error: "Unknown task" }, { status: 404 });
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  if (userMessageCount > task.maxUserMessages) {
    return Response.json(
      { error: "Message limit reached for this task" },
      { status: 403 }
    );
  }
  recordUserMessageCount(key as string, taskId as string, userMessageCount);

  const lastMessage = messages[messages.length - 1];
  const canAttach = task.id === "monthly-report";
  if (canAttach && lastMessage?.role === "user" && lastMessage.attachedFile) {
    recordRawFileAttached(key as string, taskId as string);
  }

  const anthropicMessages = messages.map((m) => ({
    role: m.role,
    content:
      canAttach && m.attachedFile
        ? buildAttachedFileContent(m.content)
        : m.content,
  }));

  const anthropic = new Anthropic();
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
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
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong.";
        controller.enqueue(
          encoder.encode(`\n\n[Error contacting the model: ${message}]`)
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
