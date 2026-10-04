import { notFound } from "next/navigation";
import { PlanPlaceholder } from "@/components/plan/plan-placeholder";
import { PlanShell } from "@/components/plan/plan-shell";
import { ModuleHeader } from "@/components/plan/module-header";
import {
  ModuleNavigation,
  type ModuleNavLink,
} from "@/components/plan/module-navigation";
import { ItineraryTimeline } from "@/components/plan/itinerary-timeline";
import { PlaceCard } from "@/components/plan/place-card";
import { FoodCard } from "@/components/plan/food-card";
import { StayCard } from "@/components/plan/stay-card";
import { ExperienceCard } from "@/components/plan/experience-card";
import { TransportSection } from "@/components/plan/transport-section";
import { TapanNotes } from "@/components/plan/tapan-notes";
import {
  authenticatePlan,
  loadPlanOverview,
} from "@/lib/plan/customer-view";
import { listItineraryDays } from "@/lib/plan/itinerary";
import { listPlaces } from "@/lib/plan/places";
import { listFoods } from "@/lib/plan/foods";
import { listStays } from "@/lib/plan/stays";
import { listExperiences } from "@/lib/plan/experiences";
import { listTransports } from "@/lib/plan/transports";
import { listDestinationNotes } from "@/lib/plan/notes";
import {
  MODULE_KEYS,
  MODULE_LABEL,
  type DestinationModuleCounts,
  type ModuleKey,
} from "@/lib/plan/types";

/*
 * Per-destination module page.
 *
 * The dispatcher does three things in order:
 *   1. authenticate the plan + verify the destination belongs to it
 *   2. 404 if the module is unknown, has no content, or (for `map`) is
 *      explicitly deferred to a later milestone
 *   3. fetch exactly one module's rows and render the matching editorial
 *      component with a shared ModuleHeader + ModuleNavigation chrome.
 *
 * Only one module-level DB query runs per request; the overview is already
 * memoized via React.cache on authenticatePlan / loadPlanOverview.
 */

function isModuleKey(v: string): v is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(v);
}

interface ModuleMeta {
  // Editorial title shown as the h1 on the module page. Separate from the
  // tile label used on the Destination Hub.
  title: string;
  intro?: string;
  helpTitle: (name: string) => string;
}

const MODULE_META: Record<ModuleKey, ModuleMeta> = {
  itinerary: {
    title: "Your days",
    intro: "Day by day, how I'd shape your time here.",
    helpTitle: (n) => `Shift something in ${n}?`,
  },
  places: {
    title: "Places to visit",
    intro: "Places I'd actually make time for.",
    helpTitle: (n) => `Something unclear about ${n}?`,
  },
  food: {
    title: "Where to eat",
    intro: "Places I'd send a friend.",
    helpTitle: (n) => `Looking for something specific in ${n}?`,
  },
  transport: {
    title: "Getting around",
    intro: "How to move — and what to skip.",
    helpTitle: () => `Not sure how to get there?`,
  },
  stays: {
    title: "Where to stay",
    intro: "Places I'd pick, with the reason I'd pick them.",
    helpTitle: (n) => `Want me to help you book in ${n}?`,
  },
  experiences: {
    title: "Experiences",
    intro: "Things worth clearing your calendar for.",
    helpTitle: (n) => `Want to add or swap something in ${n}?`,
  },
  map: {
    title: "Map",
    helpTitle: (n) => `Something unclear about ${n}?`,
  },
  notes: {
    title: "Tapan's notes",
    intro: "Little things worth knowing before you arrive.",
    helpTitle: (n) => `Something I missed about ${n}?`,
  },
};

// Order of modules in the prev/next navigation. Matches the Destination Hub
// tile order so the chain feels linear to a traveler clicking through.
const MODULE_ORDER: readonly ModuleKey[] = [
  "itinerary",
  "places",
  "food",
  "transport",
  "stays",
  "experiences",
  "map",
  "notes",
] as const;

function activeModulesInOrder(counts: DestinationModuleCounts): ModuleKey[] {
  return MODULE_ORDER.filter((k) => (counts[k] ?? 0) > 0);
}

function moduleNeighbor(
  active: readonly ModuleKey[],
  current: ModuleKey,
  delta: 1 | -1,
): ModuleKey | null {
  const idx = active.indexOf(current);
  if (idx === -1) return null;
  const next = active[idx + delta];
  return next ?? null;
}

