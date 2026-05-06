import { PROOF_STATS } from "../data";

export default function ProofBar() {
  return (
    <section className="bg-black-deep border-y border-white/10">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12">
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 sm:gap-x-8 gap-y-6 sm:gap-y-8">
          {PROOF_STATS.map(({ label, value }) => (
            <li
              key={label}
              className="flex flex-col gap-1.5 sm:gap-2 lg:border-r lg:border-white/10 lg:last:border-r-0 lg:pr-8"
            >
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.18em] text-white/50 leading-snug">
                {label}
              </span>
              <span className="text-xl sm:text-3xl lg:text-[34px] font-bold tracking-[-0.02em] text-white tabular-nums">
                {value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
