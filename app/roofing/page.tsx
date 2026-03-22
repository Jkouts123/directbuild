import { HardHat } from "lucide-react";
import RoofingEstimator from "./components/RoofingEstimator";
import RevealText from "../components/RevealText";
import RevealOnScroll from "../components/RevealOnScroll";

export default function RoofingPage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative min-h-[420px] sm:min-h-[480px] flex items-center justify-center bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/hero-home.jpg')" }}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center max-w-2xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <RevealOnScroll direction="left" delay={0}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-safety/20 backdrop-blur-sm">
                <HardHat className="text-orange-safety" size={24} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">Roofing</h1>
            </div>
          </RevealOnScroll>
          <RevealText
            as="p"
            className="text-white/90 max-w-2xl mx-auto text-lg drop-shadow-md"
            delay={0.2}
            stagger={0.02}
          >
            Protect your biggest asset. Our licensed roofers handle everything from re-roofs and restorations to inspections and emergency leak repairs.
          </RevealText>
        </div>
      </div>

      {/* Estimator Section */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <RevealOnScroll delay={0.5}>
          <RoofingEstimator />
        </RevealOnScroll>
      </div>
    </div>
  );
}
