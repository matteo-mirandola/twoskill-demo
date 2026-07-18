import { isValidAccessKey } from "@/lib/auth";
import {
  backendName,
  getAllTelemetry,
  type SessionTelemetry,
} from "@/lib/telemetryStore";
import { tasks } from "@/lib/mockData";

export default async function DebugPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const k = typeof params.k === "string" ? params.k : null;

  if (!isValidAccessKey(k)) {
    return (
      <div style={{ padding: 24, fontFamily: "monospace" }}>
        Invalid or missing key.
      </div>
    );
  }

  let sessions: SessionTelemetry[] = [];
  let readError: string | null = null;
  try {
    sessions = await getAllTelemetry();
  } catch (err) {
    readError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div style={{ padding: 24, fontFamily: "monospace", fontSize: 13 }}>
      <h1>Telemetry</h1>
      <p style={{ color: "#666" }}>
        store:{" "}
        {backendName() === "redis" ? "redis" : "memory (non-persistent)"}
      </p>
      {readError && (
        <p style={{ color: "crimson" }}>
          Error reading telemetry store: {readError}
        </p>
      )}
      <table
        border={1}
        cellPadding={6}
        style={{ borderCollapse: "collapse", marginTop: 12 }}
      >
        <thead>
          <tr>
            <th>Key</th>
            <th>Task</th>
            <th>User messages</th>
            <th>Raw file attached</th>
            <th>Raw paste detected</th>
            <th>Pasted counts</th>
            <th>Wall-clock time</th>
            <th>Deliverable length</th>
          </tr>
        </thead>
        <tbody>
          {sessions.flatMap((session) =>
            tasks.map((t) => {
              const u = session.tasks[t.id];
              const wallClockSeconds =
                u?.startedAt != null && u?.submittedAt != null
                  ? Math.round((u.submittedAt - u.startedAt) / 1000)
                  : null;
              return (
                <tr key={`${session.accessKey}:${t.id}`}>
                  <td>{session.accessKey}</td>
                  <td>{t.title}</td>
                  <td>{u?.msgCount ?? 0}</td>
                  <td>{u?.rawFileAttached ? "yes" : "no"}</td>
                  <td>{u?.rawPasteDetected ? "yes" : "no"}</td>
                  <td>
                    {u?.rawPasteDetected
                      ? `names ${u.pastedClientNameCount ?? 0} · domains ${
                          u.pastedClientDomainCount ?? 0
                        }`
                      : "—"}
                  </td>
                  <td>
                    {wallClockSeconds != null ? `${wallClockSeconds}s` : "—"}
                  </td>
                  <td>
                    {u?.deliverableChars != null
                      ? `${u.deliverableChars} chars`
                      : "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
