import { isValidAccessKey } from "@/lib/auth";
import { getUsageForKey } from "@/lib/store";
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

  const usage = getUsageForKey(k as string);

  return (
    <div style={{ padding: 24, fontFamily: "monospace", fontSize: 13 }}>
      <h1>Telemetry — key: {k}</h1>
      <p style={{ color: "#666", maxWidth: 600 }}>
        In-memory only — resets on server restart / redeploy, or may vary
        across serverless instances. Acceptable for a pitch prototype.
      </p>
      <table
        border={1}
        cellPadding={6}
        style={{ borderCollapse: "collapse", marginTop: 12 }}
      >
        <thead>
          <tr>
            <th>Task</th>
            <th>User messages</th>
            <th>Raw file attached</th>
            <th>Wall-clock time</th>
            <th>Deliverable length</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const u = usage[t.id];
            return (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{u?.userMessageCount ?? 0}</td>
                <td>{u?.rawFileAttached ? "yes" : "no"}</td>
                <td>
                  {u?.wallClockSeconds != null ? `${u.wallClockSeconds}s` : "—"}
                </td>
                <td>
                  {u?.deliverableLength != null
                    ? `${u.deliverableLength} chars`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
