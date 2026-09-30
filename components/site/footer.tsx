"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { footerLinks, primaryCta, site } from "@/lib/site";

const EASE = [0.22, 1, 0.36, 1] as const;

// Full-bleed cinematic footer. Two crops — a wide desktop image and a
// portrait-friendly mobile crop — are selected by the browser via
// <picture> / <source media>. This guarantees mobile only downloads
// the mobile asset (a display:none <Image> can still be prefetched in
// some browsers, which is exactly what the spec asked us to avoid).
const BG_SRC_DESKTOP = "/images/staylocal-footer.jpg";
const BG_SRC_MOBILE = "/images/staylocal-footer-mobile.jpg";
const MOBILE_BG_MQ = "(max-width: 767px)";

export function Footer() {
  const reduced = useReducedMotion();

  const container: Variants = reduced
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      };

  const item: Variants = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      };

  const imageV: Variants = reduced
    ? { hidden: { opacity: 1, scale: 1 }, show: { opacity: 1, scale: 1 } }
    : {
        hidden: { opacity: 0.9, scale: 1.03 },
        show: {
          opacity: 1,
          scale: 1,
          transition: { duration: 1.4, ease: EASE },
        },
      };

  const year = new Date().getFullYear();
  const socials = buildSocials();

  return (
    <motion.footer
      className="relative isolate overflow-hidden text-cream"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px 0px" }}
      variants={container}
      aria-labelledby="footer-heading"
    >
      {/* Background image — a responsive <picture> so mobile only ever
          fetches the mobile crop. next/image can't drive <source media>,
          and a display:none <Image> can still be prefetched — the spec
          explicitly asked us to avoid that. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-20"
        variants={imageV}
      >
        <picture>
          <source media={MOBILE_BG_MQ} srcSet={BG_SRC_MOBILE} />
          <img
            src={BG_SRC_DESKTOP}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      </motion.div>

      {/* Cinematic gradient overlays — a top-to-bottom darken plus a
          slight left-side lift so the brand column stays readable. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,20,16,0.25) 0%, rgba(10,20,16,0.55) 55%, rgba(10,20,16,0.82) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(10,20,16,0.45), rgba(10,20,16,0) 55%)",
        }}
      />

      <Container className="relative flex min-h-[560px] flex-col justify-between pb-10 pt-20 sm:min-h-[600px] lg:min-h-[640px] lg:pb-12 lg:pt-28">
        {/* Main grid */}
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          {/* Brand column */}
          <motion.div variants={item} className="max-w-md">
            <h2 id="footer-heading" className="sr-only">
              {site.name} — {site.tagline}
            </h2>

            <Link
              href="/"
              aria-label={`${site.name} — home`}
              className="group inline-flex items-center gap-3"
            >
              <span
                aria-hidden
                className="grid h-11 w-11 place-items-center rounded-full bg-brand-green text-white shadow-[0_10px_30px_rgba(29,158,117,0.35)] transition-transform group-hover:scale-[1.04]"
              >
                <span className="font-serif text-[18px] leading-none">S</span>
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-serif text-[22px] tracking-tight text-cream">
                  {site.name}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-green-light">
                  India, Your Way
                </span>
              </span>
            </Link>

            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-cream/80">
              A personal India travel advisor for international travelers —
              first-hand knowledge, honest recommendations, and help when you
              need it.
            </p>

            <ul className="mt-8 flex items-center gap-3" aria-label="Social">
              {socials.map(({ key, ...s }) => (
                <li key={key}>
                  <SocialIcon {...s} />
                </li>
              ))}
            </ul>

            <div className="mt-10 hidden lg:block">
              <PrimaryFooterCta />
            </div>
          </motion.div>

          {/* Explore */}
          <motion.div variants={item}>
            <FooterCol
              title="Explore"
              items={[...footerLinks.explore]}
              trailing={{
                label: "Browse all experiences",
                href: "/experiences",
              }}
            />
          </motion.div>

          {/* Services */}
          <motion.div variants={item}>
            <FooterCol
              title="Services"
              items={[...footerLinks.services]}
            />
          </motion.div>
        </div>

        {/* Mobile CTA — sits between columns and bottom line. */}
        <motion.div variants={item} className="mt-14 lg:hidden">
          <PrimaryFooterCta fullWidth />
        </motion.div>

        {/* Divider + bottom line */}
        <motion.div variants={item} className="mt-16 lg:mt-20">
          <div className="h-px w-full bg-cream/15" />
          <div className="mt-6 flex flex-col gap-3 text-[12px] text-cream/70 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {site.name}. Personally planned by {site.founder.name}.
            </p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
              <span>No confusion.</span>
              <span aria-hidden className="text-cream/40">·</span>
              <span>No hidden costs.</span>
              <span aria-hidden className="text-cream/40">·</span>
              <span>No time wasted.</span>
            </p>
          </div>
        </motion.div>
      </Container>
    </motion.footer>
  );
}

