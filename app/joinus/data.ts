// Shared content for /joinus (live) and /sandbox/joinus (preview).
// Pure data. No imports. Easy to tweak copy without touching components.

export type LogoEntry =
  | {
      name: string;
      src: string;
      alt: string;
      imageClassName?: string;
    }
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
  {
    name: "SimpliSolar",
    src: "/logos/joinus/simplisolar.png",
    alt: "SimpliSolar",
    imageClassName: "scale-[4.1] sm:scale-[4.35]",
  },
  {
    name: "Ferguson’s Landscapes",
    src: "/logos/joinus/fergusons-landscapes.png",
    alt: "Ferguson’s Landscapes",
    imageClassName: "scale-[2.25] sm:scale-[2.4]",
  },
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
    body: "We’re not selling generic retainers before checking whether the trade, area, and job economics can support a real test.",
  },
  {
    title: "Area fit before intake",
    body: "We look at local signals, visible competitors, job value, capacity, and response speed before deciding whether DirectBuild can help.",
  },
  {
    title: "Limited by trade and area",
    body: "We only review selected tradies in postcodes where DirectBuild can realistically support demand. No saturating areas.",
  },
  {
    title: "Homeowner-ready enquiries",
    body: "When there is a fit, the goal is quote-ready homeowner opportunities your team can respond to quickly.",
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
    title: "Submit your area",
    body: "Share your trade, service area, capacity, and job economics so we can run an Area Fit Check.",
  },
  {
    step: "02",
    title: "Check the signals",
    body: "We review local upgrade activity, property movement, competitor visibility, and business readiness.",
  },
  {
    step: "03",
    title: "Decide fit",
    body: "If the trade and area look testable, we discuss a measured homeowner enquiry test.",
  },
  {
    step: "04",
    title: "Run carefully",
    body: "Approved partners are added selectively, with no area saturation and no guaranteed-job promises.",
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
