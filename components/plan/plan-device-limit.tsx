import Link from "next/link";
import { MessageCircle, Shield } from "lucide-react";
import { whatsappHref } from "@/lib/plan/format";

/*
 * Customer-facing state shown when a Plan refuses to admit a new device
 * because the registered-device cap is already filled. Deliberately styled
 * like a product state — not an error — so the traveler knows they haven't
 * done something wrong; the plan has simply been pinned to the devices they
 * already use.
 *
 * Shows only non-sensitive numbers (used / allowed). Device identifiers,
 * tokens, IP addresses are never surfaced here. If the plan has a WhatsApp
 * contact we offer that as the clear next step — otherwise a quiet copy
 * fallback.
 */
export function PlanDeviceLimit({
  planTitle,
  activeCount,
  maxDevices,
  whatsappContact,
}: {
  planTitle: string;
  activeCount: number;
  maxDevices: number;
  whatsappContact: string | null | undefined;
}) {
  const wa = whatsappHref(
    whatsappContact,
    `Hi Tapan — I need to open "${planTitle}" on another device.`
  );
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-warm px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark">
            <Shield size={18} strokeWidth={1.8} />
          </span>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
            Access limit reached
          </p>
        </div>

        <h1 className="mt-5 font-serif text-[26px] leading-[1.1] tracking-tight text-charcoal sm:text-[30px]">
          This plan is already open on the maximum number of devices.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-charcoal-soft">
          For your security, this private travel plan can only be active on a
          limited number of devices at the same time.
        </p>

        <dl className="mt-6 overflow-hidden rounded-xl border border-border bg-cream-warm/60 text-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <dt className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-muted">
              Allowed devices
            </dt>
            <dd className="font-serif text-base text-charcoal">
              {maxDevices}
            </dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-muted">
              Devices in use
            </dt>
            <dd className="font-serif text-base text-charcoal">
              {activeCount} / {maxDevices}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-[13.5px] leading-relaxed text-charcoal-soft">
          If you need to open this plan on another device, message Tapan and
          he can free up a slot in a few seconds.
        </p>

        {wa ? (
          <Link
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
          >
            <MessageCircle size={14} />
            Message Tapan on WhatsApp
          </Link>
        ) : (
          <p className="mt-5 text-[12.5px] font-medium text-muted">
            Please contact StayLocal to continue.
          </p>
        )}
      </div>
    </div>
  );
}
