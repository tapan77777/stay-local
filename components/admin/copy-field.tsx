"use client";

import { useState } from "react";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={value}
          className="flex-1 rounded-lg border border-border bg-cream-warm px-3 py-2 font-mono text-xs text-charcoal"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-border bg-white px-3 py-2 text-xs text-charcoal hover:bg-charcoal/[0.03]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
