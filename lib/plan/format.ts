const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// UTC-locked formatters so YYYY-MM-DD date columns render the same stop
// regardless of the server's local timezone. Mixing TZs would otherwise shift
// a 12 Oct arrival into 11 Oct when the server runs west of UTC.
const UTC_MONTH_SHORT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const UTC_DAY = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FMT.format(d);
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return "—";
  if (start && !end) return `${formatDate(start)} →`;
  if (!start && end) return `→ ${formatDate(end)}`;
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  // Accept either a yyyy-mm-dd string or a full ISO; truncate at T.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Editorial trip-level range used on the Trip Home hero.
 * Collapses to one year when start and end share it: "12 Oct — 27 Oct 2026".
 */
export function formatTripRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return "";
  if (start && !end) return `From ${formatDate(start)}`;
  if (!start && end) return `Until ${formatDate(end)}`;
  const s = new Date(start!);
  const e = new Date(end!);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()))
    return formatDateRange(start, end);
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  if (sameYear) {
    return `${UTC_DAY.format(s)} ${UTC_MONTH_SHORT.format(s)} — ${UTC_DAY.format(
      e
    )} ${UTC_MONTH_SHORT.format(e)} ${e.getUTCFullYear()}`;
  }
  return `${formatDate(start)} — ${formatDate(end)}`;
}

/**
 * Compact per-destination range for list rows: "12–15 Oct".
 * Falls back to full ISO formatting across months or when parsing fails.
 */
export function formatDestinationRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return "";
  if (start && !end) return formatDate(start);
  if (!start && end) return formatDate(end);
  const s = new Date(start!);
  const e = new Date(end!);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()))
    return formatDateRange(start, end);
  const sameMonth =
    s.getUTCMonth() === e.getUTCMonth() &&
    s.getUTCFullYear() === e.getUTCFullYear();
  if (sameMonth) {
    return `${UTC_DAY.format(s)}–${UTC_DAY.format(e)} ${UTC_MONTH_SHORT.format(s)}`;
  }
  return `${UTC_DAY.format(s)} ${UTC_MONTH_SHORT.format(s)} – ${UTC_DAY.format(
    e
  )} ${UTC_MONTH_SHORT.format(e)}`;
}

export function pluralizeNights(n: number | null | undefined): string {
  if (n == null) return "";
  return `${n} night${n === 1 ? "" : "s"}`;
}

export function tripLengthDays(
  start: string | null | undefined,
  end: string | null | undefined,
  explicit: number | null | undefined
): number | null {
  if (explicit != null) return explicit;
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const ms = e.getTime() - s.getTime();
  const days = Math.round(ms / 86_400_000) + 1;
  return days > 0 ? days : null;
}

/**
 * Build a wa.me link from an arbitrary WhatsApp field (phone or wa.me URL).
 * Strips everything but digits for the base number; returns null when the
 * input has no digits at all so callers can hide the CTA cleanly.
 */
export function whatsappHref(
  contact: string | null | undefined,
  prefilledMessage?: string
): string | null {
  if (!contact) return null;
  const digits = contact.replace(/\D/g, "");
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return prefilledMessage
    ? `${base}?text=${encodeURIComponent(prefilledMessage)}`
    : base;
}

export function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const trimmed = fullName.trim();
  const sp = trimmed.indexOf(" ");
  return sp === -1 ? trimmed : trimmed.slice(0, sp);
}
