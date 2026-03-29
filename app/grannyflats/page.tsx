"use client";

import { motion } from "framer-motion";
import { House } from "@phosphor-icons/react";
import GrannyFlatEstimator from "./components/GrannyFlatEstimator";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

export default function GrannyFlatsPage() {
  return (
    <div>
      <section
        className="relative min-h-[420px] sm:min-h-[480px] flex items-center bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/hero-home.jpg')" }}
      >
        <div className="absolute inset-0 bg-black-deep/50" />
        <div className="relative z-10 mx-auto max-w-[1400px] w-full px-6 sm:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="flex items-center gap-3 mb-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-safety/20 backdrop-blur-sm">
                <House size={22} weight="duotone" className="text-orange-safety" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                Granny flat estimator
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.15 }}
              className="text-white/80 text-lg max-w-[55ch] leading-relaxed"
            >
              Add value to your property with a compliant secondary dwelling. Our builders handle design, approvals and construction end-to-end.
            </motion.p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.3 }}
        >
          <GrannyFlatEstimator />
        </motion.div>
      </div>
    </div>
  );
}
