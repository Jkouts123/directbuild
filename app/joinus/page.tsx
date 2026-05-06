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
  title: "DirectBuild — Apply for early access",
  description:
    "Now opening to a limited number of residential tradies in selected trades and areas. Apply for the current DirectBuild intake.",
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
      <CaseStudies />
      <HowItWorks />
      <EligibilityForm submitMode="live" />
      <FinalCTA />
    </div>
  );
}
