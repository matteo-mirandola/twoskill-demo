"use client";

import { useEffect, useState } from "react";
import { tasks } from "@/lib/mockData";
import type {
  SessionState,
  IntakeAnswers,
  ChatMessage,
  SlideContent,
  TaskClientState,
} from "@/lib/types";
import {
  createInitialSession,
  readStoredSession,
  writeStoredSession,
  clearStoredSession,
} from "@/lib/clientSession";
import ProgressBar from "./ProgressBar";
import Intake from "./Intake";
import TaskScreen from "./TaskScreen";
import CompletionScreen from "./CompletionScreen";
import DevNav from "./DevNav";
import ConfirmDialog from "./ConfirmDialog";

type GateStatus = "checking" | "valid" | "invalid";

function normalizeStep(session: SessionState): SessionState {
  let stepIndex = session.stepIndex;
  while (
    stepIndex >= 1 &&
    stepIndex <= tasks.length &&
    session.tasks[stepIndex - 1]?.submitted
  ) {
    stepIndex += 1;
  }
  return stepIndex === session.stepIndex ? session : { ...session, stepIndex };
}

export default function AssessmentApp({
  keyParam,
  devMode,
}: {
  keyParam: string | null;
  devMode: boolean;
}) {
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [session, setSession] = useState<SessionState | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveAccess() {
      const stored = readStoredSession();
      const candidateKey = keyParam ?? stored?.accessKey ?? null;

      if (!candidateKey) {
        if (!cancelled) setGateStatus("invalid");
        return;
      }

      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: candidateKey }),
        });
        const data: { ok: boolean } = await res.json();
        if (cancelled) return;

        if (!data.ok) {
          clearStoredSession();
          setGateStatus("invalid");
          return;
        }
        const restored =
          stored && stored.accessKey === candidateKey
            ? normalizeStep(stored)
            : createInitialSession(candidateKey);
        setSession(restored);
        setGateStatus("valid");
      } catch {
        if (!cancelled) setGateStatus("invalid");
      }
    }

    resolveAccess();

    return () => {
      cancelled = true;
    };
  }, [keyParam]);

  useEffect(() => {
    if (session) writeStoredSession(session);
  }, [session]);

  if (gateStatus === "checking") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[var(--foreground-subtle)]">Loading…</p>
      </div>
    );
  }

  if (gateStatus === "invalid" || !session) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">
          This link is not valid.
        </p>
      </div>
    );
  }

  const accessKey = session.accessKey;
  const taskIndex = session.stepIndex - 1;
  const isTaskStep = taskIndex >= 0 && taskIndex < tasks.length;
  const isDone = session.stepIndex === tasks.length + 1;

  function updateTaskState(idx: number, patch: Partial<TaskClientState>) {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
      };
    });
  }

  function goToStep(step: number) {
    setSession((prev) => {
      if (!prev) return prev;
      const tIdx = step - 1;
      const needsStart =
        tIdx >= 0 && tIdx < tasks.length && !prev.tasks[tIdx].startedAt;
      return {
        ...prev,
        stepIndex: step,
        tasks: needsStart
          ? prev.tasks.map((t, i) =>
              i === tIdx ? { ...t, startedAt: Date.now() } : t
            )
          : prev.tasks,
      };
    });
  }

  function handleStart(answers: IntakeAnswers) {
    setSession((prev) => (prev ? { ...prev, intakeAnswers: answers } : prev));
    goToStep(1);
  }

  function handleSubmitTask(idx: number) {
    if (!session) return;
    const task = tasks[idx];
    const state = session.tasks[idx];
    const wallClockSeconds = state.startedAt
      ? Math.round((Date.now() - state.startedAt) / 1000)
      : 0;
    const deliverableLength =
      task.deliverableKind === "slides"
        ? state.slides.reduce(
            (sum, s) => sum + s.title.length + s.bullets.length,
            0
          )
        : state.deliverable.length;

    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: accessKey,
        taskId: task.id,
        wallClockSeconds,
        deliverableLength,
      }),
    }).catch(() => {});

    updateTaskState(idx, { submitted: true });
    goToStep(idx + 2);
  }

  function handleReset() {
    clearStoredSession();
    setSession(createInitialSession(accessKey));
    setShowResetConfirm(false);
  }

  function handlePrefill() {
    if (!isTaskStep) return;
    const task = tasks[taskIndex];
    if (task.deliverableKind === "slides") {
      const sample: SlideContent = {
        title: "Sample slide title",
        bullets: "Sample bullet one\nSample bullet two",
      };
      updateTaskState(taskIndex, {
        slides: [sample, sample, sample, sample, sample],
      });
    } else {
      updateTaskState(taskIndex, {
        deliverable: "Sample deliverable text for dev preview purposes.",
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <ProgressBar stepIndex={session.stepIndex} />

      <div className="flex min-h-0 flex-1 flex-col">
        {session.stepIndex === 0 && (
          <Intake
            initialAnswers={session.intakeAnswers ?? {}}
            onStart={handleStart}
          />
        )}

        {isTaskStep && (
          <TaskScreen
            key={tasks[taskIndex].id}
            task={tasks[taskIndex]}
            taskNumber={taskIndex + 1}
            state={session.tasks[taskIndex]}
            accessKey={accessKey}
            onChangeMessages={(m: ChatMessage[]) =>
              updateTaskState(taskIndex, { messages: m })
            }
            onChangeDeliverable={(v: string) =>
              updateTaskState(taskIndex, { deliverable: v })
            }
            onChangeSlides={(v: SlideContent[]) =>
              updateTaskState(taskIndex, { slides: v })
            }
            onSubmit={() => handleSubmitTask(taskIndex)}
          />
        )}

        {isDone && <CompletionScreen />}
      </div>

      {devMode && (
        <DevNav
          currentStep={session.stepIndex}
          onJump={goToStep}
          onReset={() => setShowResetConfirm(true)}
          onPrefill={handlePrefill}
        />
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset session"
          message="This clears all progress for this browser tab and starts over from intake."
          confirmLabel="Reset"
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
