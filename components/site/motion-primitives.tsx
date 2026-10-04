"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * CinematicReveal — editorial scale + translateY entrance that fires once as
 * the element crosses the viewport. Honors prefers-reduced-motion by rendering
 * the child statically with no transform or opacity transition.
 */
export function CinematicReveal({
  children,
  y = 36,
  scale = 0.985,
  delay = 0,
  duration = 0.85,
  margin = "0px 0px -12% 0px",
  className,
}: {
  children: ReactNode;
  y?: number;
  scale?: number;
  delay?: number;
  duration?: number;
  margin?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ParallaxFill — wraps an image (or any absolutely positioned fill child) and
 * applies a continuous scroll-driven scale + y translation so the image feels
 * like it has depth as the viewport passes over it. The outer element is a
 * static container, the inner motion.div is the parallax layer. Caller is
 * expected to pass a child that fills (e.g. a next/image with `fill`).
 *
 * Reduced-motion: no transforms applied; child renders statically.
 */
export function ParallaxFill({
  children,
  distance = 40,
  scaleFrom = 1.08,
  scaleTo = 1,
  className,
  innerClassName,
}: {
  children: ReactNode;
  distance?: number;
  scaleFrom?: number;
  scaleTo?: number;
  className?: string;
  innerClassName?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.3,
  });
  const y = useTransform(smooth, [0, 1], [-distance, distance]);
  const scale = useTransform(smooth, [0, 0.5, 1], [scaleFrom, scaleFrom * 0.5 + scaleTo * 0.5, scaleTo]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        <div className={innerClassName}>{children}</div>
      </div>
    );
  }
  return (
    <div ref={ref} className={className}>
      <motion.div
        className={innerClassName}
        style={{ y, scale }}
      >
        {children}
      </motion.div>
    </div>
  );
}

type ScrollEdge = `${"start" | "end" | "center" | `${number}%`} ${
  | "start"
  | "end"
  | "center"
  | `${number}%`}`;

/**
 * Hook: smooth scroll progress through a target ref, bounded 0..1 across the
 * element's intersection range. Returns a spring-smoothed value so timelines
 * and depth transforms feel settled, not jittery.
 */
export function useSectionProgress(
  ref: React.RefObject<HTMLElement | null>,
  offset: [ScrollEdge, ScrollEdge] = ["start 85%", "end 25%"],
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref as unknown as React.RefObject<HTMLElement>,
    offset,
  });
  return useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.3,
  });
}
