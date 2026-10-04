import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PlanStatusBadge } from "@/components/admin/plan-status-badge";
import { requireAdmin } from "@/lib/plan/auth";
import { listDestinations } from "@/lib/plan/destinations";
import { listPlanDocuments } from "@/lib/plan/documents";
import { listExperiences } from "@/lib/plan/experiences";
import { listFoods } from "@/lib/plan/foods";
import { formatDate, formatDateRange } from "@/lib/plan/format";
import { listIndiaGuideItems } from "@/lib/plan/india-guide";
import { listItineraryDays } from "@/lib/plan/itinerary";
import { listMapPins } from "@/lib/plan/map-pins";
import { listDestinationNotes } from "@/lib/plan/notes";
import { listPlaces } from "@/lib/plan/places";
import { getPlan } from "@/lib/plan/plans";
import { listStays } from "@/lib/plan/stays";
import { listTransports } from "@/lib/plan/transports";
import {
  GUIDE_CATEGORY_LABEL,
  NOTE_TYPE_LABEL,
  PIN_CATEGORY_LABEL,
  PLACE_PRIORITY_LABEL,
  TRANSPORT_TYPE_LABEL,
  type Destination,
  type Experience,
  type Food,
  type IndiaGuideItem,
  type ItineraryDay,
  type MapPin,
  type Place,
  type PlanDocument,
  type DestinationNote,
  type Stay,
  type Transport,
} from "@/lib/plan/types";

interface DestinationBundle {
  destination: Destination;
  itinerary: ItineraryDay[];
  places: Place[];
  transports: Transport[];
  stays: Stay[];
  foods: Food[];
  experiences: Experience[];
  mapPins: MapPin[];
  notes: DestinationNote[];
}

async function loadDestinationBundle(d: Destination): Promise<DestinationBundle> {
  const [
    itinerary,
    places,
    transports,
    stays,
    foods,
    experiences,
    mapPins,
    notes,
  ] = await Promise.all([
    listItineraryDays(d.id),
    listPlaces(d.id),
    listTransports(d.id),
    listStays(d.id),
    listFoods(d.id),
    listExperiences(d.id),
    listMapPins(d.id),
    listDestinationNotes(d.id),
  ]);
  return {
    destination: d,
    itinerary,
    places,
    transports,
    stays,
    foods,
    experiences,
    mapPins,
    notes,
  };
}

export default async function PlanPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [plan, destinations, guide, documents] = await Promise.all([
    getPlan(id),
    listDestinations(id),
    listIndiaGuideItems(id),
    listPlanDocuments(id),
  ]);
  if (!plan) notFound();

  const bundles = await Promise.all(destinations.map(loadDestinationBundle));

  return (
    <>
      <PageHeader
        title={`${plan.title || "Untitled plan"} — preview`}
        description="Draft read-only view. The polished traveler trip page is Phase 3."
        action={
          <div className="flex items-center gap-3">
            <PlanStatusBadge status={plan.status} />
            <Link
              href={`/admin/plans/${plan.id}`}
              className="text-sm text-muted hover:underline"
            >
              Back to builder
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-3xl space-y-10 p-6">
        <OverviewBlock plan={plan} destinations={destinations} />

        {bundles.length === 0 ? (
          <p className="text-sm text-muted">
            No destinations added yet — add the first one in the builder.
          </p>
        ) : (
          bundles.map((b, i) => (
            <DestinationBlock key={b.destination.id} bundle={b} index={i} />
          ))
        )}

        {guide.length > 0 ? <IndiaGuideBlock items={guide} /> : null}
        {documents.length > 0 ? <DocumentsBlock items={documents} /> : null}
        <HelpBlock
          whatsapp={plan.whatsappContact}
          supportInfo={plan.supportInfo}
        />
      </div>
    </>
  );
}