export default async function DestinationModulePage({
  params,
}: {
  params: Promise<{ token: string; destId: string; module: string }>;
}) {
  const { token, destId, module: moduleParam } = await params;
  if (!isModuleKey(moduleParam)) notFound();

  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;
  const overview = await loadPlanOverview(plan.id);

  const current = overview.destinations.find((d) => d.destination.id === destId);
  if (!current) notFound();

  // Enforce the progressive-disclosure contract at the route level too — a
  // traveler should never land on an empty module page, even by typing the
  // URL directly.
  const count = current.counts[moduleParam] ?? 0;
  if (count === 0) notFound();

  const destination = current.destination;
  const active = activeModulesInOrder(current.counts);
  const prevKey = moduleNeighbor(active, moduleParam, -1);
  const nextKey = moduleNeighbor(active, moduleParam, 1);
  const destinationHref = `/plan/${token}/destinations/${destination.id}`;
  const prev: ModuleNavLink | null = prevKey
    ? {
        label: MODULE_META[prevKey].title,
        caption: "Previous",
        href: `${destinationHref}/${prevKey}`,
      }
    : null;
  const nextLink: ModuleNavLink | null = nextKey
    ? {
        label: MODULE_META[nextKey].title,
        caption: "Next",
        href: `${destinationHref}/${nextKey}`,
      }
    : null;

  const meta = MODULE_META[moduleParam];
  const shell = (content: React.ReactNode) => (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      <div className="pb-6">
        <ModuleHeader
          backHref={destinationHref}
          backLabel={`Back to ${destination.name}`}
          eyebrow={`${destination.name} · ${MODULE_LABEL[moduleParam]}`}
          title={meta.title}
          intro={meta.intro}
        />
        {content}
        <ModuleNavigation
          prev={prev}
          next={nextLink}
          destinationHref={destinationHref}
          destinationName={destination.name}
          whatsappContact={plan.whatsappContact}
          tripTitle={plan.title}
          helpTitle={meta.helpTitle(destination.name)}
        />
      </div>
    </PlanShell>
  );

  // `map` isn't shipping in this milestone. The destination hub still shows a
  // map tile if pins exist; following it lands here. Render the placeholder so
  // the traveler isn't dead-ended.
  if (moduleParam === "map") {
    return (
      <PlanShell
        token={token}
        tripTitle={plan.title}
        travelerDisplayName={plan.customer?.name || session.name}
        whatsappContact={plan.whatsappContact}
      >
        <PlanPlaceholder
          token={token}
          eyebrow={`${destination.name} · Map`}
          title="Your map is almost ready."
          description={`I'm placing the pins for ${destination.name} right now. In the meantime, each place keeps its own map link inside the module.`}
          whatsappContact={plan.whatsappContact}
          tripTitle={plan.title}
        />
      </PlanShell>
    );
  }

  switch (moduleParam) {
    case "itinerary": {
      const days = await listItineraryDays(destination.id);
      return shell(<ItineraryTimeline days={days} />);
    }
    case "places": {
      const places = await listPlaces(destination.id);
      return shell(
        <section className="mx-auto mt-10 max-w-2xl px-5 sm:px-6">
          <ul className="space-y-5">
            {places.map((p, i) => (
              <li key={p.id}>
                <PlaceCard place={p} index={i} />
              </li>
            ))}
          </ul>
        </section>,
      );
    }
    case "food": {
      const foods = await listFoods(destination.id);
      return shell(
        <section className="mx-auto mt-10 max-w-2xl px-5 sm:px-6">
          <ul className="space-y-5">
            {foods.map((f, i) => (
              <li key={f.id}>
                <FoodCard food={f} index={i} />
              </li>
            ))}
          </ul>
        </section>,
      );
    }
    case "stays": {
      const stays = await listStays(destination.id);
      return shell(
        <section className="mx-auto mt-10 max-w-2xl px-5 sm:px-6">
          <ul className="space-y-5">
            {stays.map((s, i) => (
              <li key={s.id}>
                <StayCard stay={s} index={i} />
              </li>
            ))}
          </ul>
        </section>,
      );
    }
    case "experiences": {
      const experiences = await listExperiences(destination.id);
      return shell(
        <section className="mx-auto mt-10 max-w-2xl px-5 sm:px-6">
          <ul className="space-y-5">
            {experiences.map((e, i) => (
              <li key={e.id}>
                <ExperienceCard experience={e} index={i} />
              </li>
            ))}
          </ul>
        </section>,
      );
    }
    case "transport": {
      const transports = await listTransports(destination.id);
      return shell(<TransportSection transports={transports} />);
    }
    case "notes": {
      const notes = await listDestinationNotes(destination.id);
      return shell(<TapanNotes notes={notes} />);
    }
  }
}
