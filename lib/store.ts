// In-memory only, on purpose: this is a pitch prototype with no database.
// The usage map resets whenever the server process restarts (a redeploy, or
// a fresh cold-started serverless instance) - acceptable here since the
// prototype's telemetry only needs to survive one live demo session.

export type TaskUsage = {
  userMessageCount: number;
  rawFileAttached: boolean;
  wallClockSeconds: number | null;
  deliverableLength: number | null;
};

type UsageMap = Record<string, Record<string, TaskUsage>>;

const globalForStore = globalThis as unknown as { __usageStore?: UsageMap };

function getStore(): UsageMap {
  if (!globalForStore.__usageStore) {
    globalForStore.__usageStore = {};
  }
  return globalForStore.__usageStore;
}

function emptyUsage(): TaskUsage {
  return {
    userMessageCount: 0,
    rawFileAttached: false,
    wallClockSeconds: null,
    deliverableLength: null,
  };
}

function getTaskUsage(accessKey: string, taskId: string): TaskUsage {
  const store = getStore();
  if (!store[accessKey]) store[accessKey] = {};
  if (!store[accessKey][taskId]) store[accessKey][taskId] = emptyUsage();
  return store[accessKey][taskId];
}

export function recordUserMessageCount(
  accessKey: string,
  taskId: string,
  count: number
) {
  getTaskUsage(accessKey, taskId).userMessageCount = count;
}

export function recordRawFileAttached(accessKey: string, taskId: string) {
  getTaskUsage(accessKey, taskId).rawFileAttached = true;
}

export function recordTelemetry(
  accessKey: string,
  taskId: string,
  data: { wallClockSeconds?: number; deliverableLength?: number }
) {
  const usage = getTaskUsage(accessKey, taskId);
  if (data.wallClockSeconds !== undefined) {
    usage.wallClockSeconds = data.wallClockSeconds;
  }
  if (data.deliverableLength !== undefined) {
    usage.deliverableLength = data.deliverableLength;
  }
}

export function getUsageForKey(accessKey: string): Record<string, TaskUsage> {
  return getStore()[accessKey] ?? {};
}
