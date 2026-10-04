import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/plan/auth";

export const metadata = {
  title: "StayLocal Admin — Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");
  const configured = isAdminConfigured();
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-warm px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="font-serif text-xl text-charcoal">StayLocal</div>
          <div className="text-xs uppercase tracking-wider text-muted">
            Admin
          </div>
        </div>
        {configured ? (
          <LoginForm />
        ) : (
          <div className="rounded-md bg-terracotta/10 px-3 py-3 text-sm text-terracotta">
            Admin isn’t configured yet. Set{" "}
            <code className="font-mono text-xs">ADMIN_PASSWORD</code> and{" "}
            <code className="font-mono text-xs">ADMIN_SESSION_SECRET</code> in
            your environment.
          </div>
        )}
      </div>
    </div>
  );
}
