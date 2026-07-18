// 2Skill prototype — ALL test content lives here. Components must not invent copy.
// Traps are planted in this content by design. Do not "fix" apparent inconsistencies
// in Task 2 sources: the contradiction between sources is intentional.

export const intakeQuestions = [
  {
    id: "area",
    type: "single" as const,
    question: "¿Cuál es tu principal área de trabajo?",
    options: [
      "Ventas",
      "Marketing y Contenido",
      "Producto y Tecnología",
      "Operaciones",
      "Atención al Cliente",
      "Finanzas y Administración",
      "Recursos Humanos",
      "Dirección",
      "Otro",
    ],
  },
  {
    id: "seniority",
    type: "single" as const,
    question: "¿Cuál es tu nivel de responsabilidad?",
    options: ["Colaborador/a individual", "Mando intermedio", "Dirección", "Fundador/a o propietario/a"],
  },
  {
    id: "tools",
    type: "multi" as const,
    question: "¿Qué herramientas de IA usas en el trabajo?",
    options: ["ChatGPT", "Claude", "Gemini", "Copilot", "Otro", "Ninguna"],
  },
  {
    id: "frequency",
    type: "single" as const,
    question: "¿Con qué frecuencia usas IA para el trabajo?",
    options: ["Nunca", "Algunas veces al mes", "Semanalmente", "A diario"],
  },
  {
    id: "account",
    type: "single" as const,
    question: "Cuando usas IA para el trabajo, ¿con qué cuenta lo haces?",
    options: ["Cuenta personal gratuita", "Cuenta personal de pago", "Cuenta de la empresa", "No estoy seguro/a"],
  },
  {
    id: "aiUseCases",
    type: "multi" as const,
    question: "¿Para qué tipo de tareas usas la IA actualmente?",
    options: [
      "Redactar o revisar textos",
      "Buscar o resumir información",
      "Analizar datos",
      "Generar ideas",
      "Programar",
      "Todavía no la uso",
    ],
  },
  {
    id: "personalUse",
    type: "single" as const,
    question: "¿Usas la IA en tu vida personal (fuera del trabajo)?",
    options: [
      "No la uso",
      "Sí, para tareas puntuales (buscar información, escribir mensajes)",
      "Sí, con frecuencia y para cosas variadas",
      "Sí, es parte de mi día a día",
    ],
  },
  {
    id: "selfRating",
    type: "scale" as const,
    question: "¿Qué tan seguro/a te sientes de tus habilidades con la IA?",
    min: 1,
    max: 10,
  },
];

export type TaskDef = {
  id: string;
  title: string;
  minutes: number;
  maxUserMessages: number;
  maxResponseTokens: number;
  brief: string;            // markdown-ish, rendered in the left pane
  deliverableKind: "text" | "slides";
  deliverableLabel: string;
  materials: MaterialDef[];
};

export type MaterialDef =
  | { kind: "csv"; id: string; filename: string; sizeLabel: string; note: string }
  | { kind: "source"; id: string; label: string; title: string; body: string };

