import Link from "next/link";
import {
  Sun,
  Wind,
  Home,
  Trees,
  HardHat,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import RevealText from "./components/RevealText";
import RevealOnScroll from "./components/RevealOnScroll";

const SERVICES = [
  {
    href: "/solar",
    icon: Sun,
    title: "Solar",
    desc: "Panels, batteries & off-grid systems installed by CEC-accredited experts.",
  },
  {
    href: "/hvac",
    icon: Wind,
    title: "HVAC",
    desc: "Ducted, split-system & VRF climate solutions for homes and commercial.",
  },
  {
    href: "/grannyflats",
    icon: Home,
    title: "Granny Flats",
    desc: "Compliant secondary dwellings from design through to handover.",
  },
  {
    href: "/landscaping",
    icon: Trees,
    title: "Landscaping",
    desc: "Outdoor living, retaining walls, driveways & full garden transformations.",
  },
  {
    href: "/roofing",
    icon: HardHat,
    title: "Roofing",
    desc: "Re-roofs, restorations, Colorbond & tile — fully licensed and insured.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-orange-safety)_0%,transparent_60%)] opacity-[0.07]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center">
          <RevealText
            as="h1"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight"
            delay={0.1}
            stagger={0.05}
          >
            Direct Construction Network.
          </RevealText>
          <RevealText
            as="h1"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-orange-safety leading-tight mt-2"
            delay={0.4}
            stagger={0.06}
          >
            Vetted. Private. Australia-wide.
          </RevealText>
          <RevealText
            as="p"
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-text leading-relaxed"
            delay={0.8}
            stagger={0.02}
          >
            We connect homeowners with rigorously vetted tradies across every major Australian city. No open marketplaces. No bidding wars. Just qualified professionals, direct.
          </RevealText>
          <RevealOnScroll delay={1.2}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#services"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-safety px-8 min-h-[48px] text-sm font-bold text-black-deep hover:bg-orange-hover"
              >
                Explore Services
                <ArrowRight size={16} />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Social Proof */}
      <RevealOnScroll>
        <section className="border-y border-gray-light bg-gray-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-center">
            <p className="text-sm sm:text-base font-medium text-gray-text">
              Connecting{" "}
              <span className="text-orange-safety font-bold">100+</span>{" "}
              homeowners daily across all major Australian cities.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* Trust Bar */}
      <section className="border-b border-gray-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            <RevealOnScroll delay={0} direction="left">
              <div className="flex items-center gap-3 text-gray-text">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-light bg-gray-mid">
                  <ShieldCheck className="text-orange-safety" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Industry Accredited</p>
                  <p className="text-xs text-gray-text">Recognised standards</p>
                </div>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.15} direction="right">
              <div className="flex items-center gap-3 text-gray-text">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-light bg-gray-mid">
                  <BadgeCheck className="text-orange-safety" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Verified Tradies</p>
                  <p className="text-xs text-gray-text">Licence & insurance checked</p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealText
            as="h2"
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-4"
            stagger={0.06}
          >
            Our Services
          </RevealText>
          <RevealText
            as="p"
            className="text-center text-gray-text mb-12 max-w-xl mx-auto"
            delay={0.2}
            stagger={0.02}
          >
            Every tradie in our network is vetted for licensing, insurance, and workmanship before they receive a single lead.
          </RevealText>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((svc, i) => (
              <RevealOnScroll key={svc.href} delay={i * 0.1} direction="up">
                <Link
                  href={svc.href}
                  className="group relative block rounded-2xl border border-gray-light bg-gray-dark p-6 hover:border-orange-safety/50 overflow-hidden"
                >
                  {/* Geometric corner accent */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-orange-safety/30 group-hover:border-orange-safety rounded-tl-2xl" />

                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-safety/10">
                    <svc.icon className="text-orange-safety" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-safety">
                    {svc.title}
                  </h3>
                  <p className="text-sm text-gray-text leading-relaxed">
                    {svc.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-safety opacity-0 group-hover:opacity-100">
                    Get a Quote <ArrowRight size={14} />
                  </span>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
