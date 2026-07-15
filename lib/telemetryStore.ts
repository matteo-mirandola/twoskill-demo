// The ONLY module that touches storage. Selects a backend once at module
// load: Upstash Redis if credentials are present (works across serverless
// instances and survives redeploys), otherwise an in-memory Map (fine for
// `npm run dev` with just ANTHROPIC_API_KEY + ACCESS_KEYS set, but resets
// per-instance and per-redeploy).
//
// Write operations never throw - a telemetry hiccup must never break the
// chat. Read operations used by /debug (getSessionTelemetry, getAllTelemetry)
// deliberately let Redis errors propagate so /debug can surface them.

import { Redis } from "@upstash/redis";
import { tasks } from "./mockData";

export type TaskTelemetry = {
  msgCount: number;
  rawFileAttached: boolean;
  startedAt: number | null;
  submittedAt: number | null;
  deliverableChars: number | null;
};

export type SessionTelemetry = {
  accessKey: string;
  tasks: Record<string, TaskTelemetry>;
};

const KEY_PREFIX = "2skill:demo:t:";
const INDEX_KEY = "2skill:demo:keys";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function taskKey(accessKey: string, taskId: string): string {
  return `${KEY_PREFIX}${accessKey}:${taskId}`;
}

// ---- Backend selection (once, at module load) ----

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis: Redis | null =
  redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (!redis) {
  console.warn(
    "[telemetryStore] No Upstash Redis credentials found (checked " +
      "UPSTASH_REDIS_REST_URL/TOKEN and KV_REST_API_URL/TOKEN) - falling back " +
      "to an in-memory store. Telemetry and the message cap will NOT persist " +
      "across serverless instances or redeploys."
  );
}

export function backendName(): "redis" | "memory" {
  return redis ? "redis" : "memory";
}

// ---- In-memory fallback ----

type MemoryTaskUsage = {
  msgCount: number;
  rawFileAttached: boolean;
  startedAt: number | null;
  submittedAt: number | null;
  deliverableChars: number | null;
};

type MemoryStore = Record<string, Record<string, MemoryTaskUsage>>;

const globalForMemory = globalThis as unknown as {
  __telemetryMemory?: MemoryStore;
};

function getMemoryStore(): MemoryStore {
  if (!globalForMemory.__telemetryMemory) {
    globalForMemory.__telemetryMemory = {};
  }
  return globalForMemory.__telemetryMemory;
}

function emptyMemoryUsage(): MemoryTaskUsage {
  return {
    msgCount: 0,
    rawFileAttached: false,
    startedAt: null,
    submittedAt: null,
    deliverableChars: null,
  };
}

function getMemoryTaskUsage(accessKey: string, taskId: string): MemoryTaskUsage {
  const store = getMemoryStore();
  if (!store[accessKey]) store[accessKey] = {};
  if (!store[accessKey][taskId]) store[accessKey][taskId] = emptyMemoryUsage();
  return store[accessKey][taskId];
}

// The Upstash REST client auto-deserializes hash field values - a value
// written as the string "1" can come back as the number 1, not the string
// "1". Every field here is read defensively so it works regardless of which
// shape the client hands back.
function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
}

function parseHash(
  data: Record<string, unknown> | null | undefined
): TaskTelemetry {
  return {
    msgCount: toNumberOrNull(data?.msgCount) ?? 0,
    rawFileAttached:
      data?.rawFileAttached === "1" || data?.rawFileAttached === 1,
    startedAt: toNumberOrNull(data?.startedAt),
    submittedAt: toNumberOrNull(data?.submittedAt),
    deliverableChars: toNumberOrNull(data?.deliverableChars),
  };
}

// ---- Writes: always try Redis first, fall back to memory, never throw ----

export async function incrementUserMessage(
  accessKey: string,
  taskId: string
): Promise<number> {
  if (redis) {
    try {
      const key = taskKey(accessKey, taskId);
      const n = await redis.hincrby(key, "msgCount", 1);
      await redis.sadd(INDEX_KEY, accessKey);
      await redis.expire(key, TTL_SECONDS);
      return n;
    } catch (err) {
      console.error(
        "[telemetryStore] Redis incrementUserMessage failed, falling back to memory:",
        err
      );
    }
  }
  const usage = getMemoryTaskUsage(accessKey, taskId);
  usage.msgCount += 1;
  return usage.msgCount;
}

