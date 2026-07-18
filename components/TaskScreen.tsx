"use client";

import { useEffect, useState } from "react";
import type { TaskDef } from "@/lib/mockData";
import type { TaskClientState, ChatMessage, SlideContent } from "@/lib/types";
import Markdown from "./Markdown";
import Timer from "./Timer";
import MaterialsPane from "./MaterialsPane";
import ChatPanel from "./ChatPanel";
import DeliverablePanel from "./DeliverablePanel";
import SlideEditor from "./SlideEditor";
import ConfirmDialog from "./ConfirmDialog";

// The brief is always authored as "**Label:** value" lines, a blank line,
// then the body - split it so the meta lines can render as a distinct
// header block (matching the design's memo style) instead of flowing
// markdown text. Falls back to rendering the whole brief as the body if
// the shape doesn't match, so unexpected content never disappears.
function parseBrief(brief: string): {
  meta: { label: string; value: string }[];
  body: string;
} {
  const parts = brief.split(/\n\s*\n/);
  const metaLines = parts[0]
    .split("\n")
    .map((line) => line.match(/^\*\*(.+?):\*\*\s*(.*)$/));

  if (metaLines.length > 0 && metaLines.every((m) => m !== null)) {
    return {
      meta: metaLines.map((m) => ({ label: m![1], value: m![2] })),
      body: parts.slice(1).join("\n\n"),
    };
  }
  return { meta: [], body: brief };
}

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

  useEffect(() => {
    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: accessKey, taskId: task.id, event: "started" }),
    }).catch(() => {});
    // Fires once per task screen mount (TaskScreen is keyed by task.id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty =
    task.deliverableKind === "slides"
      ? state.slides.every((s) => !s.title.trim() && !s.bullets.trim())
      : !state.deliverable.trim();

  const { meta, body } = parseBrief(task.brief);

  return (
    <div className="fade-in flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Left half: task workspace - header, brief, materials, output */}
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto lg:w-1/2">
        <div className="mx-auto flex max-w-[640px] flex-col gap-9 px-8 py-12 sm:px-12">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--foreground)]">
              Task {taskNumber} · {task.title}
            </span>
            <Timer minutes={task.minutes} startedAt={state.startedAt} />
          </div>

          <div className="overflow-hidden rounded-[18px] bg-[var(--surface)] shadow-[var(--card-shadow)]">
            {meta.length > 0 && (
              <div className="flex flex-col gap-1.5 border-b border-[var(--border)] px-6 py-5 text-[13px] text-[var(--foreground-muted)]">
                {meta.map(({ label, value }) => (
                  <div key={label}>
                    <span>{label}:</span>{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="px-6 py-6 text-[15px] leading-relaxed text-[var(--foreground-body)]">
              <Markdown>{body}</Markdown>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
              Materials
            </p>
            <MaterialsPane materials={task.materials} accessKey={accessKey} />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[15px] font-extrabold text-[var(--foreground)]">
              {task.deliverableLabel}
            </p>
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

          <button
            onClick={() => setConfirmStep(isEmpty ? 1 : 2)}
            disabled={state.submitted}
            className="btn-press w-full rounded-2xl bg-[image:var(--accent-gradient)] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Submit & continue
          </button>
        </div>
      </div>

      {/* Right half: full-height Claude chat */}
      <div className="flex min-h-0 flex-1 flex-col lg:w-1/2">
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
