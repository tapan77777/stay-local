"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  pending: boolean;
  error?: string | null;
}

/**
 * Admin-form save indicator: "Saving…" while pending, error message on
 * failure, and a brief "Saved" pulse right after a successful save.
 */
export function SaveState({ pending, error }: Props) {
  const prevPendingRef = useRef(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    // When pending flips from true → false with no error, flash "Saved".
    // Deferred via setTimeout so the setState is queued, not synchronous.
    const wasPending = prevPendingRef.current;
    prevPendingRef.current = pending;
    if (!wasPending || pending || error) return;
    const show = setTimeout(() => setJustSaved(true), 0);
    const hide = setTimeout(() => setJustSaved(false), 2000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [pending, error]);

  if (pending) {
    return (
      <span className="text-xs text-muted" aria-live="polite">
        Saving…
      </span>
    );
  }
  if (error) {
    return (
      <span className="text-xs text-terracotta" aria-live="polite">
        {error}
      </span>
    );
  }
  if (justSaved) {
    return (
      <span className="text-xs text-brand-green-dark" aria-live="polite">
        Saved
      </span>
    );
  }
  return null;
}
