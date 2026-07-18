import Anthropic from "@anthropic-ai/sdk";
import { tasks } from "@/lib/mockData";
import type { TaskTelemetry } from "@/lib/telemetryStore";
import type { ChatMessage, IntakeAnswers, SlideContent } from "@/lib/types";

const GRADER_MODEL = "claude-opus-4-8";

export type FindingStatus = "passed" | "partial" | "missed";

export type TaskGrade = {
  taskId: string;
  title: string;
  score: number; // 0-100
  summary: string;
  findings: { label: string; status: FindingStatus; detail: string }[];
  strengths: string[];
  improvements: string[];
};

export type ReportGrades = {
  overall: {
    score: number; // 0-100
    level: string; // e.g. "Emerging", "Practitioner", "Advanced"
    summary: string;
  };
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
  "alert-summary": `Ground truth (from alertas_junio_2026.csv, 832 rows): alerts MANAGED excluding false positives (estado = "Gestionada" or "En curso") = 712. Top 3 categories by count among those 712: Phishing / correo malicioso (186), Malware en endpoint (153), Intento de suplantacion (130). If false positives were wrongly included, the total comes out as 832 (all rows) — every count is inflated even though the top-3 ranking happens to stay the same. A strong operational note: Nexia Fintech accounts for 82 of the 130 "Intento de suplantacion" alerts (63%) and has the highest overall managed-alert volume (191) of any client — a concentration worth flagging to leadership. Any other data-grounded observation counts too.
Criterios:
1. "Cifras correctas" — el entregable indica el total gestionado correcto (712) y las tres categorías correctas, excluyendo los falsos positivos.
2. "Fidelidad a la instrucción" — se detectó y respetó el requisito de "sin contar los falsos positivos" del brief.
3. "Manejo de datos" — el CSV contiene columnas sensibles (cliente, dominio_cliente); adjuntar el archivo completo tal cual al chat de IA (telemetría rawFileAttached=true) o pegar filas en bruto con nombres de cliente o dominios (telemetría rawPasteDetected con recuentos) demuestra un mal criterio de manejo de datos. Hacer preguntas puntuales o reconocer la sensibilidad de los datos es preferible.
4. "Verificación del resultado" — evidencia en el chat o en el entregable de que el participante verificó las cifras generadas por la IA contra la fuente en lugar de copiarlas sin comprobar.`,

  "ai-notes-briefing": `El dossier de fuentes contiene dos trampas plantadas: (a) la Fuente A afirma que el 78% de las grandes empresas ya ha desplegado herramientas de IA para actas (frente al 31% de hace 18 meses), mientras que la Fuente E sostiene que menos del 15% ha pasado de piloto a un despliegue estable y generalizado, y critica explícitamente cifras infladas de "empresas que han desplegado" como la de la Fuente A — una contradicción directa que un analista cuidadoso debe señalar o reconciliar; (b) el cierre de la Fuente A ("la ventana... se está cerrando, quien entre el año que viene lo hará ya como rezagado, no como pionero") es una predicción categórica sobre resultado competitivo que nada más en el dossier respalda — repetirla como un hecho es un error.
Criterios:
1. "Contradicción detectada" — el briefing señala o reconcilia la contradicción entre el 78% y el menos del 15%, en lugar de repetir una sola cifra como un hecho.
2. "Afirmaciones no verificadas" — la predicción sobre la ventana de oportunidad que se cierra se omite, se atribuye a su fuente, o se marca como no verificada.
3. "Base en las fuentes" — el briefing se ciñe a las fuentes proporcionadas, sin estadísticas inventadas ni relleno genérico.
4. "Accionabilidad" — termina con una recomendación clara de adoptar ahora o esperar, tal como pide el brief.`,

  "partner-deck": `El brief da cifras exactas: la cuota baja de 3,20 € a 2,80 € por endpoint a partir del 1 de septiembre; ventana de transición del 1 al 31 de agosto (se aceptan ambos esquemas); aplica a todos los partners con acuerdo estándar, los acuerdos legacy no cambian hasta su renovación. También revela — solo para contexto — que la empresa está migrando de proveedor de infraestructura tras un incidente de seguridad con el proveedor anterior, todavía bajo acuerdo de confidencialidad, que NO debe aparecer en ninguna diapositiva orientada a partners (un genérico "estamos mejorando nuestra infraestructura" NO es una fuga).
Criterios:
1. "Confidencialidad" — el incidente de seguridad/migración de proveedor no aparece en ninguna diapositiva.
2. "Precisión de las cifras" — 2,80 €, 3,20 €, 1 de septiembre, 1–31 de agosto, y la distinción estándar-vs-legacy son todas correctas en las diapositivas.
3. "Ajuste de formato" — exactamente 5 diapositivas, un mensaje claro por diapositiva, tono apropiado para partners externos.
4. "Acabado de la entrega" — libre de marcas evidentes de IA (p. ej. "¡Claro!", texto de relleno, artefactos de markdown) y lista para enviar tal cual.`,
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

  return `You are grading a workplace AI-skills assessment for 2Skill. The participant completed ${submissions.length} realistic work tasks, in Spanish, with access to an AI assistant. Traps were planted in each task; the rubrics below (in Spanish) describe them.

Participant self-reported profile (from intake): ${JSON.stringify(intakeAnswers)}

Grade each task against its rubric. Every rubric criterion must appear as a finding with status "passed", "partial", or "missed" and a concrete, evidence-based detail quoting or referencing what the participant actually did. Write every user-facing string (task titles, summaries, finding labels/details, strengths, improvements, overall summary) in Spanish — this text goes directly into the participant's personal report. Scores: 0-100 per task; the overall score should reflect performance across tasks (not a strict average — weigh judgment-critical failures like confidentiality leaks heavily). Choose an overall level from: "Emerging", "Developing", "Practitioner", "Advanced" (keep these four level values in English exactly as given — only the level values, everything else must be in Spanish).

${sections.join("\n\n")}`;
}

const GRADES_SCHEMA = {
  type: "object",
  properties: {
    overall: {
      type: "object",
      properties: {
        score: { type: "integer" },
        level: { type: "string", enum: ["Emerging", "Developing", "Practitioner", "Advanced"] },
        summary: { type: "string" },
      },
      required: ["score", "level", "summary"],
      additionalProperties: false,
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
  required: ["overall", "tasks"],
  additionalProperties: false,
} as const;

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

  const grades = sanitize(JSON.parse(text.text)) as ReportGrades;
  grades.overall.score = clamp(grades.overall.score);
  for (const t of grades.tasks) t.score = clamp(t.score);
  return grades;
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
