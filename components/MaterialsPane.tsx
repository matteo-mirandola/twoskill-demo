"use client";

import { useState } from "react";
import Modal from "./Modal";
import Markdown from "./Markdown";
import type { MaterialDef } from "@/lib/mockData";

type CsvPreviewData = { headers: string[]; rows: string[][]; totalRows: number };

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

  if (materials.length === 0) {
    return (
      <p className="text-sm italic text-[var(--foreground-subtle)]">
        No materials — everything you need is in the brief.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {materials.map((m) =>
        m.kind === "csv" ? (
          <div
            key={m.id}
            className="rounded-lg border border-[var(--border)] bg-white p-4"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <FileIcon />
              {m.filename}
            </div>
            <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
              {m.sizeLabel}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--foreground-muted)]">
              {m.note}
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={`/${m.filename}`}
                download
                className="btn-press flex-1 rounded-md border border-[var(--border-strong)] bg-white px-3 py-1.5 text-center text-xs font-medium text-[var(--foreground)] hover:bg-black/[.03]"
              >
                Download
              </a>
              <button
                onClick={openCsvPreview}
                className="btn-press flex-1 rounded-md bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft-border)]"
              >
                Preview
              </button>
            </div>
          </div>
        ) : (
          <button
            key={m.id}
            onClick={() => setOpenSourceId(m.id)}
            className="btn-press rounded-lg border border-[var(--border)] bg-white p-4 text-left hover:border-[var(--border-strong)]"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--accent)]">
              {m.label}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
              {m.title}
            </p>
          </button>
        )
      )}

      {previewCsv && (
        <Modal
          title="payments_march.csv — preview"
          onClose={() => setPreviewCsv(false)}
          wide
        >
          {loadingCsv || !csvData ? (
            <p className="text-sm text-[var(--foreground-muted)]">
              Loading preview…
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
                          className="border-b border-[var(--border)] bg-black/[.02] px-2.5 py-1.5 text-left font-semibold"
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
                … {csvData.totalRows.toLocaleString("en-US")} rows total
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

function FileIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-[var(--foreground-muted)]"
    >
      <path
        d="M5 2.5h7l3 3v12a1 1 0 01-1 1H5a1 1 0 01-1-1v-14a1 1 0 011-1z"
        strokeLinejoin="round"
      />
      <path d="M12 2.5v3a1 1 0 001 1h3" strokeLinejoin="round" />
    </svg>
  );
}
