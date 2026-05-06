// Sandbox-only content for /sandbox/joinus.
// Pure data. No imports. Easy to tweak copy without touching components.

export type LogoEntry =
  | { name: string; src: string; alt: string }
  | { name: string; wordmark: true };

export const LOGOS: LogoEntry[] = [
  {
    name: "Clockwork Carpentry",
    src: "/logos/joinus/clockwork-carpentry.png",
    alt: "Clockwork Carpentry",
  },
  {
    name: "Cobuild Constructions",
    src: "/logos/joinus/cobuild-constructions.png",
    alt: "Cobuild Constructions",
  },
  {
    name: "GoldClass Solutions",
    src: "/logos/joinus/goldclass-solutions.jpg",
    alt: "GoldClass Solutions",
  },
  {
    name: "Gorun Solar",
    src: "/logos/joinus/gorun-solar.png",
    alt: "Gorun Solar",
  },
  {
    name: "Innovative Landscapes",
    src: "/logos/joinus/innovative-landscapes.jpg",
    alt: "Innovative Landscapes",
  },
  // PDF-only assets — render as wordmark until usable raster is provided.
  { name: "SimpliSolar", wordmark: true },
  { name: "Ferguson’s Landscapes", wordmark: true },
];

export const PROOF_STATS: { label: string; value: string }[] = [
  { label: "Selected trades per area", value: "1–3" },
  { label: "First-week partner wins", value: "$18k – $20k" },
  { label: "Reported job values", value: "$3k – $100k" },
  { label: "Response-speed requirement", value: "< 24h" },
];

export const WHY_POINTS: { title: string; body: string }[] = [
  {
    title: "No retainer treadmill",
    body: "We’re not selling generic retainers and vague monthly reports. The model only works if real homeowner work proceeds.",
  },
  {
    title: "Built around proceeded work",
    body: "We care whether enquiries turn into real jobs — not clicks, impressions, or vanity dashboards.",
  },
  {
    title: "Limited by trade and area",
    body: "We only review selected tradies in postcodes where DirectBuild can realistically support demand. No saturating areas.",
  },
  {
    title: "Homeowner-ready enquiries",
    body: "We qualify private homeowner interest before sending anything through, so your team isn’t burning hours on tyre-kickers.",
  },
];

export type CaseStudy = {
  index: string;
  business: string;
  location?: string;
  trade: string;
  outcome: string;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    index: "01",
    business: "Clockwork Carpentry",
    location: "Sydney",
    trade: "Carpentry",
    outcome:
      "Closed an $18,000 carpentry job within the first week of running with DirectBuild.",
  },
  {
    index: "02",
    business: "Gorun Solar",
    location: "Brisbane",
    trade: "Solar",
    outcome:
      "Closed a $20,000 solar job within the first week of running with DirectBuild.",
  },
  {
    index: "03",
    business: "Ferguson’s Landscapes",
    trade: "Landscaping",
    outcome:
      "Currently progressing a potential $100,000 full-turnkey landscaping job generated through DirectBuild campaigns.",
  },
  {
    index: "04",
    business: "Innovative Landscapes",
    location: "Wollongong",
    trade: "Landscaping",
    outcome:
      "Closed a $14,000 landscaping job on the first day of running with DirectBuild.",
  },
  {
    index: "05",
    business: "GoldClass Solutions",
    location: "Dubbo",
    trade: "Multi-trade",
    outcome:
      "Closed a $3,000 job on the first day of running with DirectBuild.",
  },
  {
    index: "06",
    business: "SimpliSolar",
    location: "Western Sydney",
    trade: "Solar",
    outcome:
      "Closed a $19,000 solar job on the first day of running with DirectBuild.",
  },
];

export const HOW_IT_WORKS: { step: string; title: string; body: string }[] = [
  {
    step: "01",
    title: "Apply",
    body: "Submit your trade, service area, capacity, and a few business details. Five minutes.",
  },
  {
    step: "02",
    title: "Review",
    body: "We review whether your trade and service area are open for current DirectBuild intake.",
  },
  {
    step: "03",
    title: "Match",
    body: "If there’s a fit, we discuss how DirectBuild can help generate and track homeowner opportunities for you.",
  },
  {
    step: "04",
    title: "Run",
    body: "Approved partners are added to the priority pool for relevant homeowner work in their area.",
  },
];

export const TRADE_OPTIONS = [
  "Solar",
  "HVAC",
  "Landscaping",
  "Roofing",
  "Carpentry",
  "Granny flats",
  "Multi-trade",
  "Other",
];

export const JOB_VALUE_OPTIONS = [
  "Under $5,000",
  "$5,000 – $20,000",
  "$20,000 – $50,000",
  "$50,000 – $100,000",
  "$100,000+",
];

export const CAPACITY_OPTIONS = ["1–2", "3–5", "6–9", "10+"];

export const RESPONSE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
