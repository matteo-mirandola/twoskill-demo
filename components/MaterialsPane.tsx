"use client";

import { useState } from "react";
import Modal from "./Modal";
import Markdown from "./Markdown";
import type { MaterialDef } from "@/lib/mockData";

type CsvPreviewData = { headers: string[]; rows: string[][]; totalRows: number };

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "FILE" : filename.slice(idx + 1).toUpperCase();
}

export default function MaterialsPane({
  materials,
  accessKey,
}: {
  materials: MaterialDef[];
  accessKey: string;
}) {
  const [previewCsv, setPreviewCsv] = useState(false);
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CsvPreviewData | null>(null);
  const [loadingCsv, setLoadingCsv] = useState(false);

  async function openCsvPreview() {
    setPreviewCsv(true);
    if (!csvData) {
      setLoadingCsv(true);
      try {
        const res = await fetch(
          `/api/csv-preview?k=${encodeURIComponent(accessKey)}`
        );
        if (res.ok) setCsvData(await res.json());
      } finally {
        setLoadingCsv(false);
      }
    }
  }

  const openSource = materials.find(
    (m): m is Extract<MaterialDef, { kind: "source" }> =>
      m.kind === "source" && m.id === openSourceId
  );

  const csvMaterial = materials.find(
    (m): m is Extract<MaterialDef, { kind: "csv" }> => m.kind === "csv"
  );

  if (materials.length === 0) {
    return (
      <p className="text-sm italic text-[var(--foreground-subtle)]">
        Sin materiales — todo lo que necesitas está en el brief.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {materials.map((m) =>
        m.kind === "csv" ? (
          <div
            key={m.id}
            className="flex items-center gap-4 rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--card-shadow)]"
          >
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent)]">
              {getExtension(m.filename)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                {m.filename}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {m.sizeLabel} · {m.note}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <a
                href={`/${m.filename}`}
                download
                className="btn-press rounded-lg border-[1.5px] border-[var(--foreground)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)] hover:text-white"
              >
                Descargar
              </a>
              <button
                onClick={openCsvPreview}
                className="btn-press rounded-lg bg-[image:var(--accent-gradient)] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Vista previa
              </button>
            </div>
          </div>
        ) : (
          <button
            key={m.id}
            onClick={() => setOpenSourceId(m.id)}
            className="btn-press rounded-2xl bg-[var(--surface)] p-4 text-left shadow-[var(--card-shadow)]"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
              {m.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
              {m.title}
            </p>
          </button>
        )
      )}

      {previewCsv && (
        <Modal
          title={`${csvMaterial?.filename ?? "archivo"} — vista previa`}
          onClose={() => setPreviewCsv(false)}
          wide
        >
          {loadingCsv || !csvData ? (
            <p className="text-sm text-[var(--foreground-muted)]">
              Cargando vista previa…
            </p>
          ) : (
            <>
              <div className="thin-scroll overflow-x-auto rounded-md border border-[var(--border)]">
                <table className="w-full min-w-[600px] border-collapse text-xs">
                  <thead>
                    <tr>
                      {csvData.headers.map((h) => (
                        <th
                          key={h}
                          className="border-b border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-left font-semibold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="whitespace-nowrap border-b border-[var(--border)] px-2.5 py-1.5"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-[var(--foreground-subtle)]">
                … {csvData.totalRows.toLocaleString("es-ES")} filas en total
              </p>
            </>
          )}
        </Modal>
      )}

      {openSource && (
        <Modal
          title={openSource.label}
          onClose={() => setOpenSourceId(null)}
          wide
        >
          <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            {openSource.title}
          </p>
          <Markdown>{openSource.body}</Markdown>
        </Modal>
      )}
    </div>
  );
}
