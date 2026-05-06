"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function ChromeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isStandaloneDoc =
    pathname.startsWith("/proposals/") ||
    pathname.startsWith("/sandbox/") ||
    pathname === "/joinus" ||
    pathname.startsWith("/joinus/");

  if (isStandaloneDoc) {
    return (
      <main className="flex-1 bg-white text-slate-900 min-h-[100dvh]">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-light/50 bg-navy-deep py-10">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-text text-sm">
          <p>&copy; {new Date().getFullYear()} directbuild</p>
          <div className="flex gap-6 text-xs">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </>
  );
}
