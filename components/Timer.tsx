"use client";

import { useEffect, useState } from "react";

function format(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
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

  const elapsed = Math.floor((now - startedAt) / 1000);
  const budget = minutes * 60;
  const isOver = elapsed > budget;
  const isAmber = !isOver && elapsed >= budget - 120;

  const dotColor = isOver
    ? "bg-[var(--red)]"
    : isAmber
      ? "bg-[var(--amber)]"
      : "bg-[var(--accent)]";
  const textColor = isOver
    ? "text-[var(--red)]"
    : isAmber
      ? "text-[var(--amber)]"
      : "text-[var(--foreground)]";

  return (
    <span
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 shadow-[var(--card-shadow-sm)]"
    >
      <span className={`blink-dot h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span
        className={`text-[13px] font-semibold tabular-nums tracking-wide transition-colors duration-300 ${textColor}`}
      >
        {format(elapsed)} elapsed
      </span>
    </span>
  );
}
