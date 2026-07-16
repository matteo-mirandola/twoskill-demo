import { completionScreen } from "@/lib/mockData";
import type { ReportStatus } from "./AssessmentApp";

export default function CompletionScreen({
  reportStatus = "idle",
  email,
  downloadUrl,
  onRetry,
}: {
  reportStatus?: ReportStatus;
  email?: string | null;
  downloadUrl?: string | null;
  onRetry?: () => void;
}) {
  const statusBody =
    reportStatus === "sending"
      ? completionScreen.reportSending
      : reportStatus === "sent" && email
        ? completionScreen.reportSent.replace("{email}", email)
        : reportStatus === "error"
          ? completionScreen.reportError
          : completionScreen.body;

  return (
    <div className="fade-in mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {reportStatus === "sending" ? (
          <svg
            className="animate-spin"
            width="22"
            height="22"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M10 2a8 8 0 018 8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
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
        )}
      </div>
      <h1 className="text-xl font-semibold text-[var(--foreground)]">
        {completionScreen.title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
        {statusBody}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="btn-press btn-hover-lift rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white"
          >
            {completionScreen.reportDownload}
          </a>
        )}
        {reportStatus === "error" && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`btn-press rounded-lg px-6 py-2.5 text-sm font-semibold ${
              downloadUrl
                ? "border border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--border-strong)]"
                : "btn-hover-lift bg-[var(--accent)] text-white"
            }`}
          >
            {completionScreen.reportRetry}
          </button>
        )}
      </div>
    </div>
  );
}
