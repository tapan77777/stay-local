"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as maplibregl from "maplibre-gl";
import type { LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Compass,
  ExternalLink,
  X,
} from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import { cn } from "@/lib/utils";
import type {
  PlanMapDestination,
  PlanMapPin,
  PlanMapCategory,
} from "@/lib/plan/map-data";

/*
 * PlanMap — the customer-facing interactive map.
 *
 * Owns a single MapLibre instance and recreates markers whenever the visible
 * pin set changes (destination filter). Each marker is an imperatively built
 * <button> element so maplibre-gl can position it, but it carries the real
 * category color + letter so screen readers get a label and the visual is not
 * color-only.
 *
 * The map is a client-side effect — the server passes the already-filtered
 * pins + destinations list. No live DB calls happen here.
 */

export interface PlanMapProps {
  token: string;
  pins: readonly PlanMapPin[];
  destinations: readonly PlanMapDestination[];
}

interface CategoryStyle {
  label: string;
  letter: string;
  // Hex color used for the marker fill. Mirrored to a Tailwind class on the
  // legend swatch so Tailwind JIT keeps the class in the output.
  color: string;
  moduleKey: "places" | "food" | "stays" | "experiences";
}

const CATEGORY_STYLE: Record<PlanMapCategory, CategoryStyle> = {
  PLACE: {
    label: "Place",
    letter: "P",
    color: "#1D9E75",
    moduleKey: "places",
  },
  FOOD: {
    label: "Food",
    letter: "F",
    color: "#C1613A",
    moduleKey: "food",
  },
  STAY: {
    label: "Stay",
    letter: "S",
    color: "#E4A53A",
    moduleKey: "stays",
  },
  EXPERIENCE: {
    label: "Experience",
    letter: "E",
    color: "#4A6E8A",
    moduleKey: "experiences",
  },
};

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// MapLibre's internal worker URL is derived from `new URL("./maplibre-gl-worker.mjs", import.meta.url)`
// against the compiled MapLibre module's own URL. In a Next.js webpack bundle
// that resolves to a chunk path where the worker file is NOT emitted, so the
// Worker constructor 404s and we lose vector-tile decoding. We ship the worker
// file at a stable public path and point MapLibre at it explicitly. Done once
// at module load so every PlanMap mount shares the same workerUrl setting.
const PLAN_MAP_WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";
if (typeof window !== "undefined") {
  try {
    maplibregl.setWorkerUrl(PLAN_MAP_WORKER_URL);
  } catch (err) {
    console.warn("[plan-map] setWorkerUrl failed", err);
  }
}

function categorySwatchBg(c: PlanMapCategory): string {
  // Explicit map so Tailwind JIT keeps the class list. Hex color stays the
  // marker source of truth; this is just the legend swatch.
  switch (c) {
    case "PLACE":
      return "bg-brand-green";
    case "FOOD":
      return "bg-terracotta";
    case "STAY":
      return "bg-saffron";
    case "EXPERIENCE":
      return "bg-[#4A6E8A]";
  }
}

function pinBoundsOrNull(
  pins: readonly PlanMapPin[],
): LngLatBoundsLike | null {
  if (pins.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const p of pins) {
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function createPinElement(
  pin: PlanMapPin,
  isSelected: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const style = CATEGORY_STYLE[pin.category];
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute(
    "aria-label",
    `${style.label} marker: ${pin.name} in ${pin.destinationName}`,
  );
  el.title = `${pin.name} — ${style.label}`;
  // Base classes — the hex color drives the dot fill (not a Tailwind arbitrary
  // value, so category colors stay editable in one place).
  el.className = [
    "sl-map-pin",
    "grid h-7 w-7 cursor-pointer place-items-center rounded-full border-2 border-white text-[11px] font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform",
    "hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal",
    "motion-reduce:transition-none motion-reduce:hover:scale-100",
    isSelected ? "scale-110 ring-2 ring-charcoal/80" : "",
  ].join(" ");
  el.style.backgroundColor = style.color;
  el.textContent = style.letter;
  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    onClick();
  });
  return el;
}

