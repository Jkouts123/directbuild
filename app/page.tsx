"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, SealCheck, Lightning, HardHat, Tree, Wind, SolarPanel } from "@phosphor-icons/react";

const SERVICES = [
  {
    href: "/solar",
    icon: SolarPanel,
    title: "Solar",
    desc: "Panels, batteries and off-grid systems installed by CEC-accredited experts.",
    span: "md:col-span-2",
  },
  {
    href: "/hvac",
    icon: Wind,
    title: "HVAC",
    desc: "Ducted, split-system and VRF climate solutions for homes and commercial.",
    span: "",
  },
  {
    href: "/grannyflats",
    icon: HardHat,
    title: "Granny flats",
    desc: "Compliant secondary dwellings from design through to handover.",
    span: "",
  },
  {
    href: "/landscaping",
    icon: Tree,
    title: "Landscaping",
    desc: "Outdoor living, retaining walls, driveways and full garden transformations.",
    span: "md:col-span-2",
  },
  {
    href: "/roofing",
    icon: HardHat,
    title: "Roofing",
    desc: "Re-roofs, restorations, Colorbond and tile — fully licensed and insured.",
    span: "md:col-span-3",
  },
];

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: spring },
};

const TRUST = [
  { icon: ShieldCheck, label: "Industry accredited", sub: "Recognised standards" },
  { icon: SealCheck, label: "Verified tradies", sub: "Licence and insurance checked" },
  { icon: Lightning, label: "Instant quotes", sub: "AI-powered estimates in seconds" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero: Asymmetric Split ── */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        {/* Ambient gradient */}
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-orange-safety/[0.04] blur-[120px]" />
          <div className="absolute bottom-[-30%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-orange-safety/[0.02] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] w-full px-6 sm:px-8 py-20 sm:py-0">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-20 items-center">
            {/* Left — Copy */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="max-w-[600px]"
            >
              <motion.p
                variants={fadeUp}
                className="text-sm font-semibold tracking-widest uppercase text-orange-safety mb-6"
              >
                Australia&apos;s private tradie network
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.08] text-white"
              >
                Direct access to
                <br />
                <span className="text-orange-safety">vetted professionals.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-lg text-gray-text leading-relaxed max-w-[50ch]"
              >
                We connect homeowners with rigorously vetted tradies across every major Australian city. No open marketplaces. No bidding wars. Just qualified professionals, direct.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="#services"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-orange-safety px-7 py-3.5 text-sm font-bold text-black-deep hover:bg-orange-hover active:scale-[0.98] transition-transform duration-150"
                >
                  Explore services
                  <ArrowRight size={16} weight="bold" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — Stats / Social proof card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.4 }}
              className="hidden md:block"
            >
              <div className="glass-panel rounded-3xl p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { num: "2,400+", label: "Verified tradies" },
                    { num: "18,000+", label: "Quotes generated" },
                    { num: "4.9", label: "Average rating" },
                    { num: "97%", label: "Quote accuracy" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-bold text-orange-safety font-[family-name:var(--font-heading)] tabular-nums">
                        {stat.num}
                      </p>
                      <p className="text-sm text-gray-text mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/[0.06] pt-6">
                  <p className="text-xs text-gray-text">
                    Connecting homeowners daily across Sydney, Melbourne, Brisbane, Perth, Adelaide and more.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-y border-white/[0.06]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 py-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-6 sm:gap-8"
          >
            {TRUST.map((item) => (
              <motion.div key={item.label} variants={fadeUp} className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-safety/8 border border-orange-safety/15">
                  <item.icon size={22} weight="duotone" className="text-orange-safety" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-text">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services: Asymmetric Grid ── */}
      <section id="services" className="py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold tracking-widest uppercase text-orange-safety mb-3"
            >
              What we cover
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold text-white max-w-[28ch]"
            >
              Every trade, rigorously vetted
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-gray-text max-w-[55ch] leading-relaxed"
            >
              Every tradie in our network is verified for licensing, insurance and workmanship before they receive a single lead.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="mt-14 grid md:grid-cols-3 gap-4"
          >
            {SERVICES.map((svc) => (
              <motion.div key={svc.href} variants={fadeUp} className={svc.span}>
                <Link
                  href={svc.href}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-gray-dark/60 p-7 min-h-[180px] hover:border-orange-safety/30 hover:bg-gray-dark transition-colors duration-300 overflow-hidden"
                >
                  {/* Corner accent */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-orange-safety/25 group-hover:border-orange-safety/60 rounded-tl-2xl transition-colors duration-300" />

                  <div>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-safety/8">
                      <svc.icon size={22} weight="duotone" className="text-orange-safety" />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-safety transition-colors duration-200">
                      {svc.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-text leading-relaxed max-w-[45ch]">
                      {svc.desc}
                    </p>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-orange-safety opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Get a quote <ArrowRight size={14} weight="bold" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 py-20 sm:py-24 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-bold text-white"
            >
              Ready to get started?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-gray-text max-w-[50ch] mx-auto"
            >
              Pick a service above and get an AI-powered ballpark estimate in under two minutes. No sign-up required.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8">
              <Link
                href="#services"
                className="inline-flex items-center gap-2.5 rounded-xl bg-orange-safety px-7 py-3.5 text-sm font-bold text-black-deep hover:bg-orange-hover active:scale-[0.98] transition-transform duration-150"
              >
                Browse services
                <ArrowRight size={16} weight="bold" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
