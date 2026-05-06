import { WHY_POINTS } from "../data";

export default function WhyDirectBuild() {
  return (
    <section className="bg-white text-slate-900 py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <header className="max-w-[60ch] space-y-4 sm:space-y-5 mb-12 sm:mb-16 lg:mb-20">
          <p className="inline-flex items-center gap-3 text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-orange-safety">
            <span className="h-px w-8 bg-orange-safety" aria-hidden />
            Why DirectBuild
          </p>
          <h2 className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-[-0.03em] leading-[1.05] text-slate-900">
            Most agencies get paid before
            <br className="hidden sm:block" /> you see a real job. We don’t.
          </h2>
          <p className="max-w-[58ch] text-base sm:text-lg text-slate-600 leading-[1.6]">
            DirectBuild is built around private homeowner work that actually
            proceeds — not retainers, not vague reports, not generic agency
            output.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
          {WHY_POINTS.map(({ title, body }, i) => (
            <article
              key={title}
              className="bg-white p-7 sm:p-9 lg:p-10 space-y-4"
            >
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-orange-safety tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                {title}
              </h3>
              <p className="text-base sm:text-[17px] leading-[1.6] text-slate-600 max-w-[44ch]">
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
