"use client";

import { useTransition } from "react";

interface Props {
  onDelete: () => Promise<void>;
  confirmText?: string;
  label?: string;
}

export function DeleteButton({
  onDelete,
  confirmText = "Delete this item?",
  label = "Delete",
}: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          await onDelete();
        });
      }}
      className="rounded-md px-2 py-1 text-xs text-terracotta hover:bg-terracotta/10 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}
