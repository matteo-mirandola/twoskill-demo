import { isValidAccessKey } from "@/lib/auth";
import {
  backendName,
  getAllAccessKeys,
  getAllTelemetry,
  type SessionTelemetry,
} from "@/lib/telemetryStore";
import { getAllSessionData, type StoredSessionData } from "@/lib/sessionDataStore";
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
  let sessionData: StoredSessionData[] = [];
  let readError: string | null = null;
  try {
    sessions = await getAllTelemetry();
    sessionData = await getAllSessionData(await getAllAccessKeys());
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

      <h1 style={{ marginTop: 32 }}>Saved session data</h1>
      <p style={{ color: "#666" }}>
        Profiling answers, full AI transcripts and final deliverables, saved
        once the participant generates their report.
      </p>
      {sessionData.length === 0 && <p>No sessions saved yet.</p>}
      {sessionData.map((session) => (
        <details key={session.accessKey} style={{ marginBottom: 16 }}>
          <summary>
            {session.accessKey} — saved {new Date(session.savedAt).toLocaleString()}
          </summary>
          <div style={{ padding: 12 }}>
            <h3>Profiling answers (intake)</h3>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(session.intakeAnswers, null, 2)}
            </pre>
            {tasks.map((t) => {
              const taskData = session.tasks[t.id];
              if (!taskData) return null;
              return (
                <div key={t.id} style={{ marginTop: 12 }}>
                  <h3>{t.title}</h3>
                  <h4>AI transcript (input/output)</h4>
                  {taskData.messages.length === 0 && <p>(no messages)</p>}
                  {taskData.messages.map((m, i) => (
                    <pre key={i} style={{ whiteSpace: "pre-wrap" }}>
                      {m.role === "user" ? "USER" : "AI"}
                      {m.attachedFile ? ` [attached: ${m.attachedFileName ?? "file"}]` : ""}
                      {": "}
                      {m.content}
                    </pre>
                  ))}
                  {taskData.deliverable !== null && (
                    <>
                      <h4>Deliverable</h4>
                      <pre style={{ whiteSpace: "pre-wrap" }}>
                        {taskData.deliverable || "(empty)"}
                      </pre>
                    </>
                  )}
                  {taskData.slides !== null && taskData.slides.length > 0 && (
                    <>
                      <h4>Slides</h4>
                      {taskData.slides.map((s, i) => (
                        <pre key={i} style={{ whiteSpace: "pre-wrap" }}>
                          {`--- Slide ${i + 1} ---\n${s.title}\n${s.bullets}`}
                        </pre>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}
