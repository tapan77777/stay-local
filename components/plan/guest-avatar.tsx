"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Guest profile photo rendered inside an existing circular container.
 * When `photoUrl` is empty, or the image fails to load, `fallback` is
 * shown instead so the caller keeps full control of the placeholder look
 * (e.g. the hero shows a monogram initial; the shell header shows the
 * "SL" brand monogram).
 *
 * The failed-state is local component state. Pass `key={photoUrl}` from
 * the caller so a URL change remounts and resets the broken-image flag
 * without an effect.
 */
export function GuestAvatar({
  photoUrl,
  guestFullName,
  fallback,
  className,
  imgSizes,
}: {
  photoUrl: string | null | undefined;
  guestFullName: string;
  fallback: ReactNode;
  className?: string;
  imgSizes?: string;
}) {
  const trimmed = photoUrl?.trim() ?? "";
  const [failed, setFailed] = useState(false);
  const showPhoto = trimmed.length > 0 && !failed;
  const altText = guestFullName
    ? `${guestFullName} profile photo`
    : "Guest profile photo";

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full",
        className
      )}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmed}
          alt={altText}
          loading="lazy"
          decoding="async"
          sizes={imgSizes}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        fallback
      )}
    </span>
  );
}
