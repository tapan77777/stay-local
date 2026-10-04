"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

function isInternalPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/plan" ||
    pathname.startsWith("/plan/");
}

export function PublicNavbar() {
  const pathname = usePathname();
  if (isInternalPath(pathname)) return null;
  return <Navbar />;
}

export function PublicFooter() {
  const pathname = usePathname();
  if (isInternalPath(pathname)) return null;
  return <Footer />;
}
