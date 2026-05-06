import { HOW_IT_WORKS } from "../data";

export default function HowItWorks() {
  return (
    <section className="bg-white text-slate-900 py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <header className="max-w-[64ch] space-y-4 sm:space-y-5 mb-12 sm:mb-16 lg:mb-20">
          <p className="inline-flex items-center gap-3 text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-orange-safety">
            <span className="h-px w-8 bg-orange-safety" aria-hidden />
            How it works
          </p>
          <h2 className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-[-0.03em] leading-[1.05] text-slate-900">
            Four steps. No retainer. No fluff.
          </h2>
        </header>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 list-none">
          {HOW_IT_WORKS.map(({ step, title, body }) => (
            <li
              key={step}
              className="relative flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_30px_-16px_rgba(15,23,42,0.12)]"
            >
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-safety/10 text-orange-safety text-sm font-semibold tabular-nums"
              >
                {step}
              </span>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-900">
                  {title}
                </h3>
                <p className="text-[15px] sm:text-base leading-[1.6] text-slate-600">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
