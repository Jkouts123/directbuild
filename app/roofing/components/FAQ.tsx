"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "How much does a roof replacement cost in Australia?",
    a: "A full roof replacement typically costs $80–$200 per square metre depending on the material. A standard single-storey home (150–200 sqm roof area) ranges from $15,000 to $35,000 for Colorbond, and up to $50,000+ for premium tiles or slate.",
  },
  {
    q: "How long does a roof replacement take?",
    a: "Most single-storey re-roofs take 3–5 days. Two-storey homes or complex roof shapes may take 7–10 days. Factors like weather, scaffolding, and asbestos removal can extend the timeline.",
  },
  {
    q: "Do I need council approval to replace my roof?",
    a: "In most cases, a like-for-like replacement (same material and colour) is exempt from council approval. Changing material types or altering the roofline may require a development application (DA) or complying development certificate (CDC).",
  },
  {
    q: "How do I know if my roof has asbestos?",
    a: "If your home was built before 1990, there's a chance the roof contains asbestos cement sheeting. A licensed assessor can test a sample. If asbestos is confirmed, removal must be done by a licensed asbestos removalist, adding $50–$80/sqm to the cost.",
  },
  {
    q: "What roofing material is best for Australian conditions?",
    a: "Colorbond steel is the most popular choice — it's lightweight, durable (50+ year warranty), bushfire-rated, and cost-effective. Concrete tiles are heavy but long-lasting. Terracotta suits heritage homes. Each has trade-offs in cost, weight, and aesthetics.",
  },
  {
    q: "Does Direct Build provide warranties on roofing work?",
    a: "All tradies in our network are licensed and insured. Structural work is covered by statutory warranties (6+ years in most states). Material warranties vary by manufacturer — Colorbond offers up to 36 years on specific products.",
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
