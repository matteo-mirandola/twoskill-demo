// Persists the full session content (profiling answers, AI chat transcripts,
// final deliverables) that was previously discarded after being used to
// generate the report. Mirrors lib/telemetryStore.ts's backend selection:
// Upstash Redis when credentials are present, otherwise an in-memory Map.
//
// Write operations never throw - a persistence hiccup must never break
// report generation. Reads used by /debug let errors propagate.

import { Redis } from "@upstash/redis";
import { tasks as taskDefs } from "@/lib/mockData";
import type { ChatMessage, IntakeAnswers, SlideContent } from "@/lib/types";

// Raw spreadsheet bytes are already reflected by `attachedFile` and are not
// useful for review - stripping them keeps stored records small.
export type StoredChatMessage = Omit<ChatMessage, "attachedFileBase64">;

// Only one of `deliverable`/`slides` is ever populated by the client, per
// the task's deliverableKind - the other is null rather than a meaningless
// empty string/array, so stored records don't carry unused placeholder data.
export type StoredTaskData = {
  messages: StoredChatMessage[];
  deliverable: string | null;
  slides: SlideContent[] | null;
};

export type StoredSessionData = {
  accessKey: string;
  intakeAnswers: IntakeAnswers | null;
  tasks: Record<string, StoredTaskData>;
  savedAt: number;
};

const KEY_PREFIX = "2skill:demo:session:";
const TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year, matches telemetryStore/pdfCache

function sessionKey(accessKey: string): string {
  return `${KEY_PREFIX}${accessKey}`;
}

function stripAttachmentBytes(m: ChatMessage): StoredChatMessage {
  return {
    role: m.role,
    content: m.content,
    attachedFile: m.attachedFile,
    attachedFileName: m.attachedFileName,
  };
}

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis: Redis | null =
  redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (!redis) {
  console.warn(
    "[sessionDataStore] No Upstash Redis credentials found - falling back " +
      "to an in-memory store. Saved transcripts/profiling data will NOT " +
      "persist across serverless instances or redeploys."
  );
}

const globalForSession = globalThis as unknown as {
  __sessionDataMemory?: Map<string, StoredSessionData>;
};

function memoryStore(): Map<string, StoredSessionData> {
  if (!globalForSession.__sessionDataMemory) {
    globalForSession.__sessionDataMemory = new Map();
  }
  return globalForSession.__sessionDataMemory;
}

export async function saveSessionData(
  accessKey: string,
  intakeAnswers: IntakeAnswers | null,
  tasks: { taskId: string; messages: ChatMessage[]; deliverable: string; slides: SlideContent[] }[]
): Promise<void> {
  const record: StoredSessionData = {
    accessKey,
    intakeAnswers,
    tasks: Object.fromEntries(
      tasks.map((t) => {
        const isSlides = taskDefs.find((def) => def.id === t.taskId)?.deliverableKind === "slides";
        return [
          t.taskId,
          {
            messages: t.messages.map(stripAttachmentBytes),
            deliverable: isSlides ? null : t.deliverable,
            slides: isSlides ? t.slides : null,
          },
        ];
      })
    ),
    savedAt: Date.now(),
  };

  if (redis) {
    try {
      await redis.set(sessionKey(accessKey), JSON.stringify(record), {
        ex: TTL_SECONDS,
      });
      return;
    } catch (err) {
      console.error(
        "[sessionDataStore] Redis save failed, falling back to memory:",
        err
      );
    }
  }
  memoryStore().set(accessKey, record);
}

export async function getSessionData(
  accessKey: string
): Promise<StoredSessionData | null> {
  if (redis) {
    const raw = await redis.get<string>(sessionKey(accessKey));
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as StoredSessionData) : (raw as StoredSessionData);
  }
  return memoryStore().get(accessKey) ?? null;
}

export async function getAllSessionData(
  accessKeys: string[]
): Promise<StoredSessionData[]> {
  const results = await Promise.all(accessKeys.map((k) => getSessionData(k)));
  return results.filter((r): r is StoredSessionData => r !== null);
}
