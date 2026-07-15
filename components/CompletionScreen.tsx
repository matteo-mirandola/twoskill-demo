import { completionScreen } from "@/lib/mockData";

export default function CompletionScreen() {
  return (
    <div className="fade-in mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        <svg
          width="22"
          height="22"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-[var(--foreground)]">
        {completionScreen.title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
        {completionScreen.body}
      </p>
    </div>
  );
}
