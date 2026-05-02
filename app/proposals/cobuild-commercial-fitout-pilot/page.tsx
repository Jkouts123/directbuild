import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cobuild Commercial Design + Build Lead Generation Pilot",
  description: "Revised quote for commercial fitout enquiries across Sydney.",
  robots: { index: false, follow: false, nocache: true },
};

const SUMMARY: { label: string; value: string }[] = [
  { label: "Channel", value: "Google Ads" },
  { label: "Focus", value: "Commercial fitouts / design + build enquiries" },
  { label: "DirectBuild fee", value: "$2,500 AUD upfront" },
  {
    label: "Recommended ad spend",
    value: "$60/day, paid directly to Google (≈$1,800/month)",
  },
  { label: "Success fee", value: "1% of accepted contract value" },
  { label: "Term", value: "30-day pilot, no long-term lock-in" },
  { label: "Target launch", value: "11 May" },
];

const INCLUDED: { item: string; included: string }[] = [
  {
    item: "Google Ads setup",
    included:
      "Campaign structure, keywords, negative keywords, location targeting",
  },
  {
    item: "Ad copywriting",
    included: "Commercial fitout and design + build focused search ads",
  },
  {
    item: "Conversion tracking",
    included: "Track calls/forms where practical",
  },
  {
    item: "Commercial fitout landing page",
    included: "Dedicated page for paid traffic, not a full website rebuild",
  },
  {
    item: "First 30 days management",
    included: "Search terms, budget control, optimisation, reporting",
  },
  {
    item: "Lead qualification",
    included:
      "DirectBuild screens leads for project type, stage, timing, budget, and fit",
  },
  {
    item: "Lead handover",
    included:
      "Cobuild receives qualified lead notes before speaking with the client",
  },
];

const INVESTMENT: { item: string; amount: string }[] = [
  {
    item: "DirectBuild setup + first 30 days management",
    amount: "$2,500 AUD upfront",
  },
  {
    item: "Recommended Google Ads spend",
    amount: "$60/day paid directly to Google (≈$1,800/month)",
  },
  {
    item: "Success fee",
    amount: "1% of accepted contract value from DirectBuild-generated leads",
  },
  { item: "Term", amount: "30-day pilot, no long-term lock-in" },
];

const QUALIFIED = [
  "Commercial fitout or internal commercial works",
  "Sydney or Cobuild’s service area",
  "Real project, not casual curiosity",
  "Minimum estimated project value of $70,000",
  "Client owns the premises, has the lease signed, or is far enough through the lease process that proceeding is realistic",
  "Suitable for Cobuild’s current size and capacity",
  "Not a heavy corporate/procurement-style job with external project managers, excessive paperwork, or tender-style requirements unless Cobuild agrees it is suitable",
  "Not someone using Cobuild to test whether they should take a lease",
  "Not purely residential unless agreed otherwise",
];

const NOT_QUALIFIED = [
  "Unreachable after enquiry",
  "Outside service area",
  "Clearly unrealistic budget or timeframe",
  "Only looking for the cheapest quote",
  "Purely residential unless agreed otherwise",
  "Casual curiosity with no real project",
  "Already locked into another builder",
];

const PROJECTION_INPUTS: { metric: string; estimate: string }[] = [
  { metric: "Average commercial job value", estimate: "$150,000–$300,000" },
  { metric: "Approximate profit margin", estimate: "15%" },
  { metric: "Profit per accepted job", estimate: "$22,500–$45,000" },
  { metric: "Close rate discussed", estimate: "2 from 10 qualified leads" },
  { metric: "DirectBuild success fee", estimate: "1% of accepted contract value" },
];

const PROJECTION_OUTCOME: {
  result: string;
  low: string;
  high: string;
}[] = [
  { result: "Jobs closed", low: "2", high: "2" },
  { result: "Revenue generated", low: "$300,000", high: "$600,000" },
  { result: "Profit generated at 15%", low: "$45,000", high: "$90,000" },
  { result: "DirectBuild success fee at 1%", low: "$3,000", high: "$6,000" },
];

const NEXT_STEPS = [
  "Confirm pilot structure",
  "Confirm launch timing based on Cobuild’s availability",
  "Set Google Ads daily budget",
  "Provide Google Ads access without sharing passwords",
  "Build commercial fitout landing page",
  "Launch campaign when Cobuild is ready to take calls",
  "Review lead quality after 30 days",
];