export async function decrementUserMessage(
  accessKey: string,
  taskId: string
): Promise<void> {
  if (redis) {
    try {
      const key = taskKey(accessKey, taskId);
      await redis.hincrby(key, "msgCount", -1);
      await redis.expire(key, TTL_SECONDS);
      return;
    } catch (err) {
      console.error(
        "[telemetryStore] Redis decrementUserMessage failed, falling back to memory:",
        err
      );
    }
  }
  const usage = getMemoryTaskUsage(accessKey, taskId);
  usage.msgCount = Math.max(0, usage.msgCount - 1);
}

export async function recordRawFileAttached(
  accessKey: string,
  taskId: string
): Promise<void> {
  if (redis) {
    try {
      const key = taskKey(accessKey, taskId);
      await redis.hset(key, { rawFileAttached: "1" });
      await redis.sadd(INDEX_KEY, accessKey);
      await redis.expire(key, TTL_SECONDS);
      return;
    } catch (err) {
      console.error(
        "[telemetryStore] Redis recordRawFileAttached failed, falling back to memory:",
        err
      );
    }
  }
  getMemoryTaskUsage(accessKey, taskId).rawFileAttached = true;
}

export async function recordTaskStarted(
  accessKey: string,
  taskId: string
): Promise<void> {
  if (redis) {
    try {
      const key = taskKey(accessKey, taskId);
      // Atomic "set only if unset" - avoids a read-then-write race.
      await redis.hsetnx(key, "startedAt", String(Date.now()));
      await redis.sadd(INDEX_KEY, accessKey);
      await redis.expire(key, TTL_SECONDS);
      return;
    } catch (err) {
      console.error(
        "[telemetryStore] Redis recordTaskStarted failed, falling back to memory:",
        err
      );
    }
  }
  const usage = getMemoryTaskUsage(accessKey, taskId);
  if (!usage.startedAt) usage.startedAt = Date.now();
}

export async function recordTaskSubmitted(
  accessKey: string,
  taskId: string,
  deliverableChars: number
): Promise<void> {
  if (redis) {
    try {
      const key = taskKey(accessKey, taskId);
      await redis.hset(key, {
        submittedAt: String(Date.now()),
        deliverableChars: String(deliverableChars),
      });
      await redis.sadd(INDEX_KEY, accessKey);
      await redis.expire(key, TTL_SECONDS);
      return;
    } catch (err) {
      console.error(
        "[telemetryStore] Redis recordTaskSubmitted failed, falling back to memory:",
        err
      );
    }
  }
  const usage = getMemoryTaskUsage(accessKey, taskId);
  usage.submittedAt = Date.now();
  usage.deliverableChars = deliverableChars;
}

export async function resetSession(accessKey: string): Promise<void> {
  if (redis) {
    try {
      const keys = tasks.map((t) => taskKey(accessKey, t.id));
      if (keys.length > 0) await redis.del(...keys);
      await redis.srem(INDEX_KEY, accessKey);
      return;
    } catch (err) {
      console.error(
        "[telemetryStore] Redis resetSession failed, falling back to memory:",
        err
      );
    }
  }
  delete getMemoryStore()[accessKey];
}

// ---- Reads for /debug: let Redis errors propagate so they surface loudly ----

export async function getSessionTelemetry(
  accessKey: string
): Promise<SessionTelemetry> {
  const result: SessionTelemetry = { accessKey, tasks: {} };

  if (redis) {
    for (const t of tasks) {
      const data = await redis.hgetall<Record<string, unknown>>(
        taskKey(accessKey, t.id)
      );
      result.tasks[t.id] = parseHash(data);
    }
    return result;
  }

  const store = getMemoryStore();
  for (const t of tasks) {
    const u = store[accessKey]?.[t.id];
    result.tasks[t.id] = u
      ? { ...u }
      : emptyMemoryUsage();
  }
  return result;
}

export async function getAllTelemetry(): Promise<SessionTelemetry[]> {
  if (redis) {
    const keys = await redis.smembers(INDEX_KEY);
    return Promise.all(keys.map((k) => getSessionTelemetry(k)));
  }

  const store = getMemoryStore();
  return Promise.all(Object.keys(store).map((k) => getSessionTelemetry(k)));
}
