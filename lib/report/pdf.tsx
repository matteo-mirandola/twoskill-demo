import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { intakeQuestions } from "@/lib/mockData";
import type { IntakeAnswers } from "@/lib/types";
import type { ReportGrades, FindingStatus } from "./grading";

// Mirrors the app's palette in globals.css so the report reads as the same product.
const C = {
  foreground: "#18181b",
  muted: "#71717a",
  subtle: "#a1a1aa",
  border: "#e4e4e7",
  background: "#fafafa",
  accent: "#4f46e5",
  accentSoft: "#eef2ff",
  good: "#047857",
  goodSoft: "#ecfdf5",
  warning: "#b45309",
  warningSoft: "#fffbeb",
  critical: "#b91c1c",
  criticalSoft: "#fef2f2",
};

const STATUS: Record<FindingStatus, { label: string; color: string; soft: string }> = {
  passed: { label: "Passed", color: C.good, soft: C.goodSoft },
  partial: { label: "Partial", color: C.warning, soft: C.warningSoft },
  missed: { label: "Missed", color: C.critical, soft: C.criticalSoft },
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: C.foreground,
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 44,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 12,
    marginBottom: 20,
  },
  wordmark: { fontSize: 16, color: C.accent, fontFamily: "Helvetica-Bold" },
  headerMeta: { fontSize: 8.5, color: C.muted, textAlign: "right" },
  h1: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  hero: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  heroScore: { fontSize: 34, fontFamily: "Helvetica-Bold", color: C.accent, lineHeight: 1.1 },
  heroScoreBox: { alignItems: "center", justifyContent: "center", minWidth: 64 },
  levelChip: {
    alignSelf: "flex-start",
    backgroundColor: C.accentSoft,
    color: C.accent,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 8,
    color: C.subtle,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  taskTitle: { fontSize: 11.5, fontFamily: "Helvetica-Bold" },
  taskScore: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: C.accent },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accentSoft,
    marginBottom: 10,
  },
  barFill: { height: 6, borderRadius: 3, backgroundColor: C.accent },
  finding: { flexDirection: "row", gap: 8, marginBottom: 6 },
  statusChip: {
    width: 52,
    borderRadius: 4,
    paddingVertical: 2,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  muted: { color: C.muted },
  listRow: { flexDirection: "row", gap: 5, marginBottom: 3 },
  bullet: { color: C.subtle },
  profileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  profileItem: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    fontSize: 7.5,
    color: C.subtle,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function ScoreBar({ score }: { score: number }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.max(2, score)}%` }]} />
    </View>
  );
}

function intakeLabel(id: string): string {
  const q = intakeQuestions.find((q) => q.id === id);
  return q ? q.question : id;
}

function formatAnswer(v: string | string[] | number): string {
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function ReportDocument({
  grades,
  intakeAnswers,
  generatedAt,
}: {
  grades: ReportGrades;
  intakeAnswers: IntakeAnswers;
  generatedAt: Date;
}) {
  const dateLabel = generatedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const profileEntries = Object.entries(intakeAnswers).filter(
    ([id]) => id !== "email" && !id.endsWith("__other")
  );

  return (
    <Document title="2Skill — AI Skills Assessment Report" author="2Skill">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Text style={s.wordmark}>2Skill</Text>
          <View>
            <Text style={s.headerMeta}>AI Skills Assessment Report</Text>
            <Text style={s.headerMeta}>{dateLabel}</Text>
          </View>
        </View>

        <View style={s.hero}>
          <View style={s.heroScoreBox}>
            <Text style={s.heroScore}>{grades.overall.score}</Text>
            <Text style={{ fontSize: 8, color: C.muted }}>out of 100</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.levelChip}>{grades.overall.level}</Text>
            <Text style={s.h1}>Your overall result</Text>
            <ScoreBar score={grades.overall.score} />
            <Text style={s.muted}>{grades.overall.summary}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Your profile</Text>
        <View style={s.profileGrid}>
          {profileEntries.map(([id, v]) => (
            <View key={id} style={s.profileItem}>
              <Text style={{ fontSize: 7, color: C.subtle }}>{intakeLabel(id)}</Text>
              <Text style={{ fontSize: 8.5 }}>{formatAnswer(v)}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Task-by-task analysis</Text>
        {grades.tasks.map((task, i) => (
          <View key={task.taskId} style={s.card} wrap={false}>
            <View style={s.cardHeader}>
              <Text style={s.taskTitle}>
                Task {i + 1} · {task.title}
              </Text>
              <Text style={s.taskScore}>{task.score}/100</Text>
            </View>
            <ScoreBar score={task.score} />
            <Text style={{ marginBottom: 8 }}>{task.summary}</Text>

            {task.findings.map((f, j) => {
              const st = STATUS[f.status] ?? STATUS.partial;
              return (
                <View key={j} style={s.finding}>
                  <Text style={[s.statusChip, { color: st.color, backgroundColor: st.soft }]}>
                    {st.label}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5 }}>{f.label}</Text>
                    <Text style={[s.muted, { fontSize: 8.5 }]}>{f.detail}</Text>
                  </View>
                </View>
              );
            })}

            {task.strengths.length > 0 && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: C.good }}>
                  What worked
                </Text>
                {task.strengths.map((t, j) => (
                  <View key={j} style={s.listRow}>
                    <Text style={s.bullet}>•</Text>
                    <Text style={{ flex: 1, fontSize: 8.5 }}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
            {task.improvements.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: C.warning }}>
                  What to work on
                </Text>
                {task.improvements.map((t, j) => (
                  <View key={j} style={s.listRow}>
                    <Text style={s.bullet}>•</Text>
                    <Text style={{ flex: 1, fontSize: 8.5 }}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text>2Skill — practical AI skills assessment</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(args: {
  grades: ReportGrades;
  intakeAnswers: IntakeAnswers;
}): Promise<Buffer> {
  return renderToBuffer(
    <ReportDocument
      grades={args.grades}
      intakeAnswers={args.intakeAnswers}
      generatedAt={new Date()}
    />
  );
}
