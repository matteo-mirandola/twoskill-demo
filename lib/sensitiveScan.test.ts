// Plain script, no test framework required.
// Run with: npx tsx lib/sensitiveScan.test.ts
// (or: node --experimental-strip-types lib/sensitiveScan.test.ts)

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { scanForSensitiveData } from "./sensitiveScan";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const csvPath = path.join(process.cwd(), "public", "payments_march.csv");
const csvText = fs.readFileSync(csvPath, "utf-8");
const csvLines = csvText.split(/\r\n|\n/).filter((l) => l.length > 0);
const headers = csvLines[0].split(",");
const rows = csvLines.slice(1).map((line) => line.split(","));

test("full raw CSV text triggers on all three fields", () => {
  const result = scanForSensitiveData(csvText);
  assert.equal(result.triggered, true);
  assert.deepEqual(
    [...result.matchedFields].sort(),
    ["client_name", "email", "iban"].sort()
  );
  assert.ok(result.ibanCount >= 5);
  assert.ok(result.emailCount >= 5);
  assert.ok(result.clientNameCount >= 5);
});

test("CSV with sensitive columns stripped never triggers", () => {
  const idx = {
    transaction_id: headers.indexOf("transaction_id"),
    amount: headers.indexOf("amount"),
    category: headers.indexOf("category"),
    status: headers.indexOf("status"),
  };
  const strippedLines = [
    "transaction_id,amount,category,status",
    ...rows.map(
      (r) =>
        `${r[idx.transaction_id]},${r[idx.amount]},${r[idx.category]},${
          r[idx.status]
        }`
    ),
  ];
  assert.equal(strippedLines.length - 1, 1904);
  const strippedText = strippedLines.join("\n");

  const result = scanForSensitiveData(strippedText);
  assert.equal(result.triggered, false);
  assert.deepEqual(result.matchedFields, []);
  assert.equal(result.ibanCount, 0);
  assert.equal(result.emailCount, 0);
  assert.equal(result.clientNameCount, 0);
});

test("aggregated category table does not trigger", () => {
  const table = `Category | Settled total
Subscriptions | 385000
Professional Services | 298000
Hardware | 176000
Marketing | 154000
Logistics | 99000
Training | 55000`;
  const result = scanForSensitiveData(table);
  assert.equal(result.triggered, false);
});

test("mentioning a single client by name does not trigger", () => {
  const message =
    "Quick note: Marlin Foods Ltd disputed one of their March charges, worth flagging for management.";
  const result = scanForSensitiveData(message);
  assert.equal(result.triggered, false);
  assert.equal(result.clientNameCount, 1);
  assert.deepEqual(result.matchedFields, ["client_name"]);
});

test("6 distinct IBANs triggers", () => {
  const ibans = [
    "IT68 1448 1853 923755618874",
    "NL44 9314 4524 629851082595",
    "NL62 5223 4096 104390543744",
    "FR35 7302 8916 236313758032",
    "DE10 2226 5117 818164521570",
    "DE11 2010 4641 267015453083",
  ];
  const message = `Here are the IBANs: ${ibans.join(", ")}`;
  const result = scanForSensitiveData(message);
  assert.equal(result.ibanCount, 6);
  assert.equal(result.triggered, true);
  assert.deepEqual(result.matchedFields, ["iban"]);
});

test("same IBAN repeated many times counts as distinct, not triggered", () => {
  const iban = "IT68 1448 1853 923755618874";
  const message = Array.from({ length: 20 }, () => iban).join(", ");
  const result = scanForSensitiveData(message);
  assert.equal(result.ibanCount, 1);
  assert.equal(result.triggered, false);
});

console.log(`\n${passed} tests passed`);
