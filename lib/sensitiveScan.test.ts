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

const csvPath = path.join(process.cwd(), "public", "alertas_junio_2026.csv");
const csvText = fs.readFileSync(csvPath, "utf-8");
const csvLines = csvText.split(/\r\n|\n/).filter((l) => l.length > 0);
const headers = csvLines[0].split(",");
const rows = csvLines.slice(1).map((line) => line.split(","));

test("full raw CSV text triggers on both fields", () => {
  const result = scanForSensitiveData(csvText);
  assert.equal(result.triggered, true);
  assert.deepEqual(
    [...result.matchedFields].sort(),
    ["client_domain", "client_name"].sort()
  );
  assert.ok(result.clientNameCount >= 5);
  assert.ok(result.domainCount >= 5);
});

test("CSV with sensitive columns stripped never triggers", () => {
  const idx = {
    alerta_id: headers.indexOf("alerta_id"),
    fecha_hora: headers.indexOf("fecha_hora"),
    categoria: headers.indexOf("categoria"),
    severidad: headers.indexOf("severidad"),
    estado: headers.indexOf("estado"),
  };
  const strippedLines = [
    "alerta_id,fecha_hora,categoria,severidad,estado",
    ...rows.map((r) =>
      [
        r[idx.alerta_id],
        r[idx.fecha_hora],
        r[idx.categoria],
        r[idx.severidad],
        r[idx.estado],
      ].join(",")
    ),
  ];
  assert.equal(strippedLines.length - 1, 832);
  const strippedText = strippedLines.join("\n");

  const result = scanForSensitiveData(strippedText);
  assert.equal(result.triggered, false);
  assert.deepEqual(result.matchedFields, []);
  assert.equal(result.clientNameCount, 0);
  assert.equal(result.domainCount, 0);
});

test("aggregated category table does not trigger", () => {
  const table = `Categoria | Total gestionadas
Phishing / correo malicioso | 186
Malware en endpoint | 153
Intento de suplantacion | 130
Acceso no autorizado | 96
Vulnerabilidad critica | 77
Fuga de datos (DLP) | 40
Navegacion no segura | 30`;
  const result = scanForSensitiveData(table);
  assert.equal(result.triggered, false);
});

test("mentioning a single client by name does not trigger", () => {
  const message =
    "Aviso rápido: Nexia Fintech concentra buena parte de los intentos de suplantación este mes, vale la pena avisar a dirección.";
  const result = scanForSensitiveData(message);
  assert.equal(result.triggered, false);
  assert.equal(result.clientNameCount, 1);
  assert.deepEqual(result.matchedFields, ["client_name"]);
});

test("6 distinct client domains triggers", () => {
  const domains = [
    "loredologistica.es",
    "gestoriavallbona.es",
    "nexiapay.com",
    "salazar-ortun.com",
    "clinicanervion.es",
    "acelor.es",
  ];
  const message = `Dominios afectados: ${domains.join(", ")}`;
  const result = scanForSensitiveData(message);
  assert.equal(result.domainCount, 6);
  assert.equal(result.triggered, true);
  assert.deepEqual(result.matchedFields, ["client_domain"]);
});

test("same domain repeated many times counts as distinct, not triggered", () => {
  const domain = "nexiapay.com";
  const message = Array.from({ length: 20 }, () => domain).join(", ");
  const result = scanForSensitiveData(message);
  assert.equal(result.domainCount, 1);
  assert.equal(result.triggered, false);
});

console.log(`\n${passed} tests passed`);
