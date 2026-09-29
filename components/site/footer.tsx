import Link from "next/link";
import { BrandMark } from "@/components/site/brand-mark";
import { Container } from "@/components/site/container";
import { ConsultCta } from "@/components/site/consult-cta";
import { footerLinks, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream-warm text-charcoal">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
              {site.description}
            </p>
            <div className="mt-6">
              <ConsultCta size="md" />
            </div>
          </div>

          <FooterCol title="Services" items={footerLinks.services} />
          <FooterCol title="Explore" items={footerLinks.explore} />
          <FooterCol title="Coming soon" items={footerLinks.soon} muted />
        </div>

        <div className="mt-14 dotted-rule" />

        <div className="mt-8 flex flex-col-reverse items-start justify-between gap-4 text-xs text-muted sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {site.name}. Personally planned by {site.founder.name}.
          </p>
          <p className="flex items-center gap-3">
            <span>No confusion.</span>
            <span aria-hidden>·</span>
            <span>No hidden costs.</span>
            <span aria-hidden>·</span>
            <span>No time wasted.</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  title,
  items,
  muted,
}: {
  title: string;
  items: ReadonlyArray<{ label: string; href: string }>;
  muted?: boolean;
}) {
  return (
    <div>
      <h3 className="eyebrow">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href as never}
              className={
                muted
                  ? "text-sm text-muted hover:text-charcoal"
                  : "text-sm text-charcoal/85 hover:text-brand-green"
              }
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
