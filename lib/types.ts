export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  attachedFile?: boolean;
  attachedFileName?: string;
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
