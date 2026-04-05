"use client";

import { motion } from "framer-motion";
import { Tree } from "@phosphor-icons/react";
import LandscapingEstimator from "./components/LandscapingEstimator";
import FacebookPixel from "../components/FacebookPixel";
import TrustBar from "../components/TrustBar";
import SampleQuotePreview from "../components/SampleQuotePreview";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

export default function LandscapingPage() {
  return (
    <div>
      <FacebookPixel pixelId="2059877051444776" />
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
                <Tree size={22} weight="duotone" className="text-orange-safety" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                Landscaping estimator
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.15 }}
              className="text-white/80 text-lg max-w-[55ch] leading-relaxed"
            >
              Get an instant ballpark estimate for your landscaping project. Answer a few questions and we will match you with a vetted landscaper.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.25 }}
              className="text-white/50 text-sm mt-4 max-w-[55ch]"
            >
              Join over 2,000 Australian homeowners who&apos;ve used Direct Build to get a fair price before calling a contractor.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.35 }}
              className="mt-6"
            >
              <TrustBar />
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.3 }}
          className="space-y-8"
        >
          <LandscapingEstimator />
          <SampleQuotePreview />
        </motion.div>
      </div>
    </div>
  );
}
