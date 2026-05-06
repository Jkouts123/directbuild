"use client";

import Image from "next/image";
import { useState } from "react";
import { LOGOS, type LogoEntry } from "../data";

// Track is duplicated 2× so the keyframes can translate -50% for a seamless loop.
const TRACK = [...LOGOS, ...LOGOS];
const LOGO_SLOT =
  "shrink-0 h-20 w-40 sm:h-24 sm:w-48 relative overflow-hidden";
const LOGO_IMAGE =
  "object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-[filter,opacity,transform] duration-300";

export default function LogoMarquee() {
  return (
    <section className="bg-white py-16 sm:py-20 border-y border-slate-200">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <p className="text-center text-[11px] font-mono uppercase tracking-[0.22em] text-slate-500 mb-10 sm:mb-12">
          Tradies already running with DirectBuild
        </p>
      </div>

      <div
        className="relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div
          className="flex w-max gap-12 sm:gap-16 items-center motion-safe:animate-[marquee_60s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:!animate-none"
          aria-label="Trusted businesses"
        >
          {TRACK.map((logo, i) => (
            <LogoSlot key={`${logo.name}-${i}`} logo={logo} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </section>
  );
}

function LogoSlot({ logo }: { logo: LogoEntry }) {
  const [errored, setErrored] = useState(false);
  const useWordmark = "wordmark" in logo || errored;

  if (useWordmark) {
    return (
      <div className="shrink-0 h-14 sm:h-16 px-6 flex items-center justify-center rounded-md border border-slate-300/70">
        <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.22em] text-slate-500 whitespace-nowrap">
          {logo.name}
        </span>
      </div>
    );
  }

  return (
    <div className={LOGO_SLOT}>
      <Image
        src={logo.src}
        alt={logo.alt}
        fill
        sizes="(min-width: 640px) 192px, 160px"
        unoptimized
        className={`${LOGO_IMAGE} ${logo.imageClassName || ""}`}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
