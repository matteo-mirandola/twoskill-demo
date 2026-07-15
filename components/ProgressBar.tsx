const STEPS = ["Intake", "Task 1", "Task 2", "Task 3", "Done"];

export default function ProgressBar({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="w-full shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center">
        {STEPS.map((label, i) => {
          const state =
            i < stepIndex ? "done" : i === stepIndex ? "current" : "upcoming";
          return (
            <div
              key={label}
              className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors duration-300 ${
                    state === "done"
                      ? "bg-[var(--accent)] text-white"
                      : state === "current"
                        ? "border-2 border-[var(--accent)] text-[var(--accent)]"
                        : "border border-[var(--border-strong)] text-[var(--foreground-subtle)]"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-xs font-medium ${
                    state === "upcoming"
                      ? "text-[var(--foreground-subtle)]"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-3 h-px flex-1 bg-[var(--border)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
