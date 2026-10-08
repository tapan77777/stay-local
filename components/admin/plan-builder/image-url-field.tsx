"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/*
 * Text input for an optional image URL with a live thumbnail preview.
 *
 * No upload machinery — the admin pastes a URL from Unsplash / Cloudinary /
 * etc. (the same hosts already allow-listed in next.config.ts). We keep this
 * client-only so the preview updates as you type; the server action still
 * reads the final value out of FormData by name.
 */

interface ImageUrlFieldProps {
  name: string;
  label: string;
  helpText?: string;
  defaultValue?: string;
  placeholder?: string;
}

export function ImageUrlField({
  name,
  label,
  helpText,
  defaultValue = "",
  placeholder = "https://…",
}: ImageUrlFieldProps) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);
  const trimmed = value.trim();
  // Only treat http(s) URLs as previewable; a half-typed value shouldn't
  // trigger a broken-image icon on every keystroke.
  const isPreviewable = /^https?:\/\//i.test(trimmed);

  return (
    <div className="flex items-start gap-3">
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-charcoal/[0.04]"
        aria-hidden
      >
        {isPreviewable ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trimmed}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={(e) => {
              // Hide the broken image icon; keep the slot neutral.
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            No image
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        <Input
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          placeholder={placeholder}
        />
        {helpText ? (
          <p className="text-[11px] leading-snug text-muted">{helpText}</p>
        ) : null}
      </div>
    </div>
  );
}
