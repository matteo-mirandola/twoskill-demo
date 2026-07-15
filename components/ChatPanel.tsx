"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import Markdown from "./Markdown";
import ClaudeLogo from "./ClaudeLogo";

export default function ChatPanel({
  taskId,
  accessKey,
  messages,
  onChange,
  maxUserMessages,
  canAttach,
  disabled,
}: {
  taskId: string;
  accessKey: string;
  messages: ChatMessage[];
  onChange: (next: ChatMessage[]) => void;
  maxUserMessages: number;
  canAttach: boolean;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");
  const [attachPending, setAttachPending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userCount = messages.filter((m) => m.role === "user").length;
  const capReached = userCount >= maxUserMessages;
  const nearCap = !capReached && userCount === maxUserMessages - 2;
  const locked = disabled || capReached;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if ((!text && !attachPending) || locked || isStreaming) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      attachedFile: attachPending,
    };
    const withUser = [...messages, userMessage];
    onChange(withUser);
    setInput("");
    setAttachPending(false);
    setIsStreaming(true);
    setError(null);
    onChange([...withUser, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey, taskId, messages: withUser }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        onChange(withUser);
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        onChange([...withUser, { role: "assistant", content: assistantText }]);
      }
    } catch {
      setError("Connection lost. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--claude-dark-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--claude-dark-border)] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <ClaudeLogo className="h-4 w-4 text-[var(--claude-accent)]" />
          <span className="font-serif text-sm font-semibold text-[var(--claude-dark-text)]">
            Claude
          </span>
        </div>
        <span className="tabular-nums text-xs text-[var(--claude-dark-text-muted)]">
          {userCount}/{maxUserMessages}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="thin-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 && (
          <p className="mt-2 text-center text-xs text-[var(--claude-dark-text-muted)]">
            Ask the assistant anything about this task.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] text-sm leading-6 ${
                m.role === "user"
                  ? "rounded-xl bg-[var(--claude-dark-surface)] px-3 py-2 text-[var(--claude-dark-text)]"
                  : "text-[var(--claude-dark-text)]"
              }`}
            >
              {m.attachedFile && (
                <div className="mb-1 flex items-center gap-1 text-xs text-[var(--claude-dark-text-muted)]">
                  <PaperclipIcon /> payments_march.csv attached
                </div>
              )}
              {m.role === "assistant" ? (
                m.content ? (
                  <Markdown>{m.content}</Markdown>
                ) : isStreaming && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <Dot delay="0ms" />
                    <Dot delay="120ms" />
                    <Dot delay="240ms" />
                  </span>
                ) : null
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="border-t border-[var(--red-soft-border)] bg-[var(--red-soft)] px-4 py-2 text-xs text-[var(--red)]">
          {error}
        </p>
      )}
      {nearCap && (
        <p className="border-t border-[var(--amber-soft-border)] bg-[var(--amber-soft)] px-4 py-2 text-xs text-[var(--amber)]">
          {maxUserMessages - userCount} messages left in this task.
        </p>
      )}

      <div className="border-t border-[var(--claude-dark-border)] p-3">
        {locked ? (
          <p className="rounded-md bg-[var(--claude-dark-surface)] px-3 py-2.5 text-center text-xs font-medium text-[var(--claude-dark-text-muted)]">
            {disabled
              ? "This task has been submitted."
              : "Message limit reached for this task."}
          </p>
        ) : (
          <>
            {attachPending && (
              <div className="mb-2 flex w-fit items-center gap-1.5 self-start rounded-md bg-[var(--claude-dark-surface)] px-2 py-1 text-xs font-medium text-[var(--claude-accent)]">
                <PaperclipIcon /> payments_march.csv
                <button
                  onClick={() => setAttachPending(false)}
                  aria-label="Remove attachment"
                  className="ml-1 text-[var(--claude-accent)] hover:opacity-70"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              {canAttach && (
                <button
                  type="button"
                  onClick={() => setAttachPending((v) => !v)}
                  title="Attach file"
                  aria-label="Attach file"
                  className={`btn-press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    attachPending
                      ? "border-[var(--claude-accent)] bg-[var(--claude-dark-surface)] text-[var(--claude-accent)]"
                      : "border-[var(--claude-dark-border)] bg-[var(--claude-dark-surface)] text-[var(--claude-dark-text-muted)] hover:bg-[var(--claude-dark-surface-hover)]"
                  }`}
                >
                  <PaperclipIcon />
                </button>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Message the assistant…"
                rows={1}
                className="thin-scroll max-h-28 flex-1 resize-none rounded-lg border border-[var(--claude-dark-border)] bg-[var(--claude-dark-surface)] px-3 py-2 text-sm text-[var(--claude-dark-text)] outline-none transition-colors placeholder:text-[var(--claude-dark-text-muted)] focus:border-[var(--claude-accent)]"
              />
              <button
                onClick={send}
                disabled={isStreaming || (!input.trim() && !attachPending)}
                className="btn-press flex h-9 shrink-0 items-center justify-center rounded-lg bg-[var(--claude-accent)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--claude-accent-hover)] disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M14.5 7.5l-6 6a2.5 2.5 0 003.5 3.5l6.5-6.5a4 4 0 00-5.5-5.8L6.5 11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--claude-dark-text-muted)]"
      style={{ animationDelay: delay }}
    />
  );
}
