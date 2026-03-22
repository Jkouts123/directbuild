"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How does the quoting process work?",
    a: "Complete our quick estimator and we'll match you with a vetted landscaper in your area. You'll receive a detailed, obligation-free quote within 24 hours based on the scope you provide.",
  },
  {
    q: "Are your landscapers licensed and insured?",
    a: "Every landscaper in the Direct network holds a current landscape contractor licence and a minimum $10M public liability insurance policy. We verify credentials before any tradie receives a lead.",
  },
  {
    q: "What areas do you cover?",
    a: "We operate across all major Australian metro and regional areas including Sydney, Melbourne, Brisbane, Perth, Adelaide, Gold Coast, Canberra, and surrounding suburbs.",
  },
  {
    q: "How accurate is the online estimate?",
    a: "Our estimator uses 2026 market rates to give you a reliable ballpark. Final pricing is confirmed after an on-site measure and consultation with your assigned landscaper.",
  },
  {
    q: "Can I upload photos of my site?",
    a: "Yes — in the final step of our estimator you can attach up to 3 site photos. This helps your landscaper prepare a more accurate quote before the site visit.",
  },
  {
    q: "What's included in a typical landscaping quote?",
    a: "Quotes cover materials, labour, site preparation, waste removal, and project management. Any council approvals or engineering requirements are itemised separately.",
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
