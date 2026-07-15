"use client";

import { useState } from "react";
import type { TaskDef } from "@/lib/mockData";
import type { TaskClientState, ChatMessage, SlideContent } from "@/lib/types";
import Markdown from "./Markdown";
import Timer from "./Timer";
import MaterialsPane from "./MaterialsPane";
import ChatPanel from "./ChatPanel";
import DeliverablePanel from "./DeliverablePanel";
import SlideEditor from "./SlideEditor";
import ConfirmDialog from "./ConfirmDialog";

export default function TaskScreen({
  task,
  taskNumber,
  state,
  accessKey,
  onChangeMessages,
  onChangeDeliverable,
  onChangeSlides,
  onSubmit,
}: {
  task: TaskDef;
  taskNumber: number;
  state: TaskClientState;
  accessKey: string;
  onChangeMessages: (m: ChatMessage[]) => void;
  onChangeDeliverable: (v: string) => void;
  onChangeSlides: (v: SlideContent[]) => void;
  onSubmit: () => void;
}) {
  // 0 = none, 1 = "empty deliverable?" check, 2 = final "can't go back" confirm
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [deliverableExpanded, setDeliverableExpanded] = useState(false);

  const isEmpty =
    task.deliverableKind === "slides"
      ? state.slides.every((s) => !s.title.trim() && !s.bullets.trim())
      : !state.deliverable.trim();

  return (
    <div className="fade-in flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Left half: brief, with materials flowing below it */}
      <div className="thin-scroll flex min-h-0 flex-col overflow-y-auto border-b border-[var(--border)] p-5 lg:w-1/2 lg:border-b-0 lg:border-r">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Task {taskNumber} · {task.title}
          </span>
          <Timer minutes={task.minutes} startedAt={state.startedAt} />
        </div>
        <Markdown>{task.brief}</Markdown>

        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            Materials
          </p>
          <MaterialsPane materials={task.materials} accessKey={accessKey} />
        </div>
      </div>

      {/* Right half: full-height chat, with a collapsible deliverable drawer */}
      <div className="flex min-h-0 flex-1 flex-col lg:w-1/2">
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatPanel
            taskId={task.id}
            accessKey={accessKey}
            messages={state.messages}
            onChange={onChangeMessages}
            maxUserMessages={task.maxUserMessages}
            canAttach={task.id === "monthly-report"}
            disabled={state.submitted}
          />
        </div>

        <div
          className={`flex min-h-0 flex-col border-t border-[var(--border)] ${
            deliverableExpanded ? "flex-1" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setDeliverableExpanded((v) => !v)}
            className="btn-press flex shrink-0 items-center justify-between px-4 py-3 text-left hover:bg-black/[.02]"
          >
            <span className="text-sm font-bold text-[var(--foreground)]">
              {task.deliverableLabel}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="shrink-0 text-[var(--foreground-muted)] transition-transform duration-200"
              style={{
                transform: deliverableExpanded
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              }}
            >
              <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {deliverableExpanded && (
            <div className="flex min-h-0 flex-1 flex-col">
              {task.deliverableKind === "slides" ? (
                <SlideEditor
                  slides={state.slides}
                  onChange={onChangeSlides}
                  disabled={state.submitted}
                />
              ) : (
                <DeliverablePanel
                  value={state.deliverable}
                  onChange={onChangeDeliverable}
                  disabled={state.submitted}
                />
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] p-3">
          <button
            onClick={() => setConfirmStep(isEmpty ? 1 : 2)}
            disabled={state.submitted}
            className="btn-press btn-hover-lift w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          >
            Submit & continue
          </button>
        </div>
      </div>

      {confirmStep === 1 && (
        <ConfirmDialog
          title="Empty deliverable"
          message="You haven't written anything yet. Submit anyway?"
          confirmLabel="Submit anyway"
          onConfirm={() => setConfirmStep(2)}
          onCancel={() => setConfirmStep(0)}
        />
      )}
      {confirmStep === 2 && (
        <ConfirmDialog
          title="Submit task"
          message="You won't be able to return to this task."
          confirmLabel="Submit & continue"
          onConfirm={() => {
            setConfirmStep(0);
            onSubmit();
          }}
          onCancel={() => setConfirmStep(0)}
        />
      )}
    </div>
  );
}
