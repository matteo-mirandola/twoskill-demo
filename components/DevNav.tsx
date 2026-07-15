"use client";

import { useState } from "react";
import { tasks } from "@/lib/mockData";

export default function DevNav({
  currentStep,
  onJump,
  onReset,
  onPrefill,
}: {
  currentStep: number;
  onJump: (step: number) => void;
  onReset: () => void;
  onPrefill: () => void;
}) {
  const [open, setOpen] = useState(false);
  const screens = ["Intake", ...tasks.map((t) => t.title), "Done"];

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="fade-in mb-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Dev nav
          </p>
          <div className="flex flex-col gap-1">
            {screens.map((label, i) => (
              <button
                key={label}
                onClick={() => onJump(i)}
                className={`btn-press rounded-md px-2 py-1.5 text-left text-xs ${
                  i === currentStep
                    ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                    : "text-[var(--foreground)] hover:bg-black/[.04]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-1 border-t border-[var(--border)] pt-2">
            <button
              onClick={onPrefill}
              className="btn-press rounded-md px-2 py-1.5 text-left text-xs text-[var(--foreground)] hover:bg-black/[.04]"
            >
              Prefill sample deliverable
            </button>
            <button
              onClick={onReset}
              className="btn-press rounded-md px-2 py-1.5 text-left text-xs text-[var(--red)] hover:bg-[var(--red-soft)]"
            >
              Reset session
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-press flex h-11 w-11 items-center justify-center rounded-full bg-[var(--foreground)] text-white shadow-lg"
        aria-label="Dev navigation"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path
            d="M10 2v3M10 15v3M4.2 4.2l2.1 2.1M13.7 13.7l2.1 2.1M2 10h3M15 10h3M4.2 15.8l2.1-2.1M13.7 6.3l2.1-2.1"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="3" />
        </svg>
      </button>
    </div>
  );
}
