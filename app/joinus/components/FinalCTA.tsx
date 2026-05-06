import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="relative isolate bg-black-deep text-white border-t border-white/10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 360px at 80% 100%, rgba(255,140,0,0.12), transparent 60%), linear-gradient(180deg, #0d1420, #0a0e14)",
          }}
        />
      </div>

      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12 py-16 sm:py-24 lg:py-32 text-center space-y-7 sm:space-y-9 lg:space-y-10">
        <p className="inline-flex items-center gap-3 text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-orange-safety justify-center">
          <span className="h-px w-8 bg-orange-safety" aria-hidden />
          Final call
        </p>
        <h2 className="text-3xl sm:text-5xl lg:text-[80px] font-bold tracking-[-0.035em] leading-[1.05] sm:leading-[0.98] max-w-[22ch] mx-auto">
          Selected trades only.{" "}
          <span className="text-orange-safety">Limited spots per area.</span>
        </h2>
        <p className="text-base sm:text-lg text-white/60 max-w-[52ch] mx-auto leading-[1.6]">
          If your trade and area are open, we’ll be in touch about next steps.
        </p>
        <div className="flex justify-center pt-1">
          <a
            href="#apply"
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-orange-safety px-7 sm:px-8 min-h-[56px] sm:min-h-[60px] text-base sm:text-lg font-bold text-black-deep hover:bg-orange-hover active:scale-[0.99] transition-[background-color,transform] cursor-pointer"
          >
            Apply for early access
            <ArrowRight size={20} strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </section>
  );
}
