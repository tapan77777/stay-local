"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Route,
  Map as MapIcon,
  BookOpen,
  MoreHorizontal,
  MessageCircle,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { whatsappHref, firstName } from "@/lib/plan/format";

/*
 * The authenticated traveler shell. Lives OUTSIDE page.tsx so each page can
 * compose it with its own content and the server page remains the auth entry
 * point. Renders:
 *
 *   - a persistent, discreet top header with trip title + traveler name
 *   - a sidebar on lg+ breakpoints (editorial, muted)
 *   - a floating bottom tab bar on mobile (<lg)
 *   - a content region that reserves space for whichever nav is visible
 *
 * The shell is purely presentational; it does no data loading. Pages pass
 * the plan title / traveler name / whatsapp href as props so the shell
 * stays reusable (and client-renderable) without touching the DB.
 */

export interface PlanShellProps {
  token: string;
  tripTitle: string;
  travelerDisplayName: string;
  whatsappContact?: string | null;
  children: ReactNode;
}

interface NavItem {
  key: string;
  label: string;
  href: (token: string) => string;
  icon: typeof Home;
  // Match on either exact pathname or prefix (so a destination page keeps
  // Journey active rather than falling out of the nav entirely).
  matcher: (pathname: string, token: string) => boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    key: "home",
    label: "Home",
    href: (t) => `/plan/${t}`,
    icon: Home,
    matcher: (p, t) => p === `/plan/${t}` || p === `/plan/${t}/`,
  },
  {
    key: "journey",
    label: "Journey",
    href: (t) => `/plan/${t}/journey`,
    icon: Route,
    matcher: (p, t) =>
      p.startsWith(`/plan/${t}/journey`) ||
      p.startsWith(`/plan/${t}/destinations`),
  },
  {
    key: "map",
    label: "Map",
    href: (t) => `/plan/${t}/map`,
    icon: MapIcon,
    matcher: (p, t) => p.startsWith(`/plan/${t}/map`),
  },
  {
    key: "guide",
    label: "Guide",
    href: (t) => `/plan/${t}/guide`,
    icon: BookOpen,
    matcher: (p, t) => p.startsWith(`/plan/${t}/guide`),
  },
  {
    key: "more",
    label: "More",
    href: (t) => `/plan/${t}/more`,
    icon: MoreHorizontal,
    matcher: (p, t) => p.startsWith(`/plan/${t}/more`),
  },
] as const;

export function PlanShell({
  token,
  tripTitle,
  travelerDisplayName,
  whatsappContact,
  children,
}: PlanShellProps) {
  const pathname = usePathname() ?? `/plan/${token}`;
  const wa = useMemo(
    () =>
      whatsappHref(
        whatsappContact ?? "",
        `Hi Tapan — question about my trip (${tripTitle})`
      ),
    [whatsappContact, tripTitle]
  );
  const name = firstName(travelerDisplayName);

  return (
    <div className="relative min-h-screen bg-cream-warm text-charcoal">
      {/* Top header — low-weight editorial strip. Sticks on scroll so the
          trip title stays visible while a long destination page scrolls. */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-cream-warm/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-6 lg:px-10 lg:py-4">
          <Link
            href={`/plan/${token}`}
            className="group flex min-w-0 items-center gap-3"
            aria-label="Trip home"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand-green/25 bg-white text-brand-green-dark shadow-[0_1px_2px_rgba(20,30,25,0.04)] lg:h-10 lg:w-10">
              <span className="font-serif text-[13px] leading-none lg:text-sm">
                SL
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-brand-green-dark">
                {name ? `${name}'s journey` : "Your journey"}
              </span>
              <span className="block line-clamp-1 font-serif text-[15px] leading-tight text-charcoal lg:text-base">
                {tripTitle || "Your India plan"}
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center">
            {wa ? (
              <Link
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/40 bg-white px-3 py-1.5 text-[12px] font-medium text-brand-green-dark transition-colors hover:border-brand-green hover:bg-brand-green-light sm:gap-2 sm:px-4 sm:py-2 sm:text-[13px]"
              >
                <MessageCircle size={14} className="shrink-0" />
                <span className="hidden sm:inline">Message Tapan</span>
                <span className="sm:hidden">Tapan</span>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Content region. Grid on lg+ (sidebar + main), single column on mobile
          with bottom padding equal to the fixed tab bar height. */}
      <div className="mx-auto max-w-6xl px-0 sm:px-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:px-10 lg:pt-6">
        <PlanSidebar token={token} pathname={pathname} />
        <main className="pb-28 lg:pb-16">{children}</main>
      </div>

      {/* Mobile bottom nav — single element, 5 slots. Rendered outside the
          main grid so it floats above content and respects iOS safe area. */}
      <PlanBottomNav token={token} pathname={pathname} />
    </div>
  );
}

function PlanSidebar({ token, pathname }: { token: string; pathname: string }) {
  return (
    <aside className="hidden lg:sticky lg:top-[70px] lg:col-start-1 lg:row-start-1 lg:block lg:self-start lg:py-2">
      <nav aria-label="Plan navigation">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.matcher(pathname, token);
            return (
              <li key={item.key}>
                <Link
                  href={item.href(token)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
                    active
                      ? "bg-white text-charcoal shadow-[0_1px_2px_rgba(20,30,25,0.04)]"
                      : "text-charcoal-soft hover:bg-white/60 hover:text-charcoal"
                  )}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.75}
                    className={cn(
                      "transition-colors",
                      active ? "text-brand-green-dark" : "text-muted"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function PlanBottomNav({
  token,
  pathname,
}: {
  token: string;
  pathname: string;
}) {
  return (
    <nav
      aria-label="Plan navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-cream-warm/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1.5 backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.matcher(pathname, token);
          return (
            <li key={item.key} className="flex">
              <Link
                href={item.href(token)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
                  active
                    ? "text-brand-green-dark"
                    : "text-muted hover:text-charcoal"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.6}
                  aria-hidden
                  className="transition-transform motion-reduce:transition-none"
                />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
