export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  attachedFile?: boolean;
  attachedFileName?: string;
  // Base64-encoded raw bytes of a spreadsheet attachment (.xlsx/.xls). Kept
  // separate from `content` so the backend can convert it to a plain-text
  // table right before calling the model, instead of ever sending the raw
  // binary as if it were text.
  attachedFileBase64?: string;
};

export type SlideContent = {
  title: string;
  bullets: string;
};

export type TaskClientState = {
  messages: ChatMessage[];
  deliverable: string;
  slides: SlideContent[];
  submitted: boolean;
  startedAt: number | null;
};

export type IntakeAnswers = Record<string, string | string[] | number>;

export type SessionState = {
  accessKey: string;
  intakeAnswers: IntakeAnswers | null;
  stepIndex: number; // 0 = intake, 1..N = tasks (1-indexed into mockData.tasks), N+1 = done
  tasks: TaskClientState[];
};
