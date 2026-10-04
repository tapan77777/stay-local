import Link from "next/link";
import { AdminNav } from "./admin-nav";
import { logoutAction } from "@/lib/plan/actions";

export function AdminShell({
  authed,
  children,
}: {
  authed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-warm text-charcoal">
      {authed ? (
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-border bg-white md:flex md:flex-col">
            <div className="px-6 py-6">
              <Link
                href="/admin"
                className="font-serif text-lg leading-tight text-charcoal"
              >
                StayLocal
                <span className="ml-1 text-sm text-muted">Admin</span>
              </Link>
            </div>
            <AdminNav />
            <div className="mt-auto border-t border-border p-4">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-charcoal/[0.04] hover:text-charcoal"
                >
                  Sign out
                </button>
              </form>
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 md:hidden">
              <Link
                href="/admin"
                className="font-serif text-base text-charcoal"
              >
                StayLocal <span className="text-muted">Admin</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md px-3 py-1.5 text-xs text-muted hover:bg-charcoal/[0.04] hover:text-charcoal"
                >
                  Sign out
                </button>
              </form>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </div>
      ) : (
        <main className="min-h-screen">{children}</main>
      )}
    </div>
  );
}
