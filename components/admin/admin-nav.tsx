"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/plans", label: "Plans" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-3 py-2">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-brand-green-light text-brand-green-dark"
                : "text-muted hover:bg-charcoal/[0.04] hover:text-charcoal"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
