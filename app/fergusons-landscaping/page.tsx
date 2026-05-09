"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Leaf,
  Camera,
  Tree,
  Hammer,
  MagnifyingGlass,
  Sparkle,
  Plus,
  Minus,
  MapPin,
} from "@phosphor-icons/react";
import FergusonsLandscapingEstimator from "./components/FergusonsLandscapingEstimator";
import FacebookPixel from "../components/FacebookPixel";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: spring },
};

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Tell us your suburb and scope",
    desc: "Pick the elements you're considering — backyard transformation, retaining, paving, planting and more.",
  },
  {
    num: "02",
    title: "Add site conditions and budget",
    desc: "Slope, access, drainage, timeline and a budget band so the AI understands the realistic envelope.",
  },
  {
    num: "03",
    title: "Upload up to 5 site photos",
    desc: "The AI reviews visible access, slope, surfaces and complexity directly from your photos.",
  },
  {
    num: "04",
    title: "Get your preliminary estimate",
    desc: "A range and itemised line items, so you can sanity-check pricing before any site visit.",
  },
];

const PRICE_FACTORS = [
  {
    icon: Tree,
    title: "Project scope & area",
    desc: "How many elements (paving, retaining, planting, turf) and the total square metres involved.",
  },
  {
    icon: Hammer,
    title: "Site access & machinery",
    desc: "Tight side access drives manual labour costs. Wide access lets machinery do the heavy lifting.",
  },
  {
    icon: Leaf,
    title: "Slope & earthworks",
    desc: "Sloped sites usually need cut-and-fill, retaining and extra structural preparation.",
  },
  {
    icon: MagnifyingGlass,
    title: "Drainage & ground conditions",
    desc: "Existing pooling, sandstone or rock under the surface change the cost meaningfully.",
  },
  {
    icon: Sparkle,
    title: "Material grade & finish",
    desc: "Sandstone, porcelain and natural stone sit well above concrete pavers in cost.",
  },
  {
    icon: Camera,
    title: "Existing surfaces to remove",
    desc: "Old concrete, paving, retaining and overgrowth all add demolition and waste removal.",
  },
];

const PROJECTS = [
  {
    src: "/clients/fergusons/projects/gymea-bay-design-construction.png",
    title: "Design and Construction",
    suburb: "Gymea Bay",
  },
  {
    src: "/clients/fergusons/projects/balmain-planting-maintenance.png",
    title: "Planting & Maintenance",
    suburb: "Balmain",
  },
  {
    src: "/clients/fergusons/projects/oatley-full-landscape.png",
    title: "Full Landscape",
    suburb: "Oatley",
  },
  {
    src: "/clients/fergusons/projects/haberfield-retaining-walls.png",
    title: "Retaining Walls",
    suburb: "Haberfield",
  },
  {
    src: "/clients/fergusons/projects/drummoyne-natural-stone-cladding.png",
    title: "Natural Stone Cladding",
    suburb: "Drummoyne",
  },
  {
    src: "/clients/fergusons/projects/marrickville-planting-maintenance.png",
    title: "Planting & Maintenance",
    suburb: "Marrickville",
  },
];

const FAQS = [
  {
    q: "Is this a final fixed quote?",
    a: "No. This is an AI-assisted preliminary quote estimate. Final pricing is confirmed after a site inspection, measurements, access review and confirmation of scope.",
  },
  {
    q: "Why does the AI need photos?",
    a: "Photos let the AI cross-reference your form answers against visible access, slope, surfaces, vegetation and structures — so the range better matches your actual site.",
  },
  {
    q: "How long does the cost check take?",
    a: "Most homeowners complete the cost check in under two minutes. The photo upload step is the only manual part.",
  },
  {
    q: "Who is Ferguson's Landscapes?",
    a: "Ferguson's Landscapes is the Sydney landscape construction partner behind this campaign. The cost check tool itself is delivered by Direct Build.",
  },
  {
    q: "What happens with my details?",
    a: "Your details are used to prepare the estimate and route a follow-up. We don't sell your information to third parties.",
  },
];

