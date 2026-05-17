import type { Metadata } from "next";
import FacebookPixel from "../components/FacebookPixel";
import AnnouncementBar from "./components/AnnouncementBar";
import Hero from "./components/Hero";
import ProofBar from "./components/ProofBar";
import LogoMarquee from "./components/LogoMarquee";
import WhyDirectBuild from "./components/WhyDirectBuild";
import CaseStudies from "./components/CaseStudies";
import HowItWorks from "./components/HowItWorks";
import EligibilityForm from "./components/EligibilityForm";
import FinalCTA from "./components/FinalCTA";

const JOINUS_PIXEL_ID = "744412482022839";

export const metadata: Metadata = {
  title: "DirectBuild — Check your trade + area fit",
  description:
    "DirectBuild reviews selected residential trades by trade, service area, capacity, job value, and local market signals before testing homeowner enquiries.",
};

export default function JoinusPage() {
  return (
    <div className="bg-black-deep text-white min-h-[100dvh]">
      <FacebookPixel pixelId={JOINUS_PIXEL_ID} />
      <AnnouncementBar />
      <Hero />
      <ProofBar />
      <LogoMarquee />
      <WhyDirectBuild />
      <WhatWeCheck />
      <CaseStudies />
      <HowItWorks />
      <AreaFitPreview />
      <EligibilityForm submitMode="live" />
      <FinalCTA />
    </div>
  );
}

function WhatWeCheck() {
  const checks = [
    {
      title: "Local residential upgrade activity",
      body: "NSW DA/CDC records can show pools, decks, patios, fencing, alterations, and other residential improvement signals.",
    },
    {
      title: "Property movement",
      body: "Recent property sales can indicate upgrade triggers after purchase.",
    },
    {
      title: "Local competitor visibility",
      body: "We check how visible local competitors are before recommending a test.",
    },
    {
      title: "Business readiness",
      body: "We review job value, capacity, response speed, and quote conversion potential.",
    },
  ];

  return (
    <section className="bg-slate-950 text-white py-16 sm:py-24 lg:py-28 border-y border-white/10">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <header className="max-w-[64ch] space-y-4 sm:space-y-5 mb-10 sm:mb-14">
          <p className="inline-flex items-center gap-3 text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-orange-safety">
            <span className="h-px w-8 bg-orange-safety" aria-hidden />
            Area Fit Check
          </p>
          <h2 className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-[-0.03em] leading-[1.05]">
            Before we take on a trade, we check the area first.
          </h2>
          <p className="text-base sm:text-lg text-white/60 leading-[1.6] max-w-[58ch]">
            These are signals, not guarantees. They help us decide whether a
            measured homeowner enquiry test is worth running.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {checks.map((check, index) => (
            <article
              key={check.title}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-7"
            >
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-orange-safety">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em]">
                {check.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-[1.6] text-white/62">
                {check.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AreaFitPreview() {
  const signals = [
    "Residential upgrade activity found",
    "Recent suburb-level property sales found",
    "Visible local competitors found",
    "Suggested test: 3–5 qualified enquiries/month",
  ];

  return (
    <section className="bg-white text-slate-900 py-14 sm:py-20 border-t border-slate-200">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-orange-safety">
            Example area check
          </p>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-[-0.03em]">
            Landscaping · Penrith
          </h2>
          <ul className="mt-6 space-y-3">
            {signals.map((signal) => (
              <li key={signal} className="flex gap-3 text-sm sm:text-base text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-safety" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Example only. Results depend on trade, area, capacity, response
            speed, and quote conversion.
          </p>
        </div>

        <div className="rounded-2xl border border-orange-safety/25 bg-orange-safety/10 p-6 sm:p-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-orange-safety">
            Selected trades only
          </p>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-[-0.03em]">
            We reject some trades and areas.
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-[1.6] text-slate-700">
            We do not accept every trade or every area. If the job value,
            service area, capacity, or response speed does not support a
            realistic test, we will say so.
          </p>
        </div>
      </div>
    </section>
  );
}