// Lifecycle stages for the map, kept small and ordered. We flip the loading
// curtain OFF as soon as the style has loaded (canvas is rendering, markers
// are safe to position) — not when `load` fires. See the long comment on the
// mount effect for why.
type MapStage =
  | "init"
  | "style-loading"
  | "style-loaded"
  | "fully-loaded"
  | "error";

const SHOW_MAP_DEBUG =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_PLAN_MAP_DEBUG === "1";

interface MapDiagnostics {
  containerW: number;
  containerH: number;
  rectW: number;
  rectH: number;
  canvasClientW: number;
  canvasClientH: number;
  canvasW: number;
  canvasH: number;
  webgl: "webgl2" | "webgl" | "none";
  styleLoaded: boolean;
  zoom: number;
  bearing: number;
  sampledAt: string;
}

export function PlanMap({ token, pins, destinations }: PlanMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [stage, setStage] = useState<MapStage>("init");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diag, setDiag] = useState<MapDiagnostics | null>(null);
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<PlanMapPin | null>(null);
  const reduced = useReducedMotion();

  // "Ready" for the purposes of hiding the curtain and placing markers =
  // style parsed. Tiles will keep streaming in behind, which is fine.
  const ready = stage === "style-loaded" || stage === "fully-loaded";

  const visiblePins = useMemo(() => {
    if (!selectedDestId) return pins;
    return pins.filter((p) => p.destinationId === selectedDestId);
  }, [pins, selectedDestId]);

  const activeCategories = useMemo(() => {
    const s = new Set<PlanMapCategory>();
    for (const p of pins) s.add(p.category);
    return [...s];
  }, [pins]);

  // Changing the destination filter should drop any open pin detail — a pin
  // that was open in "Jaipur" shouldn't linger when the traveler jumps to
  // "Udaipur". Handled at the chip-click boundary so the effect can stay
  // focused on external-system (map) sync.
  const selectDestination = useCallback((destId: string | null) => {
    setSelectedDestId(destId);
    setSelectedPin(null);
  }, []);

  // Keep the latest pins visible to the mount effect without retriggering it —
  // the parent re-renders would otherwise destroy and recreate the whole map.
  const pinsRef = useRef(pins);
  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  // Mount the map exactly once. Pins are added in a separate effect so the
  // style load + marker lifecycle stay decoupled.
  //
  // IMPORTANT lifecycle note:
  // MapLibre's `load` event fires only after *all* necessary resources have
  // been downloaded AND the first visually complete render has happened. On
  // real mobile cellular networks a single tile that times out or 404s is
  // enough to keep `load` from ever firing — the canvas is drawn, the style
  // is parsed, markers would work, but the curtain was staying up forever.
  // So we trigger readiness on `style.load` (style spec parsed, canvas ready
  // to render) instead. Tiles continue streaming in behind the curtain-off
  // state, which is the correct behaviour; the user sees progress as they
  // land rather than a dead "Placing your pins" if one tile stalls.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setStage("style-loading");
    const initialBounds = pinBoundsOrNull(pinsRef.current);
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container,
        style: MAP_STYLE_URL,
        attributionControl: { compact: true },
        bounds: initialBounds ?? undefined,
        fitBoundsOptions: initialBounds
          ? { padding: 60, maxZoom: 12, animate: false }
          : undefined,
        center: initialBounds ? undefined : [78.9629, 20.5937], // India centroid fallback
        zoom: initialBounds ? undefined : 4,
        cooperativeGestures: false,
      });
    } catch (e) {
      // Hard failure (e.g. WebGL context creation refused). Surface it so the
      // traveler sees something actionable instead of a stuck curtain. Defer
      // the state transition past the current render tick so React doesn't
      // see a synchronous setState inside an effect body.
      console.error("[plan-map] map constructor failed", e);
      const msg =
        e instanceof Error ? e.message : "Could not start the map on this device";
      queueMicrotask(() => {
        setErrorMsg(msg);
        setStage("error");
      });
      return;
    }
    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      "top-right",
    );

    // Debug-only: snapshot container/canvas/state so a phone test can see the
    // actual sizing at the moment the style finished loading. Guarded on
    // SHOW_MAP_DEBUG so no production traveler ever triggers these reads.
    const captureDiag = (tag: string) => {
      if (!SHOW_MAP_DEBUG) return;
      try {
        const canvas = map.getCanvas();
        const rect = container.getBoundingClientRect();
        const gl2 = canvas.getContext("webgl2");
        const gl1 = gl2 ? null : canvas.getContext("webgl");
        const webgl: MapDiagnostics["webgl"] = gl2
          ? "webgl2"
          : gl1
            ? "webgl"
            : "none";
        const d: MapDiagnostics = {
          containerW: container.clientWidth,
          containerH: container.clientHeight,
          rectW: Math.round(rect.width),
          rectH: Math.round(rect.height),
          canvasClientW: canvas.clientWidth,
          canvasClientH: canvas.clientHeight,
          canvasW: canvas.width,
          canvasH: canvas.height,
          webgl,
          styleLoaded: Boolean(map.isStyleLoaded()),
          zoom: +map.getZoom().toFixed(2),
          bearing: +map.getBearing().toFixed(1),
          sampledAt: tag,
        };
        setDiag(d);
        // One structured console line per sample — easy to spot in remote
        // devtools and small enough to copy out of a mobile console.
        console.log("[plan-map] diag", tag, d);
      } catch (err) {
        console.warn("[plan-map] diag capture failed", err);
      }
    };

    // Primary readiness signal — style spec parsed, canvas painting, markers
    // can be placed. Hide the curtain here even if tiles are still arriving.
    const onStyleLoad = () => {
      setStage((s) => (s === "fully-loaded" ? s : "style-loaded"));
      try {
        map.resize();
        // Force one repaint after resize so the canvas commits at the real
        // size even if MapLibre's internal dirty flag didn't flip.
        map.triggerRepaint();
      } catch {
        /* ignore — fast nav teardown */
      }
      // Capture after the resize+repaint call so dimensions reflect the
      // post-resize state, not the stale init-time size.
      captureDiag("style.load");
    };
    // Secondary signal — kept so the dev overlay can distinguish "canvas up"
    // from "all tiles settled". Not required to show the map.
    const onLoad = () => {
      setStage("fully-loaded");
      captureDiag("load");
    };
    map.on("style.load", onStyleLoad);
    map.on("load", onLoad);

    // Errors from MapLibre arrive here. Many are non-fatal (one tile 404,
    // transient network blip) — those are logged but don't flip the stage.
    // A fatal error BEFORE style.load has fired (e.g. style URL unreachable,
    // bad JSON) switches to the error curtain so the traveler sees why.
    const onError = (e: unknown) => {
      const err = (e as { error?: Error })?.error;
      const msg = err?.message || "map error";
      console.error("[plan-map] maplibre error", e);
      setStage((s) => {
        if (s === "style-loaded" || s === "fully-loaded") return s;
        setErrorMsg(msg);
        return "error";
      });
    };
    map.on("error", onError);

    // Observe the container so address-bar collapse (iOS) and the brief 0×0
    // first frame both trigger a resize. Without this, MapLibre keeps a stale
    // size cache and never finishes initial tile loading on some mobile
    // browsers.
    let ro: ResizeObserver | null = null;
    let roSampleCount = 0;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        try {
          map.resize();
        } catch {
          // map may already be removed during fast nav; ignore.
        }
        // Re-sample on the first few resize ticks only — enough to see whether
        // the container grew from 0×0 to real pixels, without spamming logs.
        if (SHOW_MAP_DEBUG && roSampleCount < 3) {
          roSampleCount += 1;
          captureDiag(`ro#${roSampleCount}`);
        }
      });
      ro.observe(container);
    }
    // Belt-and-braces: one deferred resize on the next frame to flush the
    // initial layout before the style finishes loading.
    const raf = requestAnimationFrame(() => {
      try {
        map.resize();
      } catch {
        /* ignore */
      }
      captureDiag("raf");
    });

    mapRef.current = map;
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      map.off("style.load", onStyleLoad);
      map.off("load", onLoad);
      map.off("error", onError);
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // We intentionally mount the map once. New pins propagate through the
    // marker + bounds effects below; the pinsRef above gives this effect
    // access to the latest value for the initial fitBounds without listing
    // pins as a dependency (which would destroy and recreate the map).
  }, []);

  // Rebuild markers whenever the visible-pins set changes. MapLibre markers
  // are imperative, so we tear down and rebuild — fine at this scale.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];
    for (const p of visiblePins) {
      const el = createPinElement(p, selectedPin?.id === p.id, () =>
        setSelectedPin(p),
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [visiblePins, selectedPin, ready]);

  // Re-fit on destination filter change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const b = pinBoundsOrNull(visiblePins);
    if (!b) return;
    map.fitBounds(b, {
      padding: 80,
      maxZoom: 13,
      duration: reduced ? 0 : 650,
    });
  }, [visiblePins, ready, reduced]);

  const closeSheet = useCallback(() => setSelectedPin(null), []);

  return (
    <div className="relative -mb-28 h-[calc(100dvh-7rem)] overflow-hidden bg-cream-warm lg:-mb-16 lg:h-[calc(100vh-6rem)] lg:rounded-3xl">
      <div
        ref={containerRef}
        aria-label="Interactive trip map"
        role="application"
        /*
         * h-full w-full (NOT absolute inset-0) is intentional. MapLibre adds
         * `.maplibregl-map { position: relative }` to this element at init.
         * That rule (same CSS specificity, imported after Tailwind) overrides
         * `.absolute`, which flips the element to relative positioning. With
         * `inset-0` on a relative element the offsets become no-ops, the
         * element drops to content-driven height, and because every MapLibre
         * child is absolute the container collapses to 0px tall. Sizing with
         * 100%/100% is position-independent and fills the h-[calc(100dvh-7rem)]
         * wrapper correctly whether MapLibre keeps our `absolute` or forces
         * `relative`.
         */
        className="h-full w-full"
      />

      {/* Loading curtain — shown until the style is parsed. Error curtain
          takes over if MapLibre couldn't initialise at all. */}
      {!ready && stage !== "error" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-cream-warm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark/80">
            <Compass size={13} className="animate-pulse" aria-hidden />
            Placing your pins
          </div>
        </div>
      ) : null}
      {stage === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-cream-warm px-6">
          <div className="max-w-sm text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
              Map couldn&rsquo;t load
            </p>
            <p className="mt-3 font-serif text-[20px] leading-snug text-charcoal">
              Your pins are safe — the map just hit a snag loading on this
              device.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-charcoal-soft">
              Try a Wi-Fi connection or reopen the plan. If it keeps happening,
              WhatsApp me and I&rsquo;ll help.
            </p>
            {errorMsg ? (
              <p className="mt-4 font-mono text-[10.5px] text-charcoal-soft/70">
                {errorMsg}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Dev-only diagnostic — shows the lifecycle stage plus a dimension /
          WebGL snapshot captured at style.load, rAF, and the first few
          ResizeObserver ticks. Gated on NEXT_PUBLIC_PLAN_MAP_DEBUG so no
          traveler ever sees it; the chip is purely for on-device inspection
          when the map area looks blank. */}
      {SHOW_MAP_DEBUG ? (
        <div className="pointer-events-none absolute bottom-24 left-3 z-40 max-w-[70vw] rounded bg-charcoal/85 px-2 py-1.5 font-mono text-[10px] leading-tight text-cream lg:bottom-3">
          <div>
            map: {stage}
            {errorMsg ? ` · ${errorMsg}` : ""}
          </div>
          {diag ? (
            <>
              <div>
                cont: {diag.containerW}×{diag.containerH} (rect{" "}
                {diag.rectW}×{diag.rectH})
              </div>
              <div>
                canv: {diag.canvasClientW}×{diag.canvasClientH} (buf{" "}
                {diag.canvasW}×{diag.canvasH})
              </div>
              <div>
                webgl: {diag.webgl} · style: {diag.styleLoaded ? "y" : "n"} ·
                zoom: {diag.zoom}
              </div>
              <div>sample: {diag.sampledAt}</div>
            </>
          ) : null}
        </div>
      ) : null}

      {/* Destination chip filter — overlaid at the top so the map fills the
          viewport underneath. Horizontally scrollable on mobile. */}
      {destinations.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
          <div className="pointer-events-auto mx-auto flex max-w-6xl items-start gap-2 overflow-x-auto px-4 pt-4 pb-2 sm:px-6 lg:px-6 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]">
            <style>{`.pointer-events-auto::-webkit-scrollbar { display: none; }`}</style>
            <DestChip
              label="All"
              active={selectedDestId === null}
              onClick={() => selectDestination(null)}
            />
            {destinations.map((d) => (
              <DestChip
                key={d.id}
                label={d.name}
                active={selectedDestId === d.id}
                onClick={() => selectDestination(d.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Category legend — bottom-left on desktop, under the chips on mobile
          via a different stacked position. Shows only categories present. */}
      {activeCategories.length > 0 ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden lg:block">
          <div className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-1 rounded-full border border-border bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
            {activeCategories.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-charcoal-soft"
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white",
                    categorySwatchBg(c),
                  )}
                />
                {CATEGORY_STYLE[c].label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Pin detail sheet (mobile) / floating card (desktop). */}
      {selectedPin ? (
        <PinDetailSheet
          pin={selectedPin}
          token={token}
          onClose={closeSheet}
          reduced={!!reduced}
        />
      ) : null}
    </div>
  );
}

function DestChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-medium shadow-sm backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:px-3.5",
        active
          ? "border-charcoal bg-charcoal text-cream"
          : "border-border bg-white/90 text-charcoal hover:border-brand-green/50",
      )}
    >
      {label}
    </button>
  );
}

function PinDetailSheet({
  pin,
  token,
  onClose,
  reduced,
}: {
  pin: PlanMapPin;
  token: string;
  onClose: () => void;
  reduced: boolean;
}) {
  const style = CATEGORY_STYLE[pin.category];
  const detailHref = `/plan/${token}/destinations/${pin.destinationId}/${style.moduleKey}`;

  return (
    <>
      {/* Mobile backdrop — tap outside the sheet to dismiss. Desktop skips
          this because the sheet lives in a corner and shouldn't dim the map. */}
      <button
        type="button"
        aria-label="Close pin detail"
        onClick={onClose}
        className="absolute inset-0 z-20 cursor-default bg-charcoal/15 lg:hidden"
      />
      <div
        className={cn(
          "absolute z-30",
          // Mobile: bottom sheet. The map container sits above the shell's
          // fixed bottom nav (which lives OUTSIDE this component), so a `bottom-3`
          // sheet would collide with the nav visually; we lift it by the nav
          // height + safe area so the "View details" button clears cleanly.
          "inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))]",
          // Desktop: floating card bottom-left (above the legend)
          "lg:inset-x-auto lg:bottom-16 lg:left-4 lg:w-[360px]",
        )}
      >
        <CinematicReveal y={reduced ? 0 : 18} duration={reduced ? 0 : 0.35} margin="0px">
          <article className="relative rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(20,30,25,0.18)]">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-charcoal-soft transition-colors hover:bg-cream-warm hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 pr-9">
              <span
                aria-hidden
                className={cn(
                  "inline-block h-2.5 w-2.5 rounded-full",
                  categorySwatchBg(pin.category),
                )}
              />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
                {style.label} · {pin.destinationName}
              </span>
            </div>
            <h3 className="mt-2 font-serif text-[22px] leading-[1.12] tracking-tight text-charcoal sm:text-[24px]">
              {pin.name}
            </h3>
            {pin.description ? (
              <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-charcoal-soft">
                {pin.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href={detailHref}
                className="group inline-flex items-center gap-1.5 rounded-full bg-brand-green px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
              >
                View details
                <ArrowUpRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                />
              </Link>
              {pin.mapUrl ? (
                <Link
                  href={pin.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-green-dark transition-colors hover:text-charcoal"
                >
                  <ExternalLink size={13} />
                  Open in maps
                </Link>
              ) : null}
            </div>
          </article>
        </CinematicReveal>
      </div>
    </>
  );
}
