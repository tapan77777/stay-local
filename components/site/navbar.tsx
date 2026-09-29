"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/site/brand-mark";
import { ConsultCta } from "@/components/site/consult-cta";
import { navLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors",
        scrolled
          ? "border-border/80 bg-cream/85 backdrop-blur-md"
          : "border-transparent bg-cream/0"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-7 lg:h-[72px] lg:px-10">
        <BrandMark />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {navLinks.map((l) => {
              const active =
                pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href as never}
                    className={cn(
                      "text-sm text-charcoal/75 transition-colors hover:text-charcoal",
                      active && "text-charcoal"
                    )}
                  >
                    {l.label}
                    {active && (
                      <span className="mt-0.5 block h-px w-full bg-brand-green" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden lg:block">
          <ConsultCta size="sm" />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full border border-border text-charcoal lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-cream lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-5 sm:px-7">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href as never}
                className="flex items-center justify-between rounded-lg px-2 py-3 text-base text-charcoal hover:bg-charcoal/[0.04]"
              >
                {l.label}
                <span aria-hidden className="text-muted">→</span>
              </Link>
            ))}
            <div className="mt-3">
              <ConsultCta size="md" className="w-full" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
