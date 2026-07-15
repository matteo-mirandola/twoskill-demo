// Detects SENSITIVE FIELD VALUES (client_name / IBAN / contact_email from
// payments_march.csv) pasted into a chat message - not "text that looks like
// a CSV". Row count, comma density, and CSV shape are deliberately not
// signals: a user who strips the three sensitive columns and pastes 1,904
// rows of amount/category/status has done the competent thing and must not
// trigger this. Pure and side-effect free per call; the only "side effect"
// is building the client-name list once at module load.

import { getCsvText } from "./csv";

export type ScanResult = {
  ibanCount: number;
  emailCount: number;
  clientNameCount: number; // distinct client names matched
  triggered: boolean;
  matchedFields: ("iban" | "email" | "client_name")[];
};

// One client name in a sentence is normal work; five or more distinct
// sensitive values in a single message is a bulk data transfer, not a
// mention.
const THRESHOLD = 5;

// Matches the fixture's format: two letters, two digits, then groups of
// alphanumerics, with or without spaces (e.g. "IT68 1448 1853 923755618874").
const IBAN_REGEX = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{2,4}){2,8}\b/g;

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function loadDistinctClientNames(): string[] {
  const lines = getCsvText()
    .split(/\r\n|\n/)
    .filter((line) => line.length > 0);
  const headers = lines[0].split(",");
  const nameIdx = headers.indexOf("client_name");

  const names = new Set<string>();
  for (const line of lines.slice(1)) {
    const value = line.split(",")[nameIdx]?.trim();
    if (value) names.add(value);
  }
  return Array.from(names);
}

// Built once at module load (60 distinct names) - matched case-insensitively
// as whole strings against every incoming message.
const CLIENT_NAME_MATCHERS = loadDistinctClientNames().map(
  (name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, "i")
);

function countDistinctMatches(
  text: string,
  regex: RegExp,
  normalize: (match: string) => string
): number {
  const matches = text.match(regex) ?? [];
  return new Set(matches.map(normalize)).size;
}

export function scanForSensitiveData(text: string): ScanResult {
  const ibanCount = countDistinctMatches(text, IBAN_REGEX, (m) =>
    m.replace(/\s+/g, "").toUpperCase()
  );
  const emailCount = countDistinctMatches(text, EMAIL_REGEX, (m) =>
    m.toLowerCase()
  );
  const clientNameCount = CLIENT_NAME_MATCHERS.reduce(
    (count, matcher) => count + (matcher.test(text) ? 1 : 0),
    0
  );

  const matchedFields: ScanResult["matchedFields"] = [];
  if (ibanCount > 0) matchedFields.push("iban");
  if (emailCount > 0) matchedFields.push("email");
  if (clientNameCount > 0) matchedFields.push("client_name");

  const triggered =
    ibanCount >= THRESHOLD ||
    emailCount >= THRESHOLD ||
    clientNameCount >= THRESHOLD;

  return { ibanCount, emailCount, clientNameCount, triggered, matchedFields };
}
