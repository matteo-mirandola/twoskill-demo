import type { ReportGrades } from "./grading";

// Fallback grades used when the Anthropic API key is missing or the grading
// call fails, and by the dev preview endpoint. Keeps the demo flowing: the
// participant still receives a complete, plausible report.
export const MOCK_GRADES: ReportGrades = {
  overall: {
    score: 68,
    level: "Structured",
    summary:
      "Usas la IA de forma efectiva para redactar y sintetizar, y tus entregables están bien estructurados. El principal punto débil es la verificación: en dos de las tres tareas dejaste pasar resultados de la IA sin comprobarlos contra la fuente.",
    capabilityScore: 57,
    safetyScore: 69,
    quadrant: "strong_safe",
    quadrantLabel: "Impulso con control",
  },
  dimensions: [
    {
      dimension: "delegation",
      label: "Criterio de delegación",
      axis: "capability",
      score: null,
      band: null,
      summary: "No evaluado en esta sesión — ninguna de las tareas actuales exige decidir qué delegar en la IA y cómo.",
    },
    {
      dimension: "instruction",
      label: "Calidad de las instrucciones",
      axis: "capability",
      score: 88,
      band: "Governed",
      summary: "Sigues bien las instrucciones de cada brief y mantienes el formato y el tono pedidos.",
    },
    {
      dimension: "ownership",
      label: "Titularidad",
      axis: "capability",
      score: 25,
      band: "Opportunistic",
      summary:
        "Tus entregables están bien redactados, pero te falta incorporar salvedades importantes (como la falta de información sobre dónde van los datos) antes de darlos por buenos.",
    },
    {
      dimension: "verification",
      label: "Verificación crítica",
      axis: "safety",
      score: 38,
      band: "Opportunistic",
      summary:
        "Verificas las cifras de forma inconsistente: en dos de las tres tareas dejaste pasar resultados de la IA sin comprobarlos.",
    },
    {
      dimension: "data",
      label: "Manejo de datos",
      axis: "safety",
      score: 100,
      band: "Governed",
      summary: "Manejas los datos sensibles con buen criterio en las dos tareas donde había información confidencial en juego.",
    },
  ],
  tasks: [
    {
      taskId: "alert-summary",
      title: "El resumen de alertas",
      score: 62,
      summary:
        "Tu resumen estaba bien redactado y con el tono adecuado para dirección, pero indicaba el total con los falsos positivos incluidos, lo que sobreestima el volumen gestionado en 120 alertas.",
      findings: [
        {
          label: "Cifras correctas",
          dimension: "verification",
          status: "missed",
          detail:
            "Indicaste 810 alertas en total — la cifra que incluye los falsos positivos. El total gestionado correcto, excluyéndolos, es 690.",
        },
        {
          label: "Fidelidad a la instrucción",
          dimension: "instruction",
          status: "partial",
          detail:
            "El brief pedía excluir los falsos positivos; tu prompt a la IA nunca mencionó esa condición.",
        },
        {
          label: "Manejo de datos",
          dimension: "data",
          status: "passed",
          detail:
            "Hiciste preguntas puntuales en lugar de pegar la exportación en bruto, manteniendo los nombres y dominios de cliente fuera del chat.",
        },
        {
          label: "Nota operativa / verificación del resultado",
          dimension: "verification",
          status: "missed",
          detail:
            "Las cifras de la IA pasaron a tu entregable sin cambios, sin ninguna comprobación visible en el chat, y no se mencionó la concentración de intentos de suplantación en Nexia Fintech ni el backlog de vulnerabilidades críticas en curso.",
        },
      ],
      strengths: ["Estructura de una página clara, con el tono adecuado para dirección."],
      improvements: [
        "Repite en tu prompt cada condición del brief.",
        "Comprueba al menos la cifra principal antes de enviarla.",
      ],
    },
    {
      taskId: "ai-notes-briefing",
      title: "El briefing de IA para actas",
      score: 71,
      summary:
        "Briefing sólido y bien fundamentado en las fuentes, con una recomendación clara, pero recomendaste adoptar sin plantear dónde se procesan las grabaciones.",
      findings: [
        {
          label: "Contradicción detectada",
          dimension: "verification",
          status: "partial",
          detail:
            "Señalaste que 'las fuentes difieren en el ritmo de adopción', pero aun así lideraste con el 78% sin contraponerlo a la cifra de la Fuente E.",
        },
        {
          label: "Vacío de residencia de datos",
          dimension: "ownership",
          status: "missed",
          detail:
            "El briefing no menciona en ningún momento que ninguna fuente indica dónde se almacenan o procesan el audio y las transcripciones — un vacío decisivo que no llegó a matizar la recomendación.",
        },
        {
          label: "Base en las fuentes",
          dimension: "instruction",
          status: "passed",
          detail: "Ninguna estadística inventada; todo se remonta al dossier.",
        },
        {
          label: "Accionabilidad",
          dimension: "instruction",
          status: "passed",
          detail: "Recomendación clara de 'adoptar ahora, empezando en pequeño'.",
        },
      ],
      strengths: ["Buen uso del caso de cliente de la Fuente B para ilustrar el ahorro real."],
      improvements: [
        "Cuando dos fuentes se contradicen, lidera con la contradicción — no la entierres.",
        "Antes de recomendar adoptar, comprueba si el dossier dice dónde van los datos — si nadie lo dice, es una señal de alerta, no un detalle menor.",
      ],
    },
    {
      taskId: "partner-deck",
      title: "El deck de socios",
      score: 70,
      summary:
        "Cifras correctas y una estructura limpia de cinco diapositivas; una diapositiva se quedó con una muletilla propia de la IA.",
      findings: [
        {
          label: "Confidencialidad",
          dimension: "data",
          status: "passed",
          detail:
            "Ninguna mención al incidente de seguridad ni a la migración de proveedor en ninguna diapositiva.",
        },
        {
          label: "Precisión de las cifras",
          dimension: "verification",
          status: "passed",
          detail:
            "2,80 €, el 1 de septiembre, la ventana de agosto y la excepción de los acuerdos legacy son todas correctas.",
        },
        {
          label: "Ajuste de formato",
          dimension: "instruction",
          status: "passed",
          detail: "Exactamente cinco diapositivas, un mensaje cada una.",
        },
        {
          label: "Acabado de la entrega",
          dimension: "ownership",
          status: "partial",
          detail:
            "La diapositiva 4 todavía conservaba el preámbulo de la IA: '¡Claro! Aquí tienes una lista con viñetas'.",
        },
      ],
      strengths: ["Tono apropiado para partners externos en todo el documento."],
      improvements: [
        "Relee siempre el contenido redactado por la IA para eliminar muletillas antes de que salga de la empresa.",
      ],
    },
  ],
};
