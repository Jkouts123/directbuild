import { CASE_STUDIES, type CaseStudy } from "../data";

// Magazine-style asymmetric grid: two cards span 2 columns each on lg+
// to break the rhythm without breaking responsiveness on smaller screens.
const SPAN_BY_INDEX: Record<string, string> = {
  "01": "lg:col-span-2",
  "04": "lg:col-span-2",
};

// Premium tinted tag treatments per trade. Keep text readable on dark cards.
const TRADE_STYLES: Record<string, string> = {
  Landscaping:
    "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
  Solar: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  Carpentry: "border-orange-300/40 bg-orange-300/10 text-orange-200",
  "Multi-trade": "border-sky-400/35 bg-sky-400/10 text-sky-300",
};

const TRADE_DEFAULT =
  "border-white/15 bg-white/[0.04] text-white/65";

export default function CaseStudies() {
  return (
    <section
      id="results"
      className="relative isolate bg-black-deep text-white py-16 sm:py-24 lg:py-28 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-90">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 500px at 90% 0%, rgba(255,140,0,0.10), transparent 60%), linear-gradient(180deg, #0a0e14, #0d1420)",
          }}
        />
      </div>

      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <header className="max-w-[64ch] space-y-4 sm:space-y-5 mb-12 sm:mb-16 lg:mb-20">
          <p className="inline-flex items-center gap-3 text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-orange-safety">
            <span className="h-px w-8 bg-orange-safety" aria-hidden />
            Early results
          </p>
          <h2 className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-[-0.03em] leading-[1.05]">
            Early partners are already
            <br className="hidden sm:block" />{" "}
            <span className="text-orange-safety">closing real work.</span>
          </h2>
          <p className="max-w-[60ch] text-base sm:text-lg text-white/60 leading-[1.6]">
            DirectBuild is just opening partner intake, but early trade
            partners are already seeing first-day and first-week wins across
            solar, carpentry, and landscaping.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {CASE_STUDIES.map((c) => (
            <Card
              key={c.business}
              study={c}
              span={SPAN_BY_INDEX[c.index] ?? ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ study, span }: { study: CaseStudy; span: string }) {
  const { index, business, location, trade, outcome } = study;
  const tagClass = TRADE_STYLES[trade] ?? TRADE_DEFAULT;
  return (
    <article
      className={`group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-9 backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.045] hover:border-white/20 ${span}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-orange-safety tabular-nums">
          {index}
        </p>
        <span
          className={`text-[10px] font-mono font-medium uppercase tracking-[0.2em] border rounded-full px-2.5 py-1 whitespace-nowrap ${tagClass}`}
        >
          {trade}
        </span>
      </div>

      <div className="mt-8 sm:mt-10 lg:mt-12 space-y-3 sm:space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-white">
            {business}
          </h3>
          {location && (
            <p className="text-xs sm:text-sm text-white/50 font-mono uppercase tracking-[0.16em]">
              {location}
            </p>
          )}
        </div>
        <p className="text-base sm:text-[17px] leading-[1.55] text-white/80 max-w-[52ch]">
          {outcome}
        </p>
      </div>
    </article>
  );
}
