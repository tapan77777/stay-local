"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { guideFaqs } from "@/lib/guides";

export function GuideFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduced = useReducedMotion() ?? false;
  const baseId = useId();

  return (
    <Section tone="cream" className="border-t border-border">
      <Container size="narrow">
        <SectionEyebrow>Common questions</SectionEyebrow>
        <SectionHeading className="mt-3">
          Before you apply, the things people ask.
        </SectionHeading>

        <ul className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
          {guideFaqs.map((f, i) => {
            const isOpen = openIndex === i;
            const panelId = `${baseId}-panel-${i}`;
            const btnId = `${baseId}-btn-${i}`;
            return (
              <li
                key={f.q}
                className={
                  i === 0 ? "" : "border-t border-border"
                }
              >
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-start justify-between gap-6 px-6 py-6 text-left transition-colors hover:bg-cream-warm/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 lg:px-7 lg:py-7"
                >
                  <span className="font-serif text-lg leading-tight text-charcoal lg:text-xl">
                    {f.q}
                  </span>
                  <span
                    aria-hidden
                    className="mt-[2px] inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-cream text-charcoal-soft transition-transform duration-300"
                    style={{
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  >
                    <Plus size={14} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      key="content"
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-[15px] leading-relaxed text-charcoal-soft lg:px-7 lg:pb-7">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
