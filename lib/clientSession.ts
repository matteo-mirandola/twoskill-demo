import type { SessionState, TaskClientState } from "./types";
import { tasks } from "./mockData";

const STORAGE_KEY = "2skill_session_v1";

function emptyTaskState(): TaskClientState {
  return {
    messages: [],
    deliverable: "",
    slides: [
      { title: "", bullets: "" },
      { title: "", bullets: "" },
      { title: "", bullets: "" },
      { title: "", bullets: "" },
      { title: "", bullets: "" },
    ],
    submitted: false,
    startedAt: null,
  };
}

export function createInitialSession(accessKey: string): SessionState {
  return {
    accessKey,
    intakeAnswers: null,
    stepIndex: 0,
    tasks: tasks.map(() => emptyTaskState()),
  };
}

export function readStoredSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: SessionState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