export default function FergusonsLandscapingPage() {
  return (
    <div className="bg-[#F4EDE0] text-[#1F2A2E]">
      <FacebookPixel pixelId="2059877051444776" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#E0D5BE]">
        {/* Subtle warm radials */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#E8DDC8]/60 blur-[120px]" />
          <div className="absolute bottom-[-25%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-[#D7E0CE]/40 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[1280px] w-full px-6 sm:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            {/* Left column */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="max-w-[600px]"
            >
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-[#D9CDB5] px-3 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#5E7263]"
              >
                <Leaf size={12} weight="fill" />
                Sydney Landscaping Cost Check
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.05] text-[#1F2A2E]"
              >
                Find out what your landscaping project could realistically cost
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-5 text-base sm:text-lg text-[#3D4A4F] leading-relaxed max-w-[55ch]"
              >
                Get an AI-assisted preliminary quote estimate based on your Sydney address,
                project scope, site conditions, materials and photos.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="#estimator"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-orange-safety px-7 py-4 text-base font-bold text-black-deep hover:bg-orange-hover active:scale-[0.98] transition-transform duration-150 min-h-[56px] shadow-[0_10px_30px_-10px_rgba(255,140,0,0.45)]"
                >
                  Start My Cost Check
                  <ArrowRight size={18} weight="bold" />
                </Link>
                <Link
                  href="#projects"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1F2A2E]/15 bg-white/60 backdrop-blur-sm px-6 py-4 text-base font-semibold text-[#1F2A2E] hover:bg-white/80 hover:border-[#1F2A2E]/30 min-h-[56px]"
                >
                  See Real Projects
                </Link>
              </motion.div>

              <motion.p variants={fadeUp} className="mt-6 text-xs text-[#5E7263]">
                AI-assisted preliminary estimate · No obligation · Sydney project context
              </motion.p>
            </motion.div>

            {/* Right column — hero image with overlay */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.3 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] rounded-[28px] overflow-hidden ring-1 ring-[#D9CDB5] shadow-[0_30px_60px_-25px_rgba(31,42,46,0.35)]">
                <Image
                  src="/clients/fergusons/selected/hero-gymea-bay-design-construction.png"
                  alt="Sydney landscaping project — Gymea Bay design and construction by Ferguson's Landscapes"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />

                {/* Soft top-down gradient for badge legibility */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent pointer-events-none"
                />

                {/* Floating badges */}
                <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                  {["Photo-assisted", "Sydney-focused", "Reviewed by local partner"].map(
                    (b) => (
                      <span
                        key={b}
                        className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-[#1F2A2E] ring-1 ring-white/40"
                      >
                        {b}
                      </span>
                    ),
                  )}
                </div>

                {/* Overlay estimate card */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-[320px] rounded-2xl bg-white/95 backdrop-blur-sm ring-1 ring-[#D9CDB5] p-4 sm:p-5 shadow-[0_18px_40px_-14px_rgba(31,42,46,0.35)]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4EDE0] ring-1 ring-[#E0D5BE]">
                      <Sparkle size={12} weight="fill" className="text-orange-safety" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#5E7263]">
                      Preliminary estimate
                    </p>
                  </div>
                  <p className="mt-2 text-2xl sm:text-[26px] font-extrabold text-[#1F2A2E] tabular-nums leading-none">
                    $28,000 <span className="text-[#A89C81]">–</span> $52,000
                  </p>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#3D4A4F] leading-snug">
                    Based on project type, access, slope, materials and photos
                  </p>
                </div>
              </div>

              {/* Image attribution */}
              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[#5E7263]/80">
                <MapPin size={12} weight="fill" />
                Project: Design and Construction, Gymea Bay · Ferguson&apos;s Landscapes
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Estimator section ── */}
      <section className="relative bg-[#FFF9EE] border-b border-[#E0D5BE]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mb-10 text-center"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5E7263]"
            >
              Direct Build cost check
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="mt-3 text-2xl sm:text-3xl font-bold text-[#1F2A2E]"
            >
              Build your preliminary estimate
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-3 text-sm sm:text-base text-[#3D4A4F] max-w-[55ch] mx-auto leading-relaxed"
            >
              A short guided form. Photos go through AI analysis. Result is a realistic
              range — not a final fixed quote.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={spring}
          >
            <FergusonsLandscapingEstimator />
          </motion.div>
        </div>
      </section>

      {/* ── How the cost check works ── */}
      <section id="how-it-works" className="bg-[#F4EDE0] border-b border-[#E0D5BE] py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="max-w-[55ch]"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5E7263] mb-3"
            >
              How the cost check works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold text-[#1F2A2E]"
            >
              Four guided steps. No phone tag.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-[#3D4A4F] leading-relaxed">
              The cost check is built to give you a realistic range before you involve any
              contractor — so you walk into trade conversations already informed.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {HOW_IT_WORKS.map((step) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className="relative rounded-2xl bg-white ring-1 ring-[#E0D5BE] p-6 min-h-[180px] hover:ring-[#D9CDB5] hover:shadow-[0_18px_40px_-20px_rgba(31,42,46,0.25)] transition-all duration-300"
              >
                <p className="text-xs font-bold tracking-[0.18em] text-orange-safety">
                  {step.num}
                </p>
                <h3 className="mt-3 text-base font-bold text-[#1F2A2E]">{step.title}</h3>
                <p className="mt-2 text-sm text-[#3D4A4F] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── What affects the price ── */}
      <section className="bg-[#FFF9EE] border-b border-[#E0D5BE] py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="max-w-[55ch]"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5E7263] mb-3"
            >
              What affects the price
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold text-[#1F2A2E]"
            >
              The variables we factor in
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-[#3D4A4F] leading-relaxed">
              The estimate isn&apos;t a flat per-square-metre number. The AI weighs site,
              scope and material variables together to land on a realistic range.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {PRICE_FACTORS.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="rounded-2xl bg-white ring-1 ring-[#E0D5BE] p-6 min-h-[160px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4EDE0] ring-1 ring-[#E0D5BE]">
                  <f.icon size={20} weight="duotone" className="text-[#5E7263]" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1F2A2E]">{f.title}</h3>
                <p className="mt-2 text-sm text-[#3D4A4F] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Real Sydney projects ── */}
      <section id="projects" className="bg-[#F4EDE0] border-b border-[#E0D5BE] py-20 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5E7263] mb-3"
            >
              Powered by Ferguson&apos;s Landscapes
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold text-[#1F2A2E] max-w-[28ch]"
            >
              Real Sydney landscaping projects behind the cost check
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-[#3D4A4F] leading-relaxed max-w-[62ch]"
            >
              These examples show the kind of outdoor work Ferguson&apos;s Landscapes has
              delivered across Sydney. Your estimate is still preliminary and subject to
              site review.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {PROJECTS.map((p) => (
              <motion.article
                key={p.src}
                variants={fadeUp}
                className="group rounded-2xl bg-white ring-1 ring-[#E0D5BE] overflow-hidden hover:shadow-[0_24px_50px_-22px_rgba(31,42,46,0.3)] transition-shadow duration-300"
              >
                <div className="relative aspect-[4/3] bg-[#EAE0CC] overflow-hidden">
                  <Image
                    src={p.src}
                    alt={`${p.title} project in ${p.suburb} by Ferguson's Landscapes`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#5E7263]">
                    {p.suburb}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[#1F2A2E]">
                    {p.title} — {p.suburb}
                  </h3>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#FFF9EE] border-b border-[#E0D5BE] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5E7263] mb-3"
            >
              FAQ
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold text-[#1F2A2E]"
            >
              Common questions
            </motion.h2>
          </motion.div>

          <div className="mt-12 space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={i} question={f.q} answer={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#F4EDE0]">
        <div className="mx-auto max-w-[1100px] px-6 sm:px-8 py-20 sm:py-24 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold text-[#1F2A2E]"
            >
              Ready to see the realistic range?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-[#3D4A4F] leading-relaxed max-w-[55ch] mx-auto"
            >
              Run the Direct Build cost check before you commit to a contractor and walk
              into your project knowing the realistic envelope.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10">
              <Link
                href="#estimator"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-orange-safety px-8 py-4 text-base font-bold text-black-deep hover:bg-orange-hover active:scale-[0.98] transition-transform duration-150 min-h-[56px] shadow-[0_10px_30px_-10px_rgba(255,140,0,0.45)]"
              >
                Start My Cost Check
                <ArrowRight size={18} weight="bold" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// ── FAQ accordion item ────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-white ring-1 ring-[#E0D5BE] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-[#FAF6EC]"
      >
        <span className="text-sm sm:text-base font-medium text-[#1F2A2E] pr-4">
          {question}
        </span>
        <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4EDE0] ring-1 ring-[#E0D5BE] text-[#5E7263]">
          {open ? <Minus size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
        </span>
      </button>
      <div
        className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm text-[#3D4A4F] leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
