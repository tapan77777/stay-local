import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ExperiencesEditor } from "@/components/admin/plan-builder/experiences-editor";
import { FoodEditor } from "@/components/admin/plan-builder/food-editor";
import { ItineraryEditor } from "@/components/admin/plan-builder/itinerary-editor";
import { MapEditor } from "@/components/admin/plan-builder/map-editor";
import { ModuleShell } from "@/components/admin/plan-builder/module-shell";
import { NotesEditor } from "@/components/admin/plan-builder/notes-editor";
import { PlacesEditor } from "@/components/admin/plan-builder/places-editor";
import { StaysEditor } from "@/components/admin/plan-builder/stays-editor";
import { TransportEditor } from "@/components/admin/plan-builder/transport-editor";
import { requireAdmin } from "@/lib/plan/auth";
import {
  getDestination,
  getDestinationModuleCounts,
} from "@/lib/plan/destinations";
import { listExperiences } from "@/lib/plan/experiences";
import { listFoods } from "@/lib/plan/foods";
import { listItineraryDays } from "@/lib/plan/itinerary";
import { listMapPins } from "@/lib/plan/map-pins";
import { listDestinationNotes } from "@/lib/plan/notes";
import { listPlaces } from "@/lib/plan/places";
import { listStays } from "@/lib/plan/stays";
import { listTransports } from "@/lib/plan/transports";
import {
  MODULE_KEYS,
  MODULE_LABEL,
  type ModuleKey,
} from "@/lib/plan/types";

const MODULE_SET: ReadonlySet<string> = new Set(MODULE_KEYS);
function isModuleKey(x: string): x is ModuleKey {
  return MODULE_SET.has(x);
}

export default async function DestinationModulePage({
  params,
}: {
  params: Promise<{ id: string; destId: string; module: string }>;
}) {
  await requireAdmin();
  const { id, destId, module } = await params;
  if (!isModuleKey(module)) notFound();

  const [destination, counts] = await Promise.all([
    getDestination(destId),
    getDestinationModuleCounts(destId),
  ]);
  if (!destination || destination.planId !== id) notFound();

  // Only load the collection needed for this module — avoids unused queries.
  let body: React.ReactNode;
  switch (module) {
    case "itinerary": {
      const days = await listItineraryDays(destId);
      body = (
        <ItineraryEditor planId={id} destinationId={destId} days={days} />
      );
      break;
    }
    case "places": {
      const places = await listPlaces(destId);
      body = (
        <PlacesEditor planId={id} destinationId={destId} places={places} />
      );
      break;
    }
    case "transport": {
      const items = await listTransports(destId);
      body = (
        <TransportEditor planId={id} destinationId={destId} items={items} />
      );
      break;
    }
    case "stays": {
      const items = await listStays(destId);
      body = (
        <StaysEditor planId={id} destinationId={destId} items={items} />
      );
      break;
    }
    case "food": {
      const items = await listFoods(destId);
      body = <FoodEditor planId={id} destinationId={destId} items={items} />;
      break;
    }
    case "experiences": {
      const items = await listExperiences(destId);
      body = (
        <ExperiencesEditor
          planId={id}
          destinationId={destId}
          items={items}
        />
      );
      break;
    }
    case "map": {
      const pins = await listMapPins(destId);
      body = <MapEditor planId={id} destinationId={destId} pins={pins} />;
      break;
    }
    case "notes": {
      const items = await listDestinationNotes(destId);
      body = (
        <NotesEditor planId={id} destinationId={destId} items={items} />
      );
      break;
    }
  }

  return (
    <>
      <PageHeader
        title={`${destination.name} — ${MODULE_LABEL[module]}`}
        action={
          <Link
            href={`/admin/plans/${id}/destinations/${destId}`}
            className="text-sm text-muted hover:underline"
          >
            Back to destination
          </Link>
        }
      />
      <div className="p-6">
        <ModuleShell
          planId={id}
          destinationId={destId}
          active={module}
          counts={counts}
        >
          {body}
        </ModuleShell>
      </div>
    </>
  );
}
