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
  passed: { label: "Aprobado", color: C.good, soft: C.goodSoft },
  partial: { label: "Parcial", color: C.warning, soft: C.warningSoft },
  missed: { label: "No superado", color: C.critical, soft: C.criticalSoft },
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
  axisRow: { flexDirection: "row", gap: 16, marginBottom: 10 },
  axisCol: { flex: 1 },
  axisLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  axisLabel: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  axisScore: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.accent },
  quadrantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  dimensionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  dimensionLabelCol: { width: 110 },
  dimensionLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  dimensionBarCol: { flex: 1 },
  dimensionBandChip: {
    width: 78,
    borderRadius: 4,
    paddingVertical: 2,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    backgroundColor: C.accentSoft,
    color: C.accent,
  },
  axisGroupLabel: {
    fontSize: 7.5,
    color: C.subtle,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
    marginTop: 4,
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
  const dateLabel = generatedAt.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const profileEntries = Object.entries(intakeAnswers).filter(
    ([id]) => id !== "email" && !id.endsWith("__other")
  );

  return (
    <Document title="2Skill — Informe de evaluación de habilidades con IA" author="2Skill">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Text style={s.wordmark}>2Skill</Text>
          <View>
            <Text style={s.headerMeta}>Informe de evaluación de habilidades con IA</Text>
            <Text style={s.headerMeta}>{dateLabel}</Text>
          </View>
        </View>

        <View style={s.hero}>
          <View style={s.heroScoreBox}>
            <Text style={s.heroScore}>{grades.overall.score}</Text>
            <Text style={{ fontSize: 8, color: C.muted }}>sobre 100</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.levelChip}>{grades.overall.level}</Text>
            <Text style={s.h1}>Tu resultado global</Text>
            <ScoreBar score={grades.overall.score} />
            <Text style={s.muted}>{grades.overall.summary}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Tu perfil</Text>
        <View style={s.profileGrid}>
          {profileEntries.map(([id, v]) => (
            <View key={id} style={s.profileItem}>
              <Text style={{ fontSize: 7, color: C.subtle }}>{intakeLabel(id)}</Text>
              <Text style={{ fontSize: 8.5 }}>{formatAnswer(v)}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Capacidad frente a seguridad</Text>
        <View style={s.axisRow}>
          <View style={s.axisCol}>
            <View style={s.axisLabelRow}>
              <Text style={s.axisLabel}>Capacidad</Text>
              <Text style={s.axisScore}>{grades.overall.capabilityScore}/100</Text>
            </View>
            <ScoreBar score={grades.overall.capabilityScore} />
          </View>
          <View style={s.axisCol}>
            <View style={s.axisLabelRow}>
              <Text style={s.axisLabel}>Seguridad</Text>
              <Text style={s.axisScore}>{grades.overall.safetyScore}/100</Text>
            </View>
            <ScoreBar score={grades.overall.safetyScore} />
          </View>
        </View>
        <View style={s.quadrantRow}>
          <Text style={s.levelChip}>{grades.overall.quadrantLabel}</Text>
          <Text style={{ flex: 1, fontSize: 8.5, color: C.muted }}>
            Combina lo productivo que eres con la IA (capacidad) con lo bien que gestionas sus riesgos
            (seguridad): datos sensibles, verificación de resultados y respeto de las instrucciones.
          </Text>
        </View>

        <Text style={s.sectionTitle}>Tus competencias</Text>
        {(["capability", "safety"] as const).map((axis) => (
          <View key={axis} wrap={false}>
            <Text style={s.axisGroupLabel}>{axis === "capability" ? "Capacidad" : "Seguridad"}</Text>
            {grades.dimensions
              .filter((d) => d.axis === axis)
              .map((d) => (
                <View key={d.dimension} style={s.dimensionRow}>
                  <View style={s.dimensionLabelCol}>
                    <Text style={s.dimensionLabel}>{d.label}</Text>
                  </View>
                  {d.score == null ? (
                    <Text style={{ flex: 1, fontSize: 8, color: C.subtle }}>No evaluado esta sesión</Text>
                  ) : (
                    <>
                      <View style={s.dimensionBarCol}>
                        <ScoreBar score={d.score} />
                      </View>
                      <Text style={s.dimensionBandChip}>{d.band}</Text>
                    </>
                  )}
                </View>
              ))}
            {grades.dimensions
              .filter((d) => d.axis === axis && d.score != null)
              .map((d) => (
                <Text key={d.dimension} style={{ fontSize: 8, color: C.muted, marginBottom: 6 }}>
                  {d.label}: {d.summary}
                </Text>
              ))}
          </View>
        ))}

        <Text style={s.sectionTitle}>Análisis por tarea</Text>
        {grades.tasks.map((task, i) => (
          <View key={task.taskId} style={s.card} wrap={false}>
            <View style={s.cardHeader}>
              <Text style={s.taskTitle}>
                Tarea {i + 1} · {task.title}
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
                  Qué funcionó
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
                  En qué trabajar
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
          <Text>2Skill — evaluación práctica de habilidades con IA</Text>
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
