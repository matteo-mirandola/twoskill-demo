export default function DeliverablePanel({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Empieza a escribir…"
      className="thin-scroll min-h-[220px] w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[14.5px] leading-relaxed text-[var(--foreground)] shadow-[var(--card-shadow-sm)] outline-none transition-colors focus:border-[var(--accent)] disabled:bg-[var(--background)] disabled:text-[var(--foreground-subtle)]"
    />
  );
}
