"use client";

import { useTransition } from "react";

type Direction = "up" | "down";

interface Props {
  onMove: (direction: Direction) => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

export function ReorderButtons({ onMove, isFirst, isLast }: Props) {
  const [pending, startTransition] = useTransition();
  const move = (direction: Direction) => {
    startTransition(async () => {
      await onMove(direction);
    });
  };
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border bg-white">
      <button
        type="button"
        aria-label="Move up"
        onClick={() => move("up")}
        disabled={isFirst || pending}
        className="px-2 py-1 text-xs text-muted hover:bg-charcoal/[0.04] hover:text-charcoal disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Move down"
        onClick={() => move("down")}
        disabled={isLast || pending}
        className="border-l border-border px-2 py-1 text-xs text-muted hover:bg-charcoal/[0.04] hover:text-charcoal disabled:opacity-30"
      >
        ↓
      </button>
    </div>
  );
}