// ---------- Primary CTA ----------

function PrimaryFooterCta({ fullWidth = false }: { fullWidth?: boolean }) {
  // On very narrow viewports (~320px) the size=lg padding + text length of
  // "Talk to an India Expert — $10 →" (~321px intrinsic) overflows the
  // ~280px available inside a Container. On the mobile full-width variant
  // we shrink padding + text a notch so the pill still feels prominent
  // but fits cleanly all the way down to 320px.
  const mobileFit = fullWidth ? "w-full px-5 text-[14px] sm:px-7 sm:text-[15px] " : "";
  return (
    <Button
      asChild
      variant="primary"
      size="lg"
      className={
        mobileFit +
        "group bg-brand-green text-white shadow-[0_16px_40px_rgba(29,158,117,0.35)] hover:bg-brand-green-dark focus-visible:ring-offset-charcoal"
      }
    >
      <Link href={primaryCta.href as never} prefetch>
        {primaryCta.label}
        <ArrowRight
          size={16}
          className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </Button>
  );
}

// ---------- Column ----------

function FooterCol({
  title,
  items,
  trailing,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
  trailing?: { label: string; href: string };
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-green-light">
        {title}
      </h3>
      <ul className="mt-5 space-y-3">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href as never}
              className="text-[14px] leading-relaxed text-cream/85 transition-colors hover:text-white"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
      {trailing && (
        <Link
          href={trailing.href as never}
          className="group mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-brand-green-light transition-colors hover:text-white"
        >
          {trailing.label}
          <ArrowRight
            size={12}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

// ---------- Social icons ----------

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

type SocialSpec = {
  key: string;
  label: string;
  href: string | null;
  Icon: IconComponent;
  external?: boolean;
};

function buildSocials(): SocialSpec[] {
  return [
    {
      key: "instagram",
      label: "StayLocal on Instagram",
      href: site.social.instagram,
      Icon: InstagramIcon,
      external: true,
    },
    {
      key: "email",
      label: `Email ${site.name} at ${site.contact.email}`,
      href: `mailto:${site.contact.email}`,
      Icon: Mail,
    },
    {
      key: "linkedin",
      label: "StayLocal on LinkedIn",
      href: site.social.linkedin,
      Icon: LinkedinIcon,
      external: true,
    },
  ];
}

function InstagramIcon({ size = 16, strokeWidth = 1.75, ...props }: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon({ size = 16, strokeWidth = 1.75, ...props }: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M4 4h16v16H4z" />
      <line x1="8" y1="10" x2="8" y2="16" />
      <circle cx="8" cy="7" r="0.6" fill="currentColor" stroke="none" />
      <path d="M12 16v-4a2 2 0 0 1 4 0v4" />
    </svg>
  );
}

function SocialIcon({ label, href, Icon, external }: Omit<SocialSpec, "key">) {
  const base =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 bg-white/[0.06] text-cream backdrop-blur-[2px] transition-all hover:-translate-y-0.5 hover:border-cream/45 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal motion-reduce:hover:translate-y-0";

  // Placeholder state — kept accessible and clearly non-navigational so no
  // fake URL leaks out. Fill `site.social.<key>` to switch it live.
  if (!href) {
    return (
      <span
        aria-label={`${label} — coming soon`}
        title="Coming soon"
        role="img"
        className={base + " cursor-default opacity-55 hover:translate-y-0 hover:border-cream/25 hover:bg-white/[0.06]"}
      >
        <Icon size={16} strokeWidth={1.75} />
      </span>
    );
  }

  const isMail = href.startsWith("mailto:");
  return (
    <a
      href={href}
      aria-label={label}
      className={base}
      {...(external && !isMail
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      <Icon size={16} strokeWidth={1.75} />
    </a>
  );
}
