// PDF cache for generated reports. Mirrors lib/telemetryStore.ts backend
// selection: Upstash Redis when credentials are present (required in
// production — serverless instances don't share memory, so the instance
// serving the download is rarely the one that generated the PDF), otherwise
// an in-memory Map (fine for `npm run dev`).

import { Redis } from "@upstash/redis";

const KEY_PREFIX = "2skill:demo:pdf:";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
// Marks the value as base64 so the Upstash client's auto-deserialization
// can never misread it (e.g. an all-digit string coming back as a number).
const B64_MARKER = "b64:";

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis: Redis | null =
  redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (!redis) {
  console.warn(
    "[pdfCache] No Upstash Redis credentials found - falling back to an " +
      "in-memory cache. Report downloads will NOT work reliably on " +
      "serverless deployments (the download may hit a different instance " +
      "than the one that generated the PDF)."
  );
}

const globalForPdf = globalThis as unknown as { __reportPdfCache?: Map<string, Buffer> };

function memoryCache(): Map<string, Buffer> {
  if (!globalForPdf.__reportPdfCache) globalForPdf.__reportPdfCache = new Map();
  return globalForPdf.__reportPdfCache;
}

export async function storeReportPdf(accessKey: string, pdf: Buffer): Promise<void> {
  if (redis) {
    try {
      await redis.set(KEY_PREFIX + accessKey, B64_MARKER + pdf.toString("base64"), {
        ex: TTL_SECONDS,
      });
      return;
    } catch (err) {
      console.error("[pdfCache] Redis store failed, falling back to memory:", err);
    }
  }
  memoryCache().set(accessKey, pdf);
}

export async function getReportPdf(accessKey: string): Promise<Buffer | undefined> {
  if (redis) {
    try {
      const value = await redis.get<string>(KEY_PREFIX + accessKey);
      if (typeof value === "string" && value.startsWith(B64_MARKER)) {
        return Buffer.from(value.slice(B64_MARKER.length), "base64");
      }
    } catch (err) {
      console.error("[pdfCache] Redis read failed, falling back to memory:", err);
    }
  }
  return memoryCache().get(accessKey);
}
