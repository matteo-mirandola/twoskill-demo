import type { ReportGrades } from "./grading";

// Fallback grades used when the Anthropic API key is missing or the grading
// call fails, and by the dev preview endpoint. Keeps the demo flowing: the
// participant still receives a complete, plausible report.
export const MOCK_GRADES: ReportGrades = {
  overall: {
    score: 68,
    level: "Practitioner",
    summary:
      "Usas la IA de forma efectiva para redactar y sintetizar, y tus entregables están bien estructurados. El principal punto débil es la verificación: en dos de las tres tareas dejaste pasar resultados de la IA sin comprobarlos contra la fuente.",
  },
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
          status: "missed",
          detail:
            "Indicaste 832 alertas en total — la cifra que incluye los falsos positivos. El total gestionado correcto, excluyéndolos, es 712.",
        },
        {
          label: "Fidelidad a la instrucción",
          status: "partial",
          detail:
            "El brief pedía excluir los falsos positivos; tu prompt a la IA nunca mencionó esa condición.",
        },
        {
          label: "Manejo de datos",
          status: "passed",
          detail:
            "Hiciste preguntas puntuales en lugar de pegar la exportación en bruto, manteniendo los nombres y dominios de cliente fuera del chat.",
        },
        {
          label: "Verificación del resultado",
          status: "missed",
          detail:
            "Las cifras de la IA pasaron a tu entregable sin cambios, sin ninguna comprobación visible en el chat.",
        },
      ],
      strengths: ["Estructura de una página clara, con una nota operativa realmente útil."],
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
        "Briefing sólido y bien fundamentado en las fuentes, con una recomendación clara. Detectaste solo parcialmente la contradicción entre fuentes.",
      findings: [
        {
          label: "Contradicción detectada",
          status: "partial",
          detail:
            "Señalaste que 'las fuentes difieren en el ritmo de adopción', pero aun así lideraste con el 78% sin contraponerlo a la cifra de la Fuente E.",
        },
        {
          label: "Afirmaciones no verificadas",
          status: "passed",
          detail:
            "Atribuiste la predicción sobre la ventana de oportunidad a su fuente en lugar de presentarla como un hecho.",
        },
        {
          label: "Base en las fuentes",
          status: "passed",
          detail: "Ninguna estadística inventada; todo se remonta al dossier.",
        },
        {
          label: "Accionabilidad",
          status: "passed",
          detail: "Recomendación clara de 'adoptar ahora, empezando en pequeño'.",
        },
      ],
      strengths: ["Buen uso del caso de cliente de la Fuente B para ilustrar el ahorro real."],
      improvements: [
        "Cuando dos fuentes se contradicen, lidera con la contradicción — no la entierres.",
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
          status: "passed",
          detail:
            "Ninguna mención al incidente de seguridad ni a la migración de proveedor en ninguna diapositiva.",
        },
        {
          label: "Precisión de las cifras",
          status: "passed",
          detail:
            "2,80 €, el 1 de septiembre, la ventana de agosto y la excepción de los acuerdos legacy son todas correctas.",
        },
        {
          label: "Ajuste de formato",
          status: "passed",
          detail: "Exactamente cinco diapositivas, un mensaje cada una.",
        },
        {
          label: "Acabado de la entrega",
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