export const tasks: TaskDef[] = [
  // ────────────────────────────────────────────────────────────────────────
  // TASK 1 — Alert Summary
  // Traps: sensitive columns (attach raw file — client name + client domain
  // identify which companies had which security incidents), missable "exclude
  // false positives", output verification (AI-produced figures vs. CSV
  // ground truth).
  // Ground truth (from alertas_junio_2026.csv, 832 rows): alerts managed
  // (estado != "Falso positivo", i.e. "Gestionada" + "En curso") = 712.
  // Top 3 categories by count among those 712: Phishing / correo malicioso
  // (186), Malware en endpoint (153), Intento de suplantacion (130).
  // Wrong answer (false positives wrongly included): total = 832 (all rows).
  // The top-3 category ranking happens to stay the same, but every count is
  // inflated by the 120 false positives folded in.
  // Operational note worth surfacing: Nexia Fintech accounts for 82 of the
  // 130 "Intento de suplantacion" (impersonation attempt) alerts (63%) and
  // has the highest overall managed-alert volume of any client (191) — a
  // concentration worth flagging to leadership.
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "alert-summary",
    title: "El resumen de alertas",
    minutes: 11,
    maxUserMessages: 12,
    maxResponseTokens: 1500, // raised: the CSV may sit in context
    deliverableKind: "text",
    deliverableLabel: "Pega aquí tu resumen final de una página",
    brief: `**De:** Responsable de Operaciones SOC
**Para:** Ti
**Asunto:** Resumen de alertas para la reunión con dirección

El jueves dirección revisa lo del mes pasado y me hace falta un resumen de una página, algo que se lea en dos minutos.

Necesito tres cosas:
- Cuántas alertas gestionamos en total, sin contar los falsos positivos.
- Las tres categorías con más alertas.
- Una nota operativa: si ves algo en los datos que dirección debería saber, apúntalo.

Te paso la exportación completa adjunta.`,
    materials: [
      {
        kind: "csv",
        id: "alerts-csv",
        filename: "alertas_junio_2026.csv",
        sizeLabel: "832 filas · 88 KB",
        note: "Exportación completa de junio del sistema de alertas del SOC.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // TASK 2 — AI Meeting-Notes Briefing
  // Traps: contradiction (Fuente A: 78% de las grandes empresas ya han
  // desplegado, frente al 31% de hace 18 meses vs. Fuente E: menos del 15%
  // ha pasado de piloto a despliegue estable, y critica precisamente cifras
  // infladas de "empresas que han desplegado" como la de la Fuente A) ·
  // unverifiable/unsupported claim (el cierre de la Fuente A: "la ventana...
  // se está cerrando, quien entre el año que viene lo hará ya como
  // rezagado" — una predicción categórica sobre resultado competitivo que
  // nada más en el dossier respalda, y que de hecho las Fuentes C y E
  // contradicen con su tono más cauto). El resto es internamente consistente.
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "ai-notes-briefing",
    title: "El briefing de IA para actas",
    minutes: 10,
    maxUserMessages: 12,
    maxResponseTokens: 800,
    deliverableKind: "text",
    deliverableLabel: "Pega aquí tu briefing final de una página",
    brief: `**De:** Responsable de Estrategia
**Para:** Ti
**Asunto:** Briefing para el jueves — herramientas de IA para actas

Necesito un briefing de una página sobre si desplegamos herramientas de IA para transcribir y resumir las reuniones internas. Que termine con una recomendación clara: lo adoptamos ahora o esperamos.

Te adjunto las fuentes que he podido reunir. Trabaja a partir de ellas; prefiero algo apoyado en lo que ya tenemos que relleno genérico. Dirección lo revisa el jueves.`,
    materials: [
      {
        kind: "source",
        id: "src-1",
        label: "Fuente A — TecnoÁgora (blog tecnológico)",
        title: "La reunión que se escribe sola: por qué 2026 es el año de las actas con IA",
        body: `Durante décadas, la reunión de empresa ha arrastrado el mismo lastre invisible: alguien tiene que tomar notas. Esa persona deja de participar, escribe a medias lo que oye, y al día siguiente reparte un acta que nadie termina de leer. Las herramientas de IA para transcripción y resumen de reuniones han venido a enterrar ese modelo, y los números que están saliendo este año no dejan mucho espacio para la duda.

Según el último barómetro sectorial, el 78% de las grandes empresas ya han desplegado alguna herramienta de IA para actas en al menos un departamento. La cifra era del 31% hace apenas dieciocho meses. Cuando una tecnología se mueve a esa velocidad, la pregunta para el resto del mercado deja de ser "si" y pasa a ser "cuándo", y cada trimestre de espera es terreno que ceden frente a competidores que ya están operando con equipos más rápidos.

El funcionamiento es sencillo. La herramienta se conecta al sistema de videollamada, escucha la reunión, y devuelve una transcripción completa más un resumen estructurado: puntos tratados, decisiones tomadas y, lo que más valoran los equipos, una lista automática de tareas asignadas con responsable y fecha. Lo que antes ocupaba a una persona durante media hora después de cada reunión ahora aparece solo, en el momento en que la llamada termina.

Los primeros en adoptarlo fueron los equipos comerciales, que necesitan registrar cada conversación con cliente sin perder el hilo del trato. Detrás llegaron los departamentos de producto, de recursos humanos y de operaciones. El patrón se repite en todos: al principio hay resistencia, alguien pregunta si de verdad hace falta, y a las dos semanas nadie quiere volver a tomar notas a mano.

No todo es perfecto. La calidad del resumen depende de la calidad del audio, y las reuniones con mucha gente hablando a la vez siguen dando problemas. Pero la dirección del viento está clara. Las empresas que hoy siguen debatiendo si dar el paso son, cada vez más, la excepción. La ventana para adoptar esta tecnología como ventaja competitiva se está cerrando, y quien entre el año que viene lo hará ya como rezagado, no como pionero.`,
      },
      {
        kind: "source",
        id: "src-2",
        label: "Fuente B — Reunia (ficha de producto y caso de cliente)",
        title: "Reunia — Tus reuniones, convertidas en decisiones",
        body: `Reunia es la plataforma de inteligencia de reuniones que utilizan más de 4.000 equipos en Europa. Se integra en un clic con las principales plataformas de videollamada y empieza a trabajar desde la primera reunión, sin proyectos de implantación ni formación técnica.

**Qué hace Reunia por tu equipo:**
- Transcripción automática en 32 idiomas, con identificación de cada interlocutor.
- Resumen ejecutivo generado al terminar la llamada, listo para reenviar.
- Extracción automática de tareas, con responsable y fecha detectados en la conversación.
- Buscador sobre todo tu histórico de reuniones: encuentra cualquier decisión pasada escribiendo dos palabras.
- Seguridad de nivel empresarial y cifrado de extremo a extremo.

**Caso de cliente: grupo asegurador (450 empleados)**

Antes de Reunia, el equipo de siniestros de este grupo asegurador dedicaba una media de 40 minutos después de cada reunión de coordinación a redactar y repartir el acta. Con doce reuniones semanales entre los distintos turnos, eso suponía ocho horas de trabajo administrativo cada semana que no aportaban valor directo al cliente.

Tres meses después de desplegar Reunia, ese tiempo se ha reducido prácticamente a cero. "Lo que más nos ha sorprendido no es el ahorro de tiempo, que ya esperábamos, sino que ahora las decisiones no se pierden", explica la responsable de operaciones. "Antes una decisión tomada en una reunión de los lunes se diluía si la persona que tomaba notas estaba de vacaciones. Ahora está todo registrado y es buscable. Hemos recuperado horas y, sobre todo, hemos dejado de repetir conversaciones que ya habíamos tenido."

El grupo calcula un retorno de la inversión en menos de dos meses, contando solo el tiempo administrativo recuperado. No entran en ese cálculo las mejoras difíciles de cuantificar: menos malentendidos, seguimiento más limpio de los acuerdos y una memoria de equipo que no depende de que una persona concreta se acuerde de lo que se dijo.

**Empieza hoy.** Prueba Reunia gratis durante 14 días. Sin tarjeta, sin compromiso.`,
      },
      {
        kind: "source",
        id: "src-3",
        label: "Fuente C — Cátedra Advisory (extracto de informe sectorial)",
        title: "Herramientas de inteligencia de reuniones: panorama de mercado 2026",
        body: `**Resumen para dirección.** El segmento de herramientas de IA aplicadas a la gestión de reuniones ha pasado en dos años de ser una categoría emergente a consolidarse como una subcategoría estable dentro del software de productividad. Nuestra estimación sitúa el mercado europeo en una fase de crecimiento sostenido, impulsado por la mejora en la precisión de la transcripción y por la integración nativa con las plataformas de videollamada dominantes.

**Estructura de la oferta.** Identificamos tres perfiles de proveedor. En primer lugar, los módulos integrados que los propios fabricantes de plataformas de videollamada incorporan a su producto; su ventaja es la ausencia de fricción de despliegue, su límite es la escasa profundidad funcional. En segundo lugar, los especialistas independientes, que ofrecen funciones avanzadas de resumen, extracción de tareas y búsqueda sobre el histórico; aquí se concentra la innovación, pero también la mayor dispersión en calidad y en modelos de precio. En tercer lugar, las suites de productividad más amplias que añaden la funcionalidad de actas como una pieza más de un ecosistema mayor.

**Consideraciones de adopción.** Nuestra recomendación para organizaciones que evalúan la categoría es abordar la decisión como un proyecto de despliegue, no como una compra de herramienta. Los factores que con más frecuencia determinan el éxito o el fracaso de una implantación, según nuestra base de casos, son los siguientes:

1. *Integración con el flujo de trabajo existente.* Una herramienta que obliga a cambiar de plataforma o a exportar manualmente los resultados pierde gran parte de su valor. La adopción se sostiene cuando el resultado aparece donde el equipo ya trabaja.

2. *Precisión en el contexto real de la organización.* Las cifras de precisión que publican los proveedores se obtienen en condiciones ideales. El rendimiento sobre audio de reuniones reales, con solapamiento de voces, ruido y vocabulario especializado, es sensiblemente inferior y debe validarse en un piloto antes de escalar.

3. *Gobernanza del contenido generado.* Toda organización que introduce estas herramientas genera un nuevo repositorio de información: transcripciones íntegras de sus reuniones. La política de acceso, conservación y responsabilidad sobre ese repositorio suele definirse tarde, cuando ya existe un volumen considerable de contenido acumulado.

**Perspectiva.** Esperamos que la categoría continúe madurando y que la diferenciación entre proveedores se desplace desde la precisión de la transcripción, que tiende a homogeneizarse, hacia las capacidades de integración y de gestión del conocimiento. Las organizaciones que hoy pilotan la tecnología estarán mejor posicionadas para aprovechar esa siguiente fase que las que esperen a que la categoría se estabilice por completo.`,
      },
      {
        kind: "source",
        id: "src-4",
        label: "Fuente D — Foro TecnoAdmin (hilo de comunidad de administradores de sistemas)",
        title: "¿Qué herramienta de actas con IA estáis usando de verdad? Experiencias reales, no folletos",
        body: `**mgarrido_IT** · Llevamos tres meses probando dos de las herramientas más nombradas en un piloto con el equipo comercial. Resumen honesto: la transcripción está muy bien cuando habla una sola persona con buen micro. En cuanto se solapan dos voces o alguien habla con acento marcado, la cosa se degrada rápido. El resumen se inventa cosas de vez en cuando, sobre todo cuando en la reunión no se llega a ninguna conclusión clara. Detecta una decisión que nunca se tomó. Hay que revisarlo siempre, lo cual mata parte del ahorro de tiempo que te venden.

**dcastro** · +1 al tema de los acentos. Tenemos gente de varios países en las llamadas y la precisión cae un montón. Para reuniones internas nos vale porque ya sabemos de qué iba, pero no me fiaría de mandar el resumen automático a un cliente sin leerlo entero antes.

**laura_sysadmin** · Nosotros lo desplegamos y lo retiramos a las seis semanas. No por la herramienta en sí, que funcionaba bien. Somos un centro sanitario y cuando legal se sentó a mirar el asunto en serio, la cosa se paró. No entro en detalles pero digamos que la conversación sobre qué pasaba con las grabaciones no tuvo una respuesta que dejara tranquilo a nadie. Si estáis en un sector regulado, habladlo con vuestra gente de compliance ANTES de desplegar, no después.

**mgarrido_IT** · @laura_sysadmin muy de acuerdo con hacerlo antes. Nosotros lo estamos usando solo para reuniones internas de coordinación, nada sensible, y aun así el departamento legal nos ha pedido una revisión. Para reuniones donde se hablan cosas de clientes lo tenemos parado hasta aclararlo.

**jotaeme** · A nivel puramente funcional, la extracción de tareas es lo que más me ha gustado. Que te saque solo el "quién hace qué y para cuándo" ya justifica bastante. Pero coincido en que el resumen narrativo hay que revisarlo. No es plug and play por mucho que lo pinten así.

**dcastro** · Conclusión del hilo para el que llegue nuevo: útil, sobre todo para tareas. Revisar siempre. Y si tocáis datos sensibles, no deis por hecho nada, preguntad antes.`,
      },
      {
        kind: "source",
        id: "src-5",
        label: "Fuente E — Cinco Column (reportaje económico)",
        title: "Actas con IA: entre el ahorro real y el ruido del mercado",
        body: `La promesa es atractiva y el mercado la ha amplificado con entusiasmo: reuniones que se transcriben y se resumen solas, tareas que se asignan sin que nadie las apunte, y horas de trabajo administrativo que desaparecen. Detrás del ruido, sin embargo, la adopción real en el tejido empresarial es más prudente de lo que sugieren algunos titulares.

Según los datos de penetración que manejan las principales consultoras del sector, menos del 15% de las empresas ha pasado de la fase de prueba a un despliegue estable y generalizado. La inmensa mayoría de las organizaciones que han tocado esta tecnología lo han hecho en formato piloto, limitado a un equipo concreto y sin una decisión firme de extenderlo. Conviene tener presente ese matiz cuando se leen cifras de adopción más llamativas, que a menudo cuentan como "empresa que ha desplegado" a cualquier organización donde una sola persona ha activado una prueba gratuita.

Los responsables de tecnología consultados coinciden en que el valor de la herramienta es real, pero acotado. "Donde de verdad ahorra es en el registro de acuerdos y en el seguimiento de tareas", explica el director de sistemas de una empresa industrial mediana. "El resumen narrativo todavía hay que supervisarlo. Y hay reuniones que directamente no queremos que pasen por una herramienta de estas."

Ese último punto es el que más frena la adopción a gran escala. La comodidad de que un sistema escuche, grabe y transcriba cada reunión convive con una incomodidad creciente sobre qué se hace después con ese material. Las conversaciones de una empresa contienen información estratégica, datos de clientes y, en muchos casos, información sujeta a normativa. Introducir un tercero que procesa todo ese contenido no es una decisión de productividad, es una decisión que cruza lo operativo con lo legal, y las organizaciones que la abordan solo desde el ahorro de tiempo suelen descubrir la otra cara más tarde de lo que les gustaría.

El consenso entre los expertos no es "no lo hagáis", sino "no lo hagáis a ciegas". La tecnología ha madurado lo suficiente como para aportar valor, pero la diferencia entre una adopción que sale bien y una que acaba retirándose está menos en la herramienta que en el trabajo previo: definir para qué reuniones sí y para cuáles no, decidir quién puede acceder a las transcripciones y, sobre todo, tener una respuesta clara a la pregunta que muchas empresas se hacen demasiado tarde.`,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // TASK 3 — Partner Deck
  // Traps: internal detail (infrastructure-provider migration following a
  // security incident with the previous provider, still under NDA — must
  // not appear in slides; a generic "estamos mejorando nuestra
  // infraestructura" is NOT a leak) · exact figures (€2.80 fee, was €3.20
  // per endpoint; September 1st; August 1–31 window; standard agreements
  // only, legacy unaffected until renewal) · format-fit (5 slides, one
  // message per slide) · delivery-polish (AI-tell markers — demo-level only
  // in the prototype).
  // ────────────────────────────────────────────────────────────────────────
  {
    id: "partner-deck",
    title: "El deck de socios",
    minutes: 7,
    maxUserMessages: 12,
    maxResponseTokens: 800,
    deliverableKind: "slides",
    deliverableLabel: "Escribe el contenido de cada diapositiva (título + puntos)",
    brief: `**De:** Responsable de Comunicación
**Para:** Ti
**Asunto:** Contenido para el deck de actualización a partners

Prepárame el contenido de un deck de **5 diapositivas** para anunciar el nuevo esquema de precios a los partners.

Estas son las cifras:
- La cuota por endpoint baja de 3,20 € a **2,80 €**, a partir del **1 de septiembre**.
- La ventana de transición va del **1 al 31 de agosto**; durante ese mes se aceptan los dos esquemas.
- El cambio aplica a **todos los partners con acuerdo estándar**. Los acuerdos legacy se mantienen hasta que toque renovarlos.

Un apunte solo para ti: parte del motivo del cambio es que estamos migrando de proveedor de infraestructura después de un incidente de seguridad con el anterior, algo que todavía está bajo acuerdo de confidencialidad. Es interno, así que no puede aparecer en nada que llegue a los partners.`,
    materials: [],
  },
];

export const completionScreen = {
  title: "Evaluación completada",
  body: "Gracias — tu sesión ha quedado registrada. Tu informe se está preparando y se compartirá contigo directamente.",
  reportSending: "Evaluando tu sesión y preparando tu informe…",
  reportReady: "Tu informe de resultados personal está listo — descárgalo abajo.",
  reportError: "No hemos podido generar tu informe. Inténtalo de nuevo.",
  reportRetry: "Intentar de nuevo",
  reportDownload: "Descargar tu informe (PDF)",
};
