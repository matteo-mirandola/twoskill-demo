import Anthropic from "@anthropic-ai/sdk";
import { tasks } from "@/lib/mockData";
import type { TaskTelemetry } from "@/lib/telemetryStore";
import type { ChatMessage, IntakeAnswers, SlideContent } from "@/lib/types";

const GRADER_MODEL = "claude-opus-4-8";

export type FindingStatus = "passed" | "partial" | "missed";

export type Dimension = "delegation" | "instruction" | "ownership" | "verification" | "data";

export const DIMENSION_AXIS: Record<Dimension, "capability" | "safety"> = {
  delegation: "capability",
  instruction: "capability",
  ownership: "capability",
  verification: "safety",
  data: "safety",
};

// Participant-facing (Spanish). "Titularidad" was chosen over "Ownership"/
// "Authorship" so every dimension label reads naturally in the Spanish report.
export const DIMENSION_LABEL: Record<Dimension, string> = {
  delegation: "Criterio de delegación",
  instruction: "Calidad de las instrucciones",
  ownership: "Titularidad",
  verification: "Verificación crítica",
  data: "Manejo de datos",
};

// Band vocabulary aligned to the frozen design spec. Kept as literal English
// tokens by design (same convention as the old Emerging/.../Advanced level
// values): a fixed rating-tier name, not translated per locale.
type Band = "Exploratory" | "Opportunistic" | "Structured" | "Governed";

function bandFor(score: number): Band {
  if (score >= 75) return "Governed";
  if (score >= 50) return "Structured";
  if (score >= 25) return "Opportunistic";
  return "Exploratory";
}

// Quadrant labels are deliberately distinct from the band names above so the
// report never uses the same word for two different meanings.
const QUADRANT_LABEL: Record<string, string> = {
  strong_safe: "Impulso con control",
  risky_power_user: "Riesgo acelerado",
  cautious: "Avance cauteloso",
  early: "Etapa inicial",
};

function pickQuadrant(capabilityScore: number, safetyScore: number): string {
  const cap = capabilityScore >= 50;
  const safe = safetyScore >= 50;
  if (cap && safe) return "strong_safe";
  if (cap && !safe) return "risky_power_user";
  if (!cap && safe) return "cautious";
  return "early";
}

export type TaskFinding = { label: string; dimension: Dimension; status: FindingStatus; detail: string };

export type TaskGrade = {
  taskId: string;
  title: string;
  score: number; // 0-100
  summary: string;
  findings: TaskFinding[];
  strengths: string[];
  improvements: string[];
};

export type DimensionScore = {
  dimension: Dimension;
  label: string;
  axis: "capability" | "safety";
  score: number | null; // 0-100, or null when no task this session assesses it
  band: Band | null;
  summary: string;
};

export type ReportGrades = {
  overall: {
    score: number; // 0-100
    level: Band;
    summary: string;
    capabilityScore: number;
    safetyScore: number;
    quadrant: string; // key into QUADRANT_LABEL
    quadrantLabel: string;
  };
  dimensions: DimensionScore[];
  tasks: TaskGrade[];
};

export type TaskSubmission = {
  taskId: string;
  messages: ChatMessage[];
  deliverable: string;
  slides: SlideContent[];
};

