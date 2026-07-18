// Detects SENSITIVE FIELD VALUES (client name / client domain from
// alertas_junio_2026.csv) pasted into a chat message - not "text that looks
// like a CSV". Row count, comma density, and CSV shape are deliberately not
// signals: a user who strips the two sensitive columns and pastes 832 rows
// of alerta_id/categoria/severidad/estado has done the competent thing and
// must not trigger this. Pure and side-effect free per call; the only "side
// effect" is building the client-name/domain lists once at module load.

import { getCsvText } from "./csv";

export type ScanResult = {
  clientNameCount: number; // distinct client names matched
  domainCount: number; // distinct client domains matched
  triggered: boolean;
  matchedFields: ("client_name" | "client_domain")[];
};

// One client name in a sentence is normal work; five or more distinct
// sensitive values in a single message is a bulk data transfer, not a
// mention.
const THRESHOLD = 5;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function distinctColumnValues(columnName: string): string[] {
  const lines = getCsvText()
    .split(/\r\n|\n/)
    .filter((line) => line.length > 0);
  const headers = lines[0].split(",");
  const idx = headers.indexOf(columnName);

  const values = new Set<string>();
  for (const line of lines.slice(1)) {
    const value = line.split(",")[idx]?.trim();
    if (value) values.add(value);
  }
  return Array.from(values);
}

function buildMatchers(values: string[]): RegExp[] {
  return values.map((value) => new RegExp(`\\b${escapeRegExp(value)}\\b`, "i"));
}

// Built once at module load (6 distinct client names, 6 distinct domains) -
// matched case-insensitively as whole strings against every incoming
// message.
const CLIENT_NAME_MATCHERS = buildMatchers(distinctColumnValues("cliente"));
const CLIENT_DOMAIN_MATCHERS = buildMatchers(distinctColumnValues("dominio_cliente"));

function countMatches(text: string, matchers: RegExp[]): number {
  return matchers.reduce((count, matcher) => count + (matcher.test(text) ? 1 : 0), 0);
}

export function scanForSensitiveData(text: string): ScanResult {
  const clientNameCount = countMatches(text, CLIENT_NAME_MATCHERS);
  const domainCount = countMatches(text, CLIENT_DOMAIN_MATCHERS);

  const matchedFields: ScanResult["matchedFields"] = [];
  if (clientNameCount > 0) matchedFields.push("client_name");
  if (domainCount > 0) matchedFields.push("client_domain");

  const triggered = clientNameCount >= THRESHOLD || domainCount >= THRESHOLD;

  return { clientNameCount, domainCount, triggered, matchedFields };
}
