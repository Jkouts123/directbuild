"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "How much does a granny flat cost in Australia?",
    a: "Costs vary widely based on size, finish, and site conditions. A basic studio starts around $80,000–$120,000. A 1-bedroom runs $120,000–$180,000, and a 2-bedroom ranges from $160,000 to $250,000+. High-end finishes and difficult sites can push costs higher.",
  },
  {
    q: "Do I need council approval?",
    a: "Yes. In most states you'll need either a Complying Development Certificate (CDC) — a faster, private-certifier route — or a full Development Application (DA) through council. NSW has the most permissive rules, allowing granny flats up to 60sqm on most residential blocks.",
  },
  {
    q: "How long does it take to build a granny flat?",
    a: "From approval to handover, most builds take 12–20 weeks. The approval stage adds 2–6 weeks for CDC or 8–16 weeks for DA. Total project time is typically 4–8 months including design and approvals.",
  },
  {
    q: "Can I rent out a granny flat?",
    a: "In NSW, granny flats (secondary dwellings) can be rented to anyone — they don't need to be a family member. Rules vary by state; check your local council for any restrictions on short-term or Airbnb-style letting.",
  },
  {
    q: "What affects the cost the most?",
    a: "The biggest cost drivers are: finish level (basic vs premium), site conditions (slope, access), construction type (brick veneer vs lightweight), and inclusions (kitchen spec, bathroom quality). A high-end 2-bed can cost double a basic one.",
  },
  {
    q: "Does Direct Build handle the entire process?",
    a: "Yes. Our network includes designers, certifiers, and licensed builders who handle everything from concept plans and council approvals through to construction, connection of services, and final inspection.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-3">
        Frequently Asked Questions
      </h3>
      {ITEMS.map((item, i) => (
        <button
          key={i}
          onClick={() => setOpen(open === i ? null : i)}
          className="w-full rounded-lg border border-[#6D858A]/30 bg-gray-dark/50 px-4 py-3 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-text">{item.q}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-[#6D858A] transition-transform duration-200 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </div>
          {open === i && (
            <p className="mt-2 text-sm leading-relaxed text-gray-text/80">
              {item.a}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
