export function PlanWelcome({
  name,
  title,
  subtitle,
}: {
  name: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
        <div className="text-xs uppercase tracking-wider text-brand-green-dark">
          Welcome, {name}
        </div>
        <h1 className="mt-3 font-serif text-3xl text-charcoal">
          {title || "Your India Plan"}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        ) : null}
        <div className="mt-8 rounded-xl border border-dashed border-border bg-cream-warm px-5 py-6 text-sm text-charcoal-soft">
          Your personalized itinerary, destinations, and travel notes will land
          here soon. Tapan will let you know as sections are ready.
        </div>
      </div>
    </div>
  );
}
