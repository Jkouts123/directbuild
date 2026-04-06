"use client";

import { motion } from "framer-motion";
import { Handshake, Megaphone, CurrencyDollar, PhoneCall } from "@phosphor-icons/react";
import TradieSignup from "./components/TradieSignup";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const VALUE_PROPS = [
  {
    icon: Megaphone,
    title: "We run the ads",
    description: "Paid Meta campaigns generating real homeowner leads across Australia.",
  },
  {
    icon: PhoneCall,
    title: "Leads sent to you",
    description: "Qualified leads delivered directly — no bidding, no marketplaces.",
  },
  {
    icon: CurrencyDollar,
    title: "5% on wins only",
    description: "You only pay a 5% referral fee if you win the job. Zero upfront cost.",
  },
  {
    icon: Handshake,
    title: "We call in 24 hours",
    description: "Our team will personally call you within 24 hours to get you set up.",
  },
];

export default function JoinUsPage() {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-[420px] sm:min-h-[480px] flex items-center bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/hero-home.jpg')" }}
      >
        <div className="absolute inset-0 bg-black-deep/60" />
        <div className="relative z-10 mx-auto max-w-[1400px] w-full px-6 sm:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg font-[family-name:var(--font-heading)]"
            >
              Join the Direct Build network
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.15 }}
              className="text-white/80 text-lg max-w-[55ch] leading-relaxed mt-4"
            >
              We&apos;re running paid Meta ads generating homeowner leads across Australia.
              Join our network and we&apos;ll send leads directly to you — you only pay 5% if
              you win the job. Our team will call you within 24 hours.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
        >
          {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-safety/15">
                <Icon size={22} weight="duotone" className="text-orange-safety" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          className="rounded-2xl border border-white/10 bg-gray-dark p-6 sm:p-8"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-heading)] mb-1">
            Apply to join
          </h2>
          <p className="text-sm text-gray-text mb-8">
            Fill in your details and we&apos;ll be in touch within 24 hours.
          </p>
          <TradieSignup />
        </motion.div>
      </section>
    </div>
  );
}
