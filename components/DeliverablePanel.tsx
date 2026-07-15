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
    <div className="flex h-full min-h-0 flex-1 flex-col p-3 pt-0">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Start writing…"
        className="thin-scroll flex-1 resize-none rounded-lg border border-[var(--border)] bg-white p-3 text-sm leading-6 text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:bg-black/[.02] disabled:text-[var(--foreground-subtle)]"
      />
    </div>
  );
}
