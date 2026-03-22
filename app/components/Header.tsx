"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/solar", label: "Solar" },
  { href: "/hvac", label: "HVAC" },
  { href: "/grannyflats", label: "Granny Flats" },
  { href: "/landscaping", label: "Landscaping" },
  { href: "/roofing", label: "Roofing" },
];

function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      {/* Geometric house icon matching brand guide */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
        <rect x="4" y="14" width="24" height="16" rx="2" stroke="#FF8C00" strokeWidth="2.5" fill="none" />
        <path d="M2 16L16 4L30 16" stroke="#FF8C00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="13" y="20" width="6" height="10" rx="1" stroke="#FF8C00" strokeWidth="2" fill="none" />
      </svg>
      <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-heading)]">
        <span className="text-orange-safety">direct</span>
        <span className="text-white">build</span>
      </span>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-light bg-black-deep/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:justify-start">
          {/* Mobile: hamburger left */}
          <button
            className="md:hidden text-gray-text hover:text-orange-safety min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile: centered logo / Desktop: left-aligned logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0"
          >
            <BrandLogo />
          </Link>

          {/* Mobile: spacer for symmetry */}
          <div className="w-12 md:hidden" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 ml-12">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-text hover:text-orange-safety"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-gray-light bg-black-deep">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center min-h-[48px] px-3 rounded-lg text-base font-medium text-gray-text hover:text-orange-safety hover:bg-gray-dark"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
