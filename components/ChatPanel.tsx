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
  const [pendingAttachment, setPendingAttachment] = useState<
    | { kind: "text"; name: string; content: string }
    | { kind: "spreadsheet"; name: string; base64: string }
    | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userCount = messages.filter((m) => m.role === "user").length;
  const capReached = userCount >= maxUserMessages;
  const nearCap = !capReached && userCount === maxUserMessages - 2;
  const locked = disabled || capReached;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (isSpreadsheetFile(file)) {
      const base64 = arrayBufferToBase64(await file.arrayBuffer());
      setPendingAttachment({ kind: "spreadsheet", name: file.name, base64 });
    } else {
      const content = await file.text();
      setPendingAttachment({ kind: "text", name: file.name, content });
    }
  }

  async function send() {
    const text = input.trim();
    if ((!text && !pendingAttachment) || locked || isStreaming) return;

    const content =
      pendingAttachment?.kind === "text"
        ? `Archivo adjunto: ${pendingAttachment.name}\n\`\`\`\n${pendingAttachment.content}\n\`\`\`${
            text ? `\n\n${text}` : ""
          }`
        : text;

    const userMessage: ChatMessage = {
      role: "user",
      content,
      attachedFile: !!pendingAttachment,
      attachedFileName: pendingAttachment?.name,
      attachedFileBase64:
        pendingAttachment?.kind === "spreadsheet"
          ? pendingAttachment.base64
          : undefined,
    };
    const withUser = [...messages, userMessage];
    onChange(withUser);
    setInput("");
    setPendingAttachment(null);
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
        setError(data?.error ?? "Algo salió mal. Inténtalo de nuevo.");
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
      setError("Se perdió la conexión. Inténtalo de nuevo.");
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
    <div className="flex min-h-0 flex-1 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-8 py-5">
        <div className="flex items-center gap-2.5">
          <ClaudeLogo className="h-5 w-5 rounded-[2px] text-[var(--claude-mark)]" />
          <span className="font-serif text-[19px] italic text-[var(--foreground)]">
            Claude
          </span>
        </div>
        <span className="text-[13px] font-semibold tabular-nums text-[var(--foreground-muted)]">
          Número de mensajes {userCount}/{maxUserMessages}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="thin-scroll flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-8 py-7"
      >
        {messages.length === 0 && (
          <p className="mt-2 text-center text-xs text-[var(--foreground-subtle)]">
            Pregunta al asistente lo que necesites sobre esta tarea.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex"}
          >
            <div
              className={`text-[14.5px] leading-relaxed ${
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-[var(--foreground)]"
                  : "max-w-[92%] text-[var(--foreground-body)]"
              }`}
            >
              {m.attachedFile && (
                <div
                  className={`mb-1 flex items-center gap-1 text-xs ${m.role === "user" ? "text-[var(--accent)]" : "text-[var(--foreground-subtle)]"}`}
                >
                  <PaperclipIcon /> {m.attachedFileName ?? "archivo"} adjuntado
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
        <p className="border-t border-[var(--red-soft-border)] bg-[var(--red-soft)] px-8 py-2 text-xs text-[var(--red)]">
          {error}
        </p>
      )}
      {nearCap && (
        <p className="border-t border-[var(--amber-soft-border)] bg-[var(--amber-soft)] px-8 py-2 text-xs text-[var(--amber)]">
          Te quedan {maxUserMessages - userCount} mensajes en esta tarea.
        </p>
      )}

      <div className="shrink-0 px-8 pb-7 pt-5">
        {locked ? (
          <p className="rounded-2xl bg-[var(--background)] px-4 py-3 text-center text-xs font-medium text-[var(--foreground-muted)]">
            {disabled
              ? "Esta tarea ya ha sido enviada."
              : "Has alcanzado el límite de mensajes para esta tarea."}
          </p>
        ) : (
          <>
            {pendingAttachment && (
              <div className="mb-2 flex w-fit items-center gap-1.5 self-start rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-medium text-[var(--accent)]">
                <PaperclipIcon /> {pendingAttachment.name}
                <button
                  onClick={() => setPendingAttachment(null)}
                  aria-label="Quitar archivo adjunto"
                  className="ml-1 text-[var(--accent)] hover:opacity-70"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex items-end gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-4 pr-2.5 shadow-[var(--card-shadow-sm)]">
              {canAttach && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Adjuntar archivo"
                    aria-label="Adjuntar archivo"
                    className={`btn-press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      pendingAttachment
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "text-[var(--foreground-muted)] hover:bg-[var(--background)]"
                    }`}
                  >
                    <PaperclipIcon />
                  </button>
                </>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Responde a Claude…"
                rows={1}
                className="thin-scroll max-h-28 flex-1 resize-none bg-transparent py-1.5 text-[14.5px] text-[var(--foreground)] outline-none"
              />
              <button
                onClick={send}
                disabled={isStreaming || (!input.trim() && !pendingAttachment)}
                className="btn-press flex h-9 shrink-0 items-center justify-center rounded-[10px] bg-[image:var(--accent-gradient)] px-4 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

function isSpreadsheetFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    SPREADSHEET_MIME_TYPES.has(file.type)
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
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
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--foreground-subtle)]"
      style={{ animationDelay: delay }}
    />
  );
}
