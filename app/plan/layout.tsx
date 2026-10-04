import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your StayLocal Plan",
  robots: { index: false, follow: false },
};

export default function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-warm text-charcoal">{children}</div>
  );
}
