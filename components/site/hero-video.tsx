"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

type Props = {
  videoSrc?: string;
  videoSrcMobile?: string;
  posterSrc?: string;
  fallback: { src: string; alt: string };
  focalMobile?: string;
  focalDesktop?: string;
  muted: boolean;
  onMutedChange: (m: boolean) => void;
};

const MOBILE_MQ = "(max-width: 767px)";

// Subscribe to viewport size via matchMedia. useSyncExternalStore keeps the
// derived value SSR-safe (server snapshot = false / desktop) and avoids the
// setState-in-effect anti-pattern.
const subscribeMq = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getMqSnapshot = () => window.matchMedia(MOBILE_MQ).matches;
const getMqServerSnapshot = () => false;

export function HeroVideo({
  videoSrc = "/videos/staylocal-hero.mp4",
  videoSrcMobile = "/videos/staylocal-hero-mobile.mp4",
  posterSrc = "/images/hero-poster.jpg",
  fallback,
  focalMobile = "50% 50%",
  focalDesktop = "50% 50%",
  muted,
  onMutedChange,
}: Props) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isMobile = useSyncExternalStore(
    subscribeMq,
    getMqSnapshot,
    getMqServerSnapshot,
  );
  const [mobileFailed, setMobileFailed] = useState(false);

  // Derived, not stored: swap sources when the viewport changes or the mobile
  // source fails to load.
  const activeSrc =
    isMobile && videoSrcMobile && !mobileFailed ? videoSrcMobile : videoSrc;

  // Sync muted attribute + resume playback when caller toggles sound on.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.muted !== muted) el.muted = muted;
    if (!muted && el.paused) {
      el.play().catch(() => {
        el.muted = true;
        onMutedChange(true);
      });
    }
  }, [muted, onMutedChange]);

  // On mount and on src swap: force load, attempt play with current muted
  // preference, fall back to muted if the browser blocks sound-on autoplay.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || reduced) return;

    el.load();

    let cancelled = false;
    const tryPlay = async () => {
      try {
        await el.play();
      } catch {
        if (cancelled || el.muted) return;
        el.muted = true;
        onMutedChange(true);
        try {
          await el.play();
        } catch {
          /* browser blocked autoplay entirely — poster + fallback still show */
        }
      }
    };
    tryPlay();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, activeSrc]);

  const handleError = () => {
    // Mobile source failed to load (typically missing file). Drop back to the
    // desktop source and remember so we don't retry mobile.
    if (activeSrc === videoSrcMobile && !mobileFailed) {
      setMobileFailed(true);
    }
  };

  const focalStyle = {
    "--focal-mobile": focalMobile,
    "--focal-desktop": focalDesktop,
  } as CSSProperties;

  const mediaClass =
    "object-cover [object-position:var(--focal-mobile)] lg:[object-position:var(--focal-desktop)]";

  return (
    <>
      <Image
        src={fallback.src}
        alt={fallback.alt}
        fill
        priority
        sizes="100vw"
        className={mediaClass}
        style={focalStyle}
      />
      {!reduced && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full ${mediaClass}`}
          style={focalStyle}
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="auto"
          poster={posterSrc}
          onError={handleError}
        >
          <source src={activeSrc} type="video/mp4" />
        </video>
      )}
    </>
  );
}