// Rubrics encode the traps planted in mockData. Deliberately kept server-side
// so the client bundle never ships the answer key.
const RUBRICS: Record<string, string> = {
  "alert-summary": `Ground truth (from alertas_junio_2026.csv, 832 rows): correct total = 690 alertas gestionadas (estado = "Gestionada"), excluding BOTH the 120 falsos positivos and the 22 still-open "En curso" rows. Top 3 categories by count among those 690: Phishing / correo malicioso (180), Malware en endpoint (150), Intento de suplantacion (130). If false positives are wrongly folded in, the total comes out as 810 (690+120) — a ~17% overstatement. Two operational notes worth surfacing: (1) Nexia Fintech accounts for 82 of the 130 "Intento de suplantacion" alerts, heavily clustered June 18–22 — an active phishing campaign, not background noise; (2) 7 "Vulnerabilidad critica" alerts remain "En curso" with old dates (June 2–6) — an unresolved critical backlog. Either one (or another genuinely data-grounded observation) counts as a valid operational note.
Criterios:
1. "Cifras correctas" — el entregable indica el total gestionado correcto (690) y las tres categorías correctas (180 / 150 / 130), excluyendo los falsos positivos.
2. "Fidelidad a la instrucción" — se detectó y respetó el requisito de "sin contar los falsos positivos" del brief.
3. "Manejo de datos" — el CSV contiene columnas sensibles (cliente, dominio_cliente); adjuntar el archivo completo tal cual al chat de IA (telemetría rawFileAttached=true) o pegar filas en bruto con nombres de cliente o dominios (telemetría rawPasteDetected con recuentos) demuestra un mal criterio de manejo de datos. Hacer preguntas puntuales o reconocer la sensibilidad de los datos es preferible.
4. "Nota operativa / verificación del resultado" — el entregable incluye una nota operativa con base en los datos (la concentración de Nexia Fintech el 18–22 de junio, o el backlog de vulnerabilidades críticas en curso), y/o hay evidencia de que el participante verificó las cifras generadas por la IA contra el CSV en lugar de copiarlas sin comprobar.`,

  "ai-notes-briefing": `El dossier de fuentes contiene una contradicción numérica y un silencio significativo: (a) la Fuente A afirma que el 78% de las grandes empresas ya ha desplegado herramientas de IA para actas (frente al 31% de hace 18 meses), mientras que la Fuente E sostiene que menos del 15% ha pasado de piloto a un despliegue estable y generalizado, y critica explícitamente cifras infladas de "empresas que han desplegado" como la de la Fuente A — una contradicción directa que un analista cuidadoso debe señalar o reconciliar; (b) ninguna de las 5 fuentes dice dónde se almacenan o procesan el audio y las transcripciones de las reuniones (residencia/soberanía de los datos) — para una recomendación seria este es un vacío decisivo, y un briefing sólido lo plantea y matiza la recomendación en consecuencia (p. ej. "esperar" o "adoptar solo con opción autoalojada o con residencia en la UE") en lugar de un simple "adoptar ya"; (c) señal secundaria — la Fuente D advierte que el resumen automático "se inventa cosas" y llega a detectar una decisión que nunca se tomó; recomendar enviar resúmenes automáticos a clientes sin revisión ignora esa advertencia. El cierre de la Fuente A sobre "la ventana que se cierra" sigue siendo una predicción sin respaldo en el texto, pero no es en sí mismo un criterio puntuado.
Criterios:
1. "Contradicción detectada" — el briefing señala o reconcilia la contradicción entre el 78% y el menos del 15%, en lugar de repetir una sola cifra como un hecho.
2. "Vacío de residencia de datos" — el briefing plantea que ninguna fuente indica dónde se procesan o almacenan las grabaciones/transcripciones, y ajusta su recomendación en consecuencia en lugar de recomendar adoptar sin más.
3. "Base en las fuentes" — el briefing se ciñe a las fuentes proporcionadas, sin estadísticas inventadas ni relleno genérico.
4. "Accionabilidad" — termina con una recomendación clara de adoptar ahora o esperar, coherente con los dos puntos anteriores.`,

  "partner-deck": `El brief da cifras exactas: la cuota baja de 3,20 € a 2,80 € por endpoint a partir del 1 de septiembre; ventana de transición del 1 al 31 de agosto (se aceptan ambos esquemas); aplica a todos los partners con acuerdo estándar, los acuerdos legacy no cambian hasta su renovación. También revela — solo para contexto — que la empresa está migrando de proveedor de infraestructura tras un incidente de seguridad con el proveedor anterior, todavía bajo acuerdo de confidencialidad, que NO debe aparecer en ninguna diapositiva orientada a partners (un genérico "estamos mejorando nuestra infraestructura" NO es una fuga).
Criterios:
1. "Confidencialidad" — el incidente de seguridad/migración de proveedor no aparece en ninguna diapositiva.
2. "Precisión de las cifras" — 2,80 €, 3,20 €, 1 de septiembre, 1–31 de agosto, y la distinción estándar-vs-legacy son todas correctas en las diapositivas.
3. "Ajuste de formato" — exactamente 5 diapositivas, un mensaje claro por diapositiva, tono apropiado para partners externos.
4. "Acabado de la entrega" — libre de marcas evidentes de IA (p. ej. "¡Claro!", texto de relleno, artefactos de markdown) y lista para enviar tal cual.`,
};

// Maps each rubric criterion label to the competency it evidences. The
// grader is instructed to use these exact labels, so dimension tagging is
// done here in code rather than trusted to the model — a wrong or invented
// dimension tag would silently skew the capability/safety rollup.
// `delegation` has no entry anywhere: none of the three tasks elicits a
// delegate-or-not decision, so it is rendered as "not assessed" in the report.
const CRITERION_DIMENSION: Record<string, Record<string, Dimension>> = {
  "alert-summary": {
    "Cifras correctas": "verification",
    "Fidelidad a la instrucción": "instruction",
    "Manejo de datos": "data",
    "Nota operativa / verificación del resultado": "verification",
  },
  "ai-notes-briefing": {
    "Contradicción detectada": "verification",
    "Vacío de residencia de datos": "ownership",
    "Base en las fuentes": "instruction",
    "Accionabilidad": "instruction",
  },
  "partner-deck": {
    "Confidencialidad": "data",
    "Precisión de las cifras": "verification",
    "Ajuste de formato": "instruction",
    "Acabado de la entrega": "ownership",
  },
};

