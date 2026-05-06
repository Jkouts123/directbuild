import { ArrowRight, ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-black-deep text-white">
      {/* Atmospheric layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(1200px 600px at 18% -10%, rgba(255,140,0,0.18), transparent 55%), radial-gradient(900px 500px at 92% 12%, rgba(142,174,190,0.10), transparent 60%), linear-gradient(180deg, #0a0e14 0%, #0d1420 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "120px 100%",
          }}
          aria-hidden
        />
      </div>

      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12 pt-12 sm:pt-20 lg:pt-32 pb-16 sm:pb-24 lg:pb-36">
        <div className="max-w-[64ch] space-y-6 sm:space-y-9 lg:space-y-10">
          <p className="inline-flex items-center gap-3 text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-orange-safety">
            <span className="h-px w-8 bg-orange-safety" aria-hidden />
            <span className="leading-snug">
              Now opening · selective intake by trade + area
            </span>
          </p>

          <h1 className="text-[34px] sm:text-[56px] lg:text-[84px] font-bold leading-[1.02] sm:leading-[0.98] tracking-[-0.035em]">
            Stop paying retainers for marketing that{" "}
            <span className="text-orange-safety">never turns into</span> real
            jobs.
          </h1>

          <p className="max-w-[58ch] text-base sm:text-lg lg:text-xl leading-[1.55] text-white/70">
            DirectBuild is opening to a limited number of residential tradies
            in selected trades and service areas. We help generate
            homeowner-ready opportunities through DirectBuild, then work with
            operators who can actually take them on.{" "}
            <span className="text-white">No agency fluff.</span>{" "}
            <span className="text-white">No monthly retainer treadmill.</span>
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
            <a
              href="#apply"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-orange-safety px-7 min-h-[56px] text-base font-bold text-black-deep hover:bg-orange-hover active:scale-[0.99] transition-[background-color,transform] cursor-pointer"
            >
              Apply for early access
              <ArrowRight size={18} strokeWidth={2.25} />
            </a>
            <a
              href="#results"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              See real results
              <ArrowDown size={16} strokeWidth={2} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
