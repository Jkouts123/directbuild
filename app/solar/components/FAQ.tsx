"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How accurate is this solar estimate?",
    a: "This estimate provides a realistic market price range based on your system size, panel quality, inverter type, and roof complexity. It is designed to give you a useful guide, not a final on-site quote. Actual prices may vary depending on your specific roof conditions, shading, and the installer you choose.",
  },
  {
    q: "Why do solar quotes vary so much?",
    a: "Prices vary due to panel brand and tier, inverter type (string vs micro), battery inclusion, roof type and access, electrical upgrades needed, and installer margins. Two quotes for the same home can differ by thousands based on these variables.",
  },
  {
    q: "What government rebates are available?",
    a: "Australian homeowners can claim Small-scale Technology Certificates (STCs) which reduce upfront costs by $2,000–$4,000 depending on system size and location. Some states offer additional rebates. Your installer will apply these automatically.",
  },
  {
    q: "Are your solar installers CEC accredited?",
    a: "Every solar installer in the Direct network holds current Clean Energy Council (CEC) accreditation. We verify credentials, insurance, and workmanship warranty before any installer joins our network.",
  },
  {
    q: "How long does a solar installation take?",
    a: "A standard residential solar installation takes 1–2 days on site. The full process from quote to power-on typically takes 2–6 weeks, including paperwork and grid connection approval.",
  },
  {
    q: "What warranty do I get?",
    a: "Solar panels typically come with 25-year performance warranties. Inverters carry 5–12 year warranties depending on brand. Your installer also provides a 5-year workmanship warranty as required by CEC guidelines.",
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
