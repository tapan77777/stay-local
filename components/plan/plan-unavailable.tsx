export function PlanUnavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
        <div className="font-serif text-xl text-charcoal">
          Your StayLocal plan isn’t available right now.
        </div>
        <p className="mt-3 text-sm text-muted">
          If you believe this is a mistake, please message your StayLocal
          advisor and they’ll sort it out.
        </p>
      </div>
    </div>
  );
}