function OverviewBlock({
  plan,
  destinations,
}: {
  plan: Awaited<ReturnType<typeof getPlan>> extends infer T
    ? T extends null
      ? never
      : NonNullable<T>
    : never;
  destinations: Destination[];
}) {
  const rows: [string, string][] = [];
  if (plan.travelerName) rows.push(["Traveler", plan.travelerName]);
  if (plan.tripDays != null)
    rows.push(["Length", `${plan.tripDays} day${plan.tripDays === 1 ? "" : "s"}`]);
  if (plan.startDate || plan.endDate)
    rows.push(["Dates", formatDateRange(plan.startDate, plan.endDate)]);
  if (plan.travelStyle) rows.push(["Style", plan.travelStyle]);
  if (plan.budgetStyle) rows.push(["Budget", plan.budgetStyle]);

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-serif text-xl text-charcoal">{plan.title}</h2>
      {plan.subtitle ? (
        <p className="mt-1 text-sm text-muted">{plan.subtitle}</p>
      ) : null}

      {rows.length > 0 ? (
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-border/60 py-1.5">
              <dt className="text-muted">{label}</dt>
              <dd className="text-charcoal">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {plan.specialPreferences ? (
        <div className="mt-5">
          <h3 className="text-xs uppercase tracking-wide text-muted">
            Special preferences
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
            {plan.specialPreferences}
          </p>
        </div>
      ) : null}

      {plan.importantNotes ? (
        <div className="mt-4">
          <h3 className="text-xs uppercase tracking-wide text-muted">
            Important notes
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
            {plan.importantNotes}
          </p>
        </div>
      ) : null}

      {destinations.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs uppercase tracking-wide text-muted">
            Journey
          </h3>
          <ol className="mt-2 space-y-1 text-sm text-charcoal">
            {destinations.map((d, i) => (
              <li key={d.id}>
                {i + 1}. {d.name}
                {d.nights != null ? (
                  <span className="text-muted">
                    {" "}
                    · {d.nights} night{d.nights === 1 ? "" : "s"}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h3 className="text-xs uppercase tracking-wide text-muted">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function DestinationBlock({
  bundle,
  index,
}: {
  bundle: DestinationBundle;
  index: number;
}) {
  const d = bundle.destination;
  const dateRange =
    d.arrivalDate || d.departureDate
      ? formatDateRange(d.arrivalDate, d.departureDate)
      : null;

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <header>
        <p className="text-xs text-muted">Stop {index + 1}</p>
        <h2 className="font-serif text-xl text-charcoal">{d.name}</h2>
        <p className="mt-0.5 text-xs text-muted">
          {d.nights != null
            ? `${d.nights} night${d.nights === 1 ? "" : "s"}`
            : ""}
          {d.nights != null && dateRange ? " · " : ""}
          {dateRange ?? ""}
        </p>
      </header>

      {d.intro ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-charcoal">
          {d.intro}
        </p>
      ) : null}
      {d.tapanIntro ? (
        <p className="mt-2 whitespace-pre-wrap text-sm italic text-brand-green-dark">
          Tapan: {d.tapanIntro}
        </p>
      ) : null}

      {bundle.itinerary.length > 0 ? (
        <Section title="Itinerary">
          <ol className="space-y-2 text-sm">
            {bundle.itinerary.map((day, i) => (
              <li key={day.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 text-charcoal">
                  <span className="font-serif">
                    {day.dayLabel || `Day ${i + 1}`}
                  </span>
                  {day.dayDate ? (
                    <span className="text-xs text-muted">
                      · {formatDate(day.dayDate)}
                    </span>
                  ) : null}
                </div>
                {day.morning ? (
                  <p className="mt-1 text-sm text-charcoal">
                    <span className="text-muted">Morning:</span> {day.morning}
                  </p>
                ) : null}
                {day.afternoon ? (
                  <p className="text-sm text-charcoal">
                    <span className="text-muted">Afternoon:</span>{" "}
                    {day.afternoon}
                  </p>
                ) : null}
                {day.evening ? (
                  <p className="text-sm text-charcoal">
                    <span className="text-muted">Evening:</span> {day.evening}
                  </p>
                ) : null}
                {day.notes ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted">
                    {day.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {bundle.places.length > 0 ? (
        <Section title="Places">
          <ul className="space-y-2 text-sm">
            {bundle.places.map((p) => (
              <li key={p.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-charcoal">{p.name}</span>
                  <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-[11px] text-brand-green-dark">
                    {PLACE_PRIORITY_LABEL[p.priority]}
                  </span>
                </div>
                {p.description ? (
                  <p className="mt-1 text-sm text-charcoal">{p.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {bundle.transports.length > 0 ? (
        <Section title="Transport">
          <ul className="space-y-2 text-sm">
            {bundle.transports.map((t) => (
              <li key={t.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-saffron/20 px-2 py-0.5 text-[11px] text-charcoal">
                    {TRANSPORT_TYPE_LABEL[t.transportType]}
                  </span>
                  <span className="text-charcoal">
                    {t.fromLocation || "—"} → {t.toLocation || "—"}
                  </span>
                  {t.duration ? (
                    <span className="text-xs text-muted">· {t.duration}</span>
                  ) : null}
                </div>
                {t.instructions ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs text-charcoal">
                    {t.instructions}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {bundle.stays.length > 0 ? (
        <Section title="Stays">
          <ul className="space-y-2 text-sm">
            {bundle.stays.map((s) => (
              <li key={s.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-charcoal">{s.name}</span>
                  {s.area ? (
                    <span className="text-xs text-muted">· {s.area}</span>
                  ) : null}
                </div>
                {s.whyRecommended ? (
                  <p className="mt-1 text-sm text-charcoal">
                    {s.whyRecommended}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {bundle.foods.length > 0 ? (
        <Section title="Food">
          <ul className="space-y-2 text-sm">
            {bundle.foods.map((f) => (
              <li key={f.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-charcoal">{f.name}</span>
                  {f.category ? (
                    <span className="text-xs text-muted">· {f.category}</span>
                  ) : null}
                </div>
                {f.whatToTry ? (
                  <p className="mt-1 text-sm text-charcoal">
                    Try: {f.whatToTry}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {bundle.experiences.length > 0 ? (
        <Section title="Experiences">
          <ul className="space-y-2 text-sm">
            {bundle.experiences.map((e) => (
              <li key={e.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-charcoal">{e.name}</span>
                  {e.duration ? (
                    <span className="text-xs text-muted">· {e.duration}</span>
                  ) : null}
                </div>
                {e.description ? (
                  <p className="mt-1 text-sm text-charcoal">{e.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {bundle.mapPins.length > 0 ? (
        <Section title="Map">
          <ul className="space-y-1 text-sm">
            {bundle.mapPins.map((p) => (
              <li key={p.id} className="text-charcoal">
                <span className="text-muted">
                  {PIN_CATEGORY_LABEL[p.category]}:
                </span>{" "}
                {p.name}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {bundle.notes.length > 0 ? (
        <Section title="Tapan's Notes">
          <ul className="space-y-2 text-sm">
            {bundle.notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-[11px] text-brand-green-dark">
                    {NOTE_TYPE_LABEL[n.noteType]}
                  </span>
                  <span className="font-serif text-charcoal">{n.title}</span>
                </div>
                {n.note ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
                    {n.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </section>
  );
}

function IndiaGuideBlock({ items }: { items: IndiaGuideItem[] }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-serif text-xl text-charcoal">India Guide</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((it) => (
          <li key={it.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-saffron/15 px-2 py-0.5 text-[11px] text-charcoal">
                {GUIDE_CATEGORY_LABEL[it.category]}
              </span>
              <span className="font-serif text-charcoal">{it.title}</span>
            </div>
            {it.content ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
                {it.content}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DocumentsBlock({ items }: { items: PlanDocument[] }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-serif text-xl text-charcoal">Documents</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((d) => (
          <li key={d.id}>
            <span className="font-serif text-charcoal">{d.title}</span>
            {d.description ? (
              <span className="text-muted"> — {d.description}</span>
            ) : null}
            {d.fileUrl ? (
              <>
                {" "}
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-green hover:underline"
                >
                  Open ↗
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function HelpBlock({
  whatsapp,
  supportInfo,
}: {
  whatsapp: string;
  supportInfo: string;
}) {
  if (!whatsapp && !supportInfo) return null;
  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-serif text-xl text-charcoal">Help</h2>
      {whatsapp ? (
        <p className="mt-2 text-sm text-charcoal">WhatsApp: {whatsapp}</p>
      ) : null}
      {supportInfo ? (
        <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
          {supportInfo}
        </p>
      ) : null}
    </section>
  );
}
