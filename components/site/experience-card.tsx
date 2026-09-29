import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Experience } from "@/lib/experiences";
import { cn } from "@/lib/utils";

export function ExperienceCard({
  experience,
  priority = false,
  className,
}: {
  experience: Experience;
  priority?: boolean;
  className?: string;
}) {
  const image = experience.image ?? experience.heroImage;
  return (
    <Link
      href={`/experiences/${experience.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[0_10px_40px_rgba(20,30,25,0.06)]",
        className
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-warm">
        {image ? (
          <Image
            src={image}
            alt={`${experience.title} — ${experience.place}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <span className="font-serif text-2xl">{experience.place}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute inset-x-5 bottom-5 text-white">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/85">
            {experience.place}
          </p>
          <h3 className="mt-1.5 font-serif text-[22px] leading-tight text-white lg:text-2xl">
            {experience.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        {experience.shortDesc && (
          <p className="text-[15px] leading-relaxed text-charcoal-soft">
            {experience.shortDesc}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {(experience.tags ?? []).slice(0, 3).map((t) => (
            <Badge key={t} variant="outline" className="text-[10px]">
              {t}
            </Badge>
          ))}
          <span className="ml-auto text-xs text-brand-green group-hover:underline">
            Read the story →
          </span>
        </div>
      </div>
    </Link>
  );
}