export default function CobuildCommercialFitoutPilot() {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-[100dvh]">
      <article className="mx-auto max-w-[920px] px-5 sm:px-8 lg:px-10 py-12 sm:py-16">
        {/* ── Document header ── */}
        <header className="space-y-4 pb-10 border-b border-slate-200">
          <BrandMark />
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-orange-safety">
            Quote · Prepared for Cobuild Constructions
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1]">
            Cobuild Commercial Design + Build Lead Generation Pilot
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-[60ch]">
            Revised quote for commercial fitout enquiries across Sydney.
          </p>
        </header>

        {/* ── Top summary card ── */}
        <SoftCard className="mt-10">
          <SectionEyebrow>Summary</SectionEyebrow>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 mt-5">
            {SUMMARY.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 border-b border-slate-100 pb-4 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
              >
                <dt className="text-[11px] font-mono uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </dt>
                <dd className="text-base sm:text-[17px] font-semibold text-slate-900 tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </SoftCard>

        {/* ── Section 1: Included in the pilot ── */}
        <Section number="01" title="Included in the pilot">
          <SoftCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-[15px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700 w-1/3">
                      Item
                    </th>
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700">
                      Included
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {INCLUDED.map(({ item, included }) => (
                    <tr
                      key={item}
                      className="border-b border-slate-100 last:border-b-0 align-top"
                    >
                      <td className="px-5 sm:px-6 py-4 text-slate-900 font-medium">
                        {item}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-slate-600">
                        {included}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SoftCard>
        </Section>

        {/* ── Section 2: Investment ── */}
        <Section number="02" title="Investment">
          <SoftCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-[15px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700 w-1/2">
                      Item
                    </th>
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700 w-1/2">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {INVESTMENT.map(({ item, amount }) => (
                    <tr
                      key={item}
                      className="border-b border-slate-100 last:border-b-0 align-top"
                    >
                      <td className="px-5 sm:px-6 py-4 text-slate-900 font-medium">
                        {item}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-slate-700 tabular-nums">
                        {amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SoftCard>
          <p className="mt-5 text-sm text-slate-600 leading-relaxed">
            Google ad spend is paid directly by Cobuild to Google. It does not
            pass through DirectBuild.
          </p>
        </Section>

        {/* ── Section 3: Qualified vs not qualified ── */}
        <Section number="03" title="What counts as a qualified lead">
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            <SoftCard>
              <SectionEyebrow tone="positive">Qualified lead</SectionEyebrow>
              <ul className="mt-5 space-y-3">
                {QUALIFIED.map((line) => (
                  <BulletItem key={line} tone="positive">
                    {line}
                  </BulletItem>
                ))}
              </ul>
            </SoftCard>
            <SoftCard>
              <SectionEyebrow tone="muted">Not counted as qualified</SectionEyebrow>
              <ul className="mt-5 space-y-3">
                {NOT_QUALIFIED.map((line) => (
                  <BulletItem key={line} tone="muted">
                    {line}
                  </BulletItem>
                ))}
              </ul>
            </SoftCard>
          </div>

          <p className="mt-6 text-sm sm:text-[15px] text-slate-700 leading-relaxed">
            Ideal range starts from $70,000+. Larger opportunities can be
            assessed case by case based on client type, paperwork, and project
            complexity.
          </p>

          <aside className="mt-5 rounded-xl border-l-4 border-orange-safety bg-orange-safety/5 px-5 sm:px-6 py-4">
            <p className="text-base sm:text-[17px] leading-[1.55] text-slate-900">
              Commercial fitout leads generated from this campaign are exclusive
              to Cobuild and will not be sent to other builders.
            </p>
          </aside>
        </Section>

        {/* ── Section 4: Pilot de-risk ── */}
        <Section number="04" title="Pilot de-risk">
          <SoftCard className="space-y-5">
            <p className="text-base sm:text-[17px] leading-[1.55] text-slate-900">
              If the campaign does not generate at least 3 qualified commercial
              fitout opportunities in the first 30 days, DirectBuild will
              continue campaign management and optimisation at no extra
              management fee until those 3 qualified opportunities are
              delivered.
            </p>
            <p className="text-base sm:text-[17px] leading-[1.55] text-slate-700">
              Cobuild would only continue covering Google ad spend directly.
            </p>
          </SoftCard>
        </Section>

        {/* ── Section 5: Projected upside ── */}
        <Section number="05" title="Projected upside based on Cobuild’s numbers">
          <p className="text-sm font-medium text-slate-500 italic">
            Projection only. Not a guarantee.
          </p>

          <SoftCard padding="none" className="mt-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-[15px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700 w-1/2">
                      Metric
                    </th>
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700 w-1/2">
                      Estimate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PROJECTION_INPUTS.map(({ metric, estimate }) => (
                    <tr
                      key={metric}
                      className="border-b border-slate-100 last:border-b-0 align-top"
                    >
                      <td className="px-5 sm:px-6 py-4 text-slate-900 font-medium">
                        {metric}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-slate-700 tabular-nums">
                        {estimate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SoftCard>

          <p className="mt-8 text-sm sm:text-[15px] text-slate-700">
            If 10 qualified opportunities are generated and Cobuild closes at
            the discussed rate:
          </p>

          <SoftCard padding="none" className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-[15px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700">
                      Result
                    </th>
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700">
                      Low estimate
                    </th>
                    <th className="px-5 sm:px-6 py-4 font-semibold text-slate-700">
                      High estimate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PROJECTION_OUTCOME.map(({ result, low, high }) => (
                    <tr
                      key={result}
                      className="border-b border-slate-100 last:border-b-0 align-top"
                    >
                      <td className="px-5 sm:px-6 py-4 text-slate-900 font-medium">
                        {result}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-slate-700 tabular-nums">
                        {low}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-slate-700 tabular-nums">
                        {high}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SoftCard>

          <p className="mt-6 text-sm sm:text-[15px] text-slate-700 leading-relaxed">
            The campaign does not need high volume to make sense. One accepted
            commercial fitout job can justify the pilot many times over.
          </p>
        </Section>

        {/* ── Section 6: Next steps ── */}
        <Section number="06" title="Next steps">
          <ol className="space-y-3 list-none">
            {NEXT_STEPS.map((line, i) => (
              <li key={line} className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-safety/10 text-orange-safety text-xs font-semibold tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-base sm:text-[17px] text-slate-900 leading-[1.55] pt-1">
                  {line}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Footer ── */}
        <footer className="mt-20 pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono uppercase tracking-[0.16em] text-slate-500">
          <span>DirectBuild · Sydney</span>
          <span>Quote · Cobuild Constructions</span>
        </footer>
      </article>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="26"
        height="26"
        viewBox="0 0 32 32"
        fill="none"
        className="shrink-0"
        aria-hidden
      >
        <rect
          x="4"
          y="14"
          width="24"
          height="16"
          rx="2"
          stroke="#FF8C00"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M2 16L16 4L30 16"
          stroke="#FF8C00"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect
          x="13"
          y="20"
          width="6"
          height="10"
          rx="1"
          stroke="#FF8C00"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <span className="text-sm font-semibold tracking-tight">
        <span className="text-orange-safety">direct</span>
        <span className="text-slate-900">build</span>
      </span>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 sm:mt-16">
      <div className="flex items-baseline gap-4 mb-6">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-orange-safety tabular-nums">
          {number}
        </span>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-slate-900">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function SoftCard({
  children,
  className = "",
  padding = "default",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "default" | "none";
}) {
  const padClass =
    padding === "none" ? "" : "p-5 sm:p-6 lg:p-7";
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] ${padClass} ${className}`}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "positive" | "muted";
}) {
  const colour =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "muted"
        ? "text-slate-500"
        : "text-orange-safety";
  return (
    <p
      className={`text-[11px] font-mono uppercase tracking-[0.2em] font-medium ${colour}`}
    >
      {children}
    </p>
  );
}

function BulletItem({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "positive" | "muted";
}) {
  const dot =
    tone === "positive"
      ? "bg-emerald-500"
      : tone === "muted"
        ? "bg-slate-300"
        : "bg-orange-safety";
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
        aria-hidden
      />
      <span className="text-base sm:text-[17px] text-slate-900 leading-[1.55]">
        {children}
      </span>
    </li>
  );
}
