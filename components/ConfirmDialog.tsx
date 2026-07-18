"use client";

import Modal from "./Modal";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm leading-6 text-[var(--foreground-muted)]">
        {message}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="btn-press rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-black/[.03]"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="btn-press btn-hover-lift rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