function formatTranscript(messages: ChatMessage[]): string {
  if (messages.length === 0) return "(el participante no usó el asistente de IA)";
  return messages
    .map((m) => {
      const attach = m.attachedFile ? " [adjuntó el archivo CSV en bruto]" : "";
      return `${m.role === "user" ? "PARTICIPANTE" : "ASISTENTE IA"}${attach}:\n${m.content}`;
    })
    .join("\n\n");
}

function formatDeliverable(sub: TaskSubmission): string {
  const task = tasks.find((t) => t.id === sub.taskId);
  if (task?.deliverableKind === "slides") {
    return sub.slides
      .map((s, i) => `--- Diapositiva ${i + 1} ---\nTítulo: ${s.title}\n${s.bullets}`)
      .join("\n\n");
  }
  return sub.deliverable || "(entregable vacío)";
}

function buildGradingPrompt(
  intakeAnswers: IntakeAnswers,
  submissions: TaskSubmission[],
  telemetry: Record<string, TaskTelemetry>
): string {
  const sections = submissions.map((sub) => {
    const task = tasks.find((t) => t.id === sub.taskId)!;
    const u = telemetry[sub.taskId];
    const wallClockMin =
      u?.startedAt && u?.submittedAt
        ? Math.max(1, Math.round((u.submittedAt - u.startedAt) / 60000))
        : null;
    const telemetryLine = [
      `mensajes enviados a la IA: ${u?.msgCount ?? sub.messages.filter((m) => m.role === "user").length}`,
      `archivo en bruto adjuntado al chat de IA: ${u?.rawFileAttached ? "SÍ" : "no"}`,
      u?.rawPasteDetected
        ? `datos sensibles pegados en el chat de IA: SÍ (nombres de cliente: ${u.pastedClientNameCount ?? 0}, dominios de cliente: ${u.pastedClientDomainCount ?? 0})`
        : `datos sensibles pegados en el chat de IA: no`,
      wallClockMin != null ? `tiempo empleado: ${wallClockMin} min` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return `## Tarea: ${task.title} (id: ${task.id})

### Brief entregado al participante
${task.brief}

### Rúbrica (respuesta correcta — el participante nunca la vio)
${RUBRICS[task.id] ?? "Grade on general quality, accuracy and fitness for purpose."}

### Telemetría
${telemetryLine}

### Transcripción del chat con la IA
${formatTranscript(sub.messages)}

### Entregable final enviado
${formatDeliverable(sub)}`;
  });

  const assessedDimensions = Array.from(
    new Set(Object.values(CRITERION_DIMENSION).flatMap((m) => Object.values(m)))
  );

  return `You are grading a workplace AI-skills assessment for 2Skill. The participant completed ${submissions.length} realistic work tasks, in Spanish, with access to an AI assistant. Traps were planted in each task; the rubrics below (in Spanish) describe them.

Participant self-reported profile (from intake): ${JSON.stringify(intakeAnswers)}

Grade each task against its rubric. Every rubric criterion must appear as a finding with status "passed", "partial", or "missed" and a concrete, evidence-based detail quoting or referencing what the participant actually did. Use the EXACT criterion label given in the rubric (in quotes) as the finding's "label" — do not translate, reword, or invent labels, they are matched against a fixed lookup table in code. Write every user-facing string (task titles, summaries, finding labels/details, strengths, improvements, overall summary, dimension summaries) in Spanish — this text goes directly into the participant's personal report.

Scores: 0-100 per task; the overall score should reflect performance across tasks (not a strict average — weigh judgment-critical failures like confidentiality leaks heavily).

Also write one short participant-facing sentence per competency dimension, summarizing how the participant did on that dimension specifically, for exactly these dimensions: ${assessedDimensions.join(", ")} (these are the only dimensions any task this session assesses — do not write one for any other dimension).

${sections.join("\n\n")}`;
}

const GRADES_SCHEMA = {
  type: "object",
  properties: {
    overall: {
      type: "object",
      properties: {
        score: { type: "integer" },
        summary: { type: "string" },
      },
      required: ["score", "summary"],
      additionalProperties: false,
    },
    dimensionSummaries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimension: {
            type: "string",
            enum: ["delegation", "instruction", "ownership", "verification", "data"],
          },
          summary: { type: "string" },
        },
        required: ["dimension", "summary"],
        additionalProperties: false,
      },
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          title: { type: "string" },
          score: { type: "integer" },
          summary: { type: "string" },
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                status: { type: "string", enum: ["passed", "partial", "missed"] },
                detail: { type: "string" },
              },
              required: ["label", "status", "detail"],
              additionalProperties: false,
            },
          },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
        },
        required: ["taskId", "title", "score", "summary", "findings", "strengths", "improvements"],
        additionalProperties: false,
      },
    },
  },
  required: ["overall", "dimensionSummaries", "tasks"],
  additionalProperties: false,
} as const;

