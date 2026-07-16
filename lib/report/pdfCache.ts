// In-memory PDF cache, same tradeoff as lib/store.ts: survives for the life
// of the server process, which is enough for a participant to download their
// report right after finishing.

const globalForPdf = globalThis as unknown as { __reportPdfCache?: Map<string, Buffer> };

function cache(): Map<string, Buffer> {
  if (!globalForPdf.__reportPdfCache) globalForPdf.__reportPdfCache = new Map();
  return globalForPdf.__reportPdfCache;
}

export function storeReportPdf(accessKey: string, pdf: Buffer): void {
  cache().set(accessKey, pdf);
}

export function getReportPdf(accessKey: string): Buffer | undefined {
  return cache().get(accessKey);
}
