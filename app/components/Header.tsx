"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react";

const NAV_LINKS = [
  { href: "/solar", label: "Solar" },
  { href: "/hvac", label: "HVAC" },
  { href: "/grannyflats", label: "Granny flats" },
  { href: "/landscaping", label: "Landscaping" },
  { href: "/roofing", label: "Roofing" },
];

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="shrink-0">
        <rect x="4" y="14" width="24" height="16" rx="2" stroke="#FF8C00" strokeWidth="2.5" fill="none" />
        <path d="M2 16L16 4L30 16" stroke="#FF8C00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="13" y="20" width="6" height="10" rx="1" stroke="#FF8C00" strokeWidth="2" fill="none" />
      </svg>
      <span className="text-base font-semibold tracking-tight">
        <span className="text-orange-safety">direct</span>
        <span className="text-white">build</span>
      </span>
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 glass-panel">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="relative z-10">
            <BrandLogo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    active
                      ? "text-orange-safety bg-orange-safety/8"
                      : "text-gray-text hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-text hover:text-white min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer active:scale-[0.95]"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-white/[0.06] bg-navy-deep/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-0.5">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center min-h-[48px] px-4 rounded-lg text-[15px] font-medium transition-colors duration-200 ${
                    active
                      ? "text-orange-safety bg-orange-safety/8"
                      : "text-gray-text hover:text-white hover:bg-white/[0.04]"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
