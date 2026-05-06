import type { Metadata } from "next";
import AnnouncementBar from "../../joinus/components/AnnouncementBar";
import Hero from "../../joinus/components/Hero";
import ProofBar from "../../joinus/components/ProofBar";
import LogoMarquee from "../../joinus/components/LogoMarquee";
import WhyDirectBuild from "../../joinus/components/WhyDirectBuild";
import CaseStudies from "../../joinus/components/CaseStudies";
import HowItWorks from "../../joinus/components/HowItWorks";
import EligibilityForm from "../../joinus/components/EligibilityForm";
import FinalCTA from "../../joinus/components/FinalCTA";

export const metadata: Metadata = {
  title: "DirectBuild — Apply for early access (sandbox)",
  description:
    "Sandbox preview of the DirectBuild tradie waitlist. Submits to /api/sandbox/joinus-waitlist only.",
  robots: { index: false, follow: false, nocache: true },
};

export default function SandboxJoinusPage() {
  return (
    <div className="bg-black-deep text-white min-h-[100dvh]">
      <AnnouncementBar />
      <Hero />
      <ProofBar />
      <LogoMarquee />
      <WhyDirectBuild />
      <CaseStudies />
      <HowItWorks />
      <EligibilityForm submitMode="sandbox" />
      <FinalCTA />
    </div>
  );
}
