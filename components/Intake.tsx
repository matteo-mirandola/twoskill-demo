"use client";

import { useState } from "react";
import { intakeQuestions } from "@/lib/mockData";
import type { IntakeAnswers } from "@/lib/types";

export default function Intake({
  initialAnswers,
  onStart,
}: {
  initialAnswers: IntakeAnswers;
  onStart: (answers: IntakeAnswers) => void;
}) {
  const [answers, setAnswers] = useState<IntakeAnswers>(initialAnswers);

  function isAnswered(q: (typeof intakeQuestions)[number]) {
    const v = answers[q.id];
    if (q.type === "multi") {
      if (!Array.isArray(v) || v.length === 0) return false;
      if (v.includes("Other")) {
        const other = answers[`${q.id}__other`];
        return typeof other === "string" && other.trim().length > 0;
      }
      return true;
    }
    if (q.type === "scale") return typeof v === "number";
    if (typeof v !== "string" || v.length === 0) return false;
    if (v === "Other") {
      const other = answers[`${q.id}__other`];
      return typeof other === "string" && other.trim().length > 0;
    }
    return true;
  }

  const allAnswered = intakeQuestions.every(isAnswered);

  function setSingle(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }
  function toggleMulti(id: string, value: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [id]: next };
    });
  }
  function setScale(id: string, value: number) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div className="fade-in mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        Welcome
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
        This assessment takes about 30 minutes and is built around three real
        work tasks.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {intakeQuestions.map((q) => (
          <div key={q.id}>
            <h3 className="mb-3 text-sm font-medium text-[var(--foreground)]">
              {q.question}
            </h3>

            {q.type === "single" && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSingle(q.id, opt)}
                        className={`btn-press rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                            : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {answers[q.id] === "Other" && (
                  <input
                    type="text"
                    value={(answers[`${q.id}__other`] as string) ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [`${q.id}__other`]: e.target.value,
                      }))
                    }
                    placeholder="Please specify…"
                    className="fade-in mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                )}
              </>
            )}

            {q.type === "multi" && (
              <>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected =
                      Array.isArray(answers[q.id]) &&
                      (answers[q.id] as string[]).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleMulti(q.id, opt)}
                        className={`btn-press rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                          selected
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                            : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {Array.isArray(answers[q.id]) &&
                  (answers[q.id] as string[]).includes("Other") && (
                    <input
                      type="text"
                      value={(answers[`${q.id}__other`] as string) ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [`${q.id}__other`]: e.target.value,
                        }))
                      }
                      placeholder="Please specify…"
                      className="fade-in mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
                    />
                  )}
              </>
            )}

            {q.type === "scale" && (
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from(
                  { length: q.max - q.min + 1 },
                  (_, i) => q.min + i
                ).map((n) => {
                  const selected = answers[q.id] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScale(q.id, n)}
                      className={`btn-press flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)] font-medium text-white"
                          : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!allAnswered}
        onClick={() => onStart(answers)}
        className="btn-press btn-hover-lift mt-10 w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
      >
        Start
      </button>
    </div>
  );
}