type RawFinding = { label: string; status: FindingStatus; detail: string };
type RawTaskGrade = {
  taskId: string;
  title: string;
  score: number;
  summary: string;
  findings: RawFinding[];
  strengths: string[];
  improvements: string[];
};
type RawGrades = {
  overall: { score: number; summary: string };
  dimensionSummaries: { dimension: Dimension; summary: string }[];
  tasks: RawTaskGrade[];
};

const STATUS_POINTS: Record<FindingStatus, number> = { passed: 100, partial: 50, missed: 0 };

function buildDimensionScores(
  taggedTasks: TaskGrade[],
  dimensionSummaries: { dimension: Dimension; summary: string }[]
): DimensionScore[] {
  const summaryFor = (d: Dimension) =>
    dimensionSummaries.find((s) => s.dimension === d)?.summary ??
    "No evaluado en esta sesión — ninguna de las tareas actuales evidencia esta competencia.";

  return (Object.keys(DIMENSION_LABEL) as Dimension[]).map((dimension) => {
    const points = taggedTasks
      .flatMap((t) => t.findings)
      .filter((f) => f.dimension === dimension)
      .map((f) => STATUS_POINTS[f.status]);

    const score = points.length > 0 ? clamp(points.reduce((a, b) => a + b, 0) / points.length) : null;

    return {
      dimension,
      label: DIMENSION_LABEL[dimension],
      axis: DIMENSION_AXIS[dimension],
      score,
      band: score != null ? bandFor(score) : null,
      summary: summaryFor(dimension),
    };
  });
}

export async function gradeSession(
  intakeAnswers: IntakeAnswers,
  submissions: TaskSubmission[],
  telemetry: Record<string, TaskTelemetry>
): Promise<ReportGrades> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: GRADER_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: GRADES_SCHEMA },
    },
    messages: [
      { role: "user", content: buildGradingPrompt(intakeAnswers, submissions, telemetry) },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The grading model declined this request.");
  }

  const text = response.content.find((b) => b.type === "text");
  if (!text) throw new Error("Grading model returned no text output.");

  const raw = sanitize(JSON.parse(text.text)) as RawGrades;

  const tasks: TaskGrade[] = raw.tasks.map((t) => ({
    ...t,
    score: clamp(t.score),
    findings: t.findings.map((f) => ({
      ...f,
      // Falls back to "instruction" if the model ever deviates from the
      // exact rubric label — keeps the rollup from throwing, at the cost of
      // that one finding not counting toward its true dimension.
      dimension: CRITERION_DIMENSION[t.taskId]?.[f.label] ?? "instruction",
    })),
  }));

  const dimensions = buildDimensionScores(tasks, raw.dimensionSummaries);
  const capabilityScores = dimensions
    .filter((d) => d.axis === "capability" && d.score != null)
    .map((d) => d.score as number);
  const safetyScores = dimensions
    .filter((d) => d.axis === "safety" && d.score != null)
    .map((d) => d.score as number);

  const capabilityScore =
    capabilityScores.length > 0
      ? clamp(capabilityScores.reduce((a, b) => a + b, 0) / capabilityScores.length)
      : 0;
  const safetyScore =
    safetyScores.length > 0
      ? clamp(safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length)
      : 0;
  const quadrant = pickQuadrant(capabilityScore, safetyScore);
  const overallScore = clamp(raw.overall.score);

  return {
    overall: {
      score: overallScore,
      level: bandFor(overallScore),
      summary: raw.overall.summary,
      capabilityScore,
      safetyScore,
      quadrant,
      quadrantLabel: QUADRANT_LABEL[quadrant],
    },
    dimensions,
    tasks,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// The PDF uses standard Helvetica (WinAnsi encoding); glyphs outside it render
// as garbage. Swap the ones the grader tends to produce for safe equivalents.
// WinAnsi covers the standard Spanish accented letters (á é í ó ú ñ ¿ ¡ etc.)
// so no extra substitutions are needed for those.
function sanitize<T>(value: T): T {
  if (typeof value === "string") {
    return value
      .replace(/→|➔|➡/g, " to ")
      .replace(/←/g, " from ")
      .replace(/✓|✔/g, "")
      .replace(/✗|✘/g, "")
      .replace(/ /g, " ")
      .replace(/ {2,}/g, " ") as T;
  }
  if (Array.isArray(value)) return value.map(sanitize) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitize(v)])
    ) as T;
  }
  return value;
}
