/*
 * Plan route loading state.
 *
 * Streams while the server authenticates the token and loads the overview.
 * Keeps the cream-warm page color so the eventual content doesn't flash in
 * on a different background. A pulsing hero block + two muted rows read as
 * "about to arrive" without resorting to a spinner.
 */

export default function PlanLoading() {
  return (
    <div className="min-h-screen bg-cream-warm">
      {/* Header strip, matches PlanShell visually so there's no vertical jump. */}
      <div className="sticky top-0 z-30 border-b border-border/70 bg-cream-warm/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-6 lg:px-10 lg:py-4">
          <div className="h-9 w-9 shrink-0 rounded-full bg-white/60 lg:h-10 lg:w-10" />
          <div className="min-w-0 flex-1">
            <div className="h-2 w-24 rounded-full bg-charcoal/5" />
            <div className="mt-2 h-3 w-48 rounded-full bg-charcoal/10" />
          </div>
        </div>
      </div>

      {/* Content region. */}
      <div className="mx-auto max-w-6xl px-0 sm:px-6 lg:px-10 lg:pt-6">
        <main className="pb-28 lg:pb-16">
          <div className="relative aspect-[16/11] w-full animate-pulse bg-charcoal/80 sm:aspect-[16/9] lg:aspect-[21/9] lg:rounded-3xl" />
          <div className="mx-auto mt-8 max-w-2xl px-5 sm:px-6">
            <div className="h-3 w-32 animate-pulse rounded-full bg-charcoal/10" />
            <div className="mt-3 h-7 w-3/4 animate-pulse rounded-md bg-charcoal/10" />
            <div className="mt-3 h-7 w-1/2 animate-pulse rounded-md bg-charcoal/10" />
            <div className="mt-8 space-y-3">
              <div className="h-16 animate-pulse rounded-2xl bg-charcoal/[.04]" />
              <div className="h-16 animate-pulse rounded-2xl bg-charcoal/[.04]" />
              <div className="h-16 animate-pulse rounded-2xl bg-charcoal/[.04]" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
