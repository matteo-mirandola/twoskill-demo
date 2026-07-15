"use client";

import { useEffect, useState } from "react";

function format(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Timer({
  minutes,
  startedAt,
}: {
  minutes: number;
  startedAt: number | null;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    const kickoff = setTimeout(() => setNow(Date.now()), 0);
    return () => {
      clearInterval(id);
      clearTimeout(kickoff);
    };
  }, []);

  if (!startedAt || now === null) return null;

  const remaining = minutes * 60 - Math.floor((now - startedAt) / 1000);
  const isOver = remaining < 0;
  const isAmber = !isOver && remaining <= 120;

  const colorClass = isOver
    ? "text-[var(--red)] bg-[var(--red-soft)] border-[var(--red-soft-border)]"
    : isAmber
      ? "text-[var(--amber)] bg-[var(--amber-soft)] border-[var(--amber-soft-border)]"
      : "text-[var(--foreground-muted)] bg-black/[.03] border-transparent";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors duration-300 ${colorClass}`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6v4l2.5 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {isOver ? `+${format(remaining)} over` : format(remaining)}
    </span>
  );
}
