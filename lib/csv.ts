import fs from "node:fs";
import path from "node:path";

// Cached on globalThis so we only hit disk once per server process, and so
// the value survives Next.js dev-mode module hot-reloading.
const globalForCsv = globalThis as unknown as { __csvText?: string };

function readCsvFromDisk(): string {
  const filePath = path.join(process.cwd(), "public", "alertas_junio_2026.csv");
  return fs.readFileSync(filePath, "utf-8");
}

export function getCsvText(): string {
  if (!globalForCsv.__csvText) {
    globalForCsv.__csvText = readCsvFromDisk();
  }
  return globalForCsv.__csvText;
}

// Minimal CSV line parser - the fixture has no quoted/escaped commas.
function parseCsvLine(line: string): string[] {
  return line.split(",");
}

export function getCsvPreview(limit = 15): {
  headers: string[];
  rows: string[][];
  totalRows: number;
} {
  const text = getCsvText();
  const lines = text.split(/\r\n|\n/).filter((l) => l.length > 0);
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1, 1 + limit).map(parseCsvLine);
  return { headers, rows, totalRows: lines.length - 1 };
}
