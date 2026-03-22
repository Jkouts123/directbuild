"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How accurate is this air conditioning estimate?",
    a: "This estimate provides a realistic market price range based on your system type, home size, installation complexity, and current labour costs. It is designed to give you a useful guide, not a final on-site quote. Actual prices may vary depending on your specific property conditions and the contractor you choose.",
  },
  {
    q: "Why do air conditioning quotes vary so much?",
    a: "Prices vary due to several factors including system type (split vs ducted), capacity requirements, number of zones or indoor units, installation complexity, electrical work needed, access difficulty, and contractor overheads. Two quotes for the same home can differ significantly based on these variables.",
  },
  {
    q: "Does this replace a site inspection?",
    a: "No. A site inspection is still required for a final quote from an installer. However, this estimate helps you understand what a fair price range looks like before speaking to contractors, so you can evaluate quotes with more confidence.",
  },
  {
    q: "Are your HVAC installers licensed?",
    a: "Every HVAC technician in the Direct network holds a current refrigerant handling licence (ARCtick) and electrical licence where required. We verify credentials and insurance before any installer joins our network.",
  },
  {
    q: "What areas do you cover?",
    a: "We operate across all major Australian metro and regional areas including Sydney, Melbourne, Brisbane, Perth, Adelaide, Gold Coast, Canberra, and surrounding suburbs.",
  },
  {
    q: "What's included in a typical HVAC quote?",
    a: "Quotes cover the air conditioning unit, installation labour, electrical work, pipework, mounting brackets, and standard commissioning. Any additional ducting, zoning, or structural modifications are itemised separately.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-3">
        Frequently Asked Questions
      </h3>
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-lg border border-[#6D858A]/30 bg-gray-dark/50 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer"
            >
              <span className="text-sm font-medium text-gray-text pr-4">
                {faq.q}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-[#6D858A] transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-200 ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-3 text-sm text-gray-text/80 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
