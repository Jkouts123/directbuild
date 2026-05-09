"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  Check,
  ClipboardText,
  EnvelopeSimple,
  FileText,
  Hammer,
  HardHat,
  House,
  Info,
  MagnifyingGlass,
  MapPin,
  Phone,
  Question,
  Sparkle,
  SquaresFour,
  Stack,
  Sun,
  Upload,
  User,
  Warning,
  X,
} from "@phosphor-icons/react";
import PhoneVerify from "../components/PhoneVerify";
import { OTP_VERIFICATION_ENABLED } from "@/lib/feature-flags";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PhosphorIcon = typeof Hammer;

type BranchKey =
  | "deck"
  | "pergola"
  | "screen"
  | "cladding"
  | "fitout"
  | "framing"
  | "builder"
  | "unsure";

type StepKind =
  | "single"
  | "multi"
  | "text"
  | "textarea"
  | "photos"
  | "contact"
  | "suburb";

type Step = {
  id: string;
  kind: StepKind;
  title: string;
  hint?: string;
  options?: string[];
  placeholder?: string;
  optional?: boolean;
};

type ContactValue = { name: string; phone: string; email: string };
type SuburbEntry = { suburb: string; state: string; postcode: string };

type AnswerValue =
  | string
  | string[]
  | File[]
  | ContactValue
  | SuburbEntry
  | undefined;
type AnswerMap = Record<string, AnswerValue>;

type Confidence = "low" | "medium" | "manual";

type QuoteResult = {
  range_low: number | null;
  range_high: number | null;
  display_range: string;
  confidence: Confidence;
  summary: string;
  cost_drivers: string[];
  warnings: string[];
  next_step: string;
};

type ProjectType = { id: BranchKey; label: string; icon: PhosphorIcon };

// ─────────────────────────────────────────────────────────────────────────────
// Project type entry options
// ─────────────────────────────────────────────────────────────────────────────

const PROJECT_TYPES: ProjectType[] = [
  { id: "deck", label: "Deck or outdoor entertaining area", icon: Stack },
  { id: "pergola", label: "Pergola / covered outdoor area", icon: Sun },
  { id: "screen", label: "Timber screen or feature wall", icon: SquaresFour },
  { id: "cladding", label: "Cladding / facade upgrade", icon: Buildings },
  { id: "fitout", label: "Internal fit-out / feature room", icon: House },
  { id: "framing", label: "Framing or renovation carpentry", icon: Hammer },
  { id: "builder", label: "I'm a builder looking for a carpentry crew", icon: HardHat },
  { id: "unsure", label: "Not sure yet", icon: Question },
];

const PROJECT_TYPES_STEP: Step = {
  id: "__projectTypes",
  kind: "multi",
  title: "Select everything involved",
  hint: "Pick everything that's part of the project — we'll ask about each one.",
  options: PROJECT_TYPES.map((p) => p.label),
};

// ─────────────────────────────────────────────────────────────────────────────
// Branch-specific step definitions
// ─────────────────────────────────────────────────────────────────────────────

const BRANCH_STEPS: Record<BranchKey, Step[]> = {
  deck: [
    {
      id: "deck_size",
      kind: "single",
      title: "Deck — roughly how big?",
      options: [
        "Small deck",
        "Standard entertaining area",
        "Large deck / multi-zone",
        "Poolside or waterfront deck",
        "Not sure",
      ],
    },
    {
      id: "deck_complexity",
      kind: "single",
      title: "Deck — what's the build like?",
      options: [
        "Ground level",
        "Raised deck",
        "Around pool",
        "Waterfront / difficult site",
        "Not sure",
      ],
    },
    {
      id: "deck_finish",
      kind: "single",
      title: "Deck — material and finish?",
      options: [
        "Treated pine",
        "Hardwood",
        "Composite",
        "Premium / architectural finish",
        "Not sure",
      ],
    },
    {
      id: "deck_extras",
      kind: "multi",
      title: "Deck — anything to include?",
      hint: "Pick everything that might apply — optional.",
      optional: true,
      options: [
        "Stairs",
        "Glass / balustrade",
        "Lighting",
        "Built-in seating",
        "Privacy screen",
        "Existing structure removal",
      ],
    },
  ],
  pergola: [
    {
      id: "pergola_size",
      kind: "single",
      title: "Pergola — roughly how big?",
      options: [
        "Small cover",
        "Standard outdoor area",
        "Large entertaining area",
        "Multi-zone",
        "Not sure",
      ],
    },
    {
      id: "pergola_structure",
      kind: "single",
      title: "Pergola — structure type?",
      options: [
        "Attached to house",
        "Freestanding",
        "Over existing deck / paving",
        "New deck underneath",
        "Not sure",
      ],
    },
    {
      id: "pergola_roof",
      kind: "single",
      title: "Pergola — roof type?",
      options: [
        "Open pergola",
        "Polycarbonate / clear roof",
        "Metal roof",
        "Insulated roof",
        "Not sure",
      ],
    },
    {
      id: "pergola_extras",
      kind: "multi",
      title: "Pergola — anything to include?",
      hint: "Optional — pick everything that might apply.",
      optional: true,
      options: [
        "Lighting",
        "Fan",
        "Privacy screen",
        "Decking underneath",
        "Paving underneath",
        "Existing structure removal",
      ],
    },
  ],
  screen: [
    {
      id: "screen_location",
      kind: "single",
      title: "Screen / wall — where?",
      options: ["Outdoor", "Indoor", "Entry feature", "Boundary / privacy screen", "Not sure"],
    },
    {
      id: "screen_size",
      kind: "single",
      title: "Screen / wall — roughly how big?",
      options: [
        "Small feature",
        "Medium screen / wall",
        "Large screen / wall",
        "Multi-area",
        "Not sure",
      ],
    },
    {
      id: "screen_purpose",
      kind: "single",
      title: "Screen / wall — what's it for?",
      options: [
        "Privacy",
        "Decorative feature",
        "Fence / screen",
        "Entry feature",
        "Internal feature wall",
      ],
    },
    {
      id: "screen_finish",
      kind: "single",
      title: "Screen / wall — finish?",
      options: [
        "Simple battens",
        "Premium timber",
        "Painted finish",
        "Custom pattern",
        "Not sure",
      ],
    },
  ],
  cladding: [
    {
      id: "cladding_size",
      kind: "single",
      title: "Cladding — how much area?",
      options: [
        "Small feature area",
        "Front facade section",
        "Large wall / area",
        "Multiple areas",
        "Not sure",
      ],
    },
    {
      id: "cladding_material",
      kind: "single",
      title: "Cladding — material?",
      options: [
        "Timber cladding",
        "Composite cladding",
        "Fibre cement / architectural cladding",
        "Premium feature finish",
        "Not sure",
      ],
    },
    {
      id: "cladding_access",
      kind: "single",
      title: "Cladding — site access?",
      options: [
        "Ground level",
        "Single-storey height",
        "Two-storey height",
        "Difficult access",
        "Not sure",
      ],
    },
    {
      id: "cladding_existing",
      kind: "single",
      title: "Cladding — what's there now?",
      options: [
        "New build / framing ready",
        "Existing cladding to remove",
        "Brick / render surface",
        "Not sure",
      ],
    },
  ],
  fitout: [
    {
      id: "fitout_room",
      kind: "single",
      title: "Fit-out — what kind of room?",
      options: [
        "Living room",
        "Theatre / media room",
        "Bedroom / wardrobe",
        "Office / study",
        "Other feature room",
      ],
    },
    {
      id: "fitout_scope",
      kind: "single",
      title: "Fit-out — scope of the work?",
      options: [
        "Feature wall only",
        "Joinery / detailing",
        "Full room fit-out",
        "Multi-room upgrade",
        "Not sure",
      ],
    },
    {
      id: "fitout_finish",
      kind: "single",
      title: "Fit-out — finish level?",
      options: [
        "Standard",
        "Mid-range",
        "Premium",
        "Architectural / detail-heavy",
        "Not sure",
      ],
    },
    {
      id: "fitout_trades",
      kind: "multi",
      title: "Fit-out — other trades involved?",
      hint: "Optional — anything you'll need alongside carpentry.",
      optional: true,
      options: [
        "Electrical",
        "Lighting",
        "Acoustic treatment",
        "Painting",
        "Other trades",
        "Not sure",
      ],
    },
  ],
  framing: [
    {
      id: "framing_user",
      kind: "single",
      title: "Framing — what best describes you?",
      options: ["Homeowner", "Builder", "Architect / designer", "Project manager", "Other"],
    },
    {
      id: "framing_project",
      kind: "single",
      title: "Framing — project type?",
      options: ["Renovation", "Extension", "New build", "Commercial fit-out", "Other"],
    },
    {
      id: "framing_plans",
      kind: "single",
      title: "Framing — plans available?",
      options: ["Yes", "No", "In progress", "Not sure"],
    },
    {
      id: "framing_delivery",
      kind: "single",
      title: "Framing — how would you like it delivered?",
      options: ["Labour only", "Supply and install", "Need guidance", "Not sure"],
    },
    {
      id: "framing_size",
      kind: "single",
      title: "Framing — approximate project size?",
      options: [
        "Small job",
        "Medium renovation",
        "Large renovation / extension",
        "Ongoing crew support",
        "Not sure",
      ],
    },
  ],
  builder: [
    {
      id: "builder_company",
      kind: "text",
      title: "Crew — builder / company name?",
      placeholder: "Your company or trading name",
    },
    {
      id: "builder_project",
      kind: "single",
      title: "Crew — project type?",
      options: [
        "Renovation",
        "Extension",
        "New build",
        "Commercial fit-out",
        "Multi-site / ongoing work",
        "Other",
      ],
    },
    {
      id: "builder_location",
      kind: "text",
      title: "Crew — where is the project?",
      placeholder: "Suburb / address",
    },
    {
      id: "builder_start",
      kind: "single",
      title: "Crew — start date?",
      options: ["ASAP", "1–3 months", "3–6 months", "Flexible"],
    },
    {
      id: "builder_plans",
      kind: "single",
      title: "Crew — plans available?",
      options: ["Yes", "No", "In progress"],
    },
    {
      id: "builder_delivery",
      kind: "single",
      title: "Crew — delivery type?",
      options: ["Labour only", "Supply and install", "Need both options"],
    },
  ],
  unsure: [
    {
      id: "unsure_describe",
      kind: "single",
      title: "Not sure yet — what best describes it?",
      options: [
        "Outdoor upgrade",
        "Internal upgrade",
        "Facade / feature work",
        "Renovation support",
        "Builder / crew support",
        "Not sure",
      ],
    },
    {
      id: "unsure_idea",
      kind: "text",
      title: "Not sure yet — tell us the rough idea",
      placeholder: "E.g. \"new deck and pergola off the back of the house\"",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared final steps (asked at the end after every selected branch)
// ─────────────────────────────────────────────────────────────────────────────

const SHARED_STEPS: Step[] = [
  {
    id: "suburb",
    kind: "suburb",
    title: "Where is the project?",
    hint: "Choose the NSW suburb so the range can factor in local access, travel and project context.",
  },
  {
    id: "timeline",
    kind: "single",
    title: "When are you hoping to start?",
    options: ["ASAP", "1–3 months", "3–6 months", "Just researching"],
  },
  {
    id: "budget",
    kind: "single",
    title: "Rough budget you have in mind?",
    hint: "No commitment — just helps us match scope to expectations.",
    options: ["Under $10k", "$10k–$25k", "$25k–$50k", "$50k–$100k", "$100k+"],
  },
  {
    id: "notes",
    kind: "textarea",
    title: "Anything else we should know?",
    placeholder: "Optional — site quirks, deadlines, anything helpful.",
    optional: true,
  },
  {
    id: "photos",
    kind: "photos",
    title: "Add photos or plans (optional)",
    hint: "Photos help us understand access, condition and complexity. We'll keep them on this device for now.",
    optional: true,
  },
  {
    id: "contact",
    kind: "contact",
    title: "Last step before your range",
    hint: "Your details attach this range to your project and let us follow up if it looks like a fit. You'll see the ballpark range immediately after this step.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Quote bases per branch
// ─────────────────────────────────────────────────────────────────────────────

type QuoteBase = Omit<QuoteResult, "warnings">;

const QUOTE_BASE: Record<BranchKey, QuoteBase> = {
  deck: {
    range_low: 15000,
    range_high: 60000,
    display_range: "$15k – $60k+",
    confidence: "medium",
    summary:
      "Most Sydney deck builds land between $15k and $60k+, depending on size, height off the ground and material grade.",
    cost_drivers: [
      "Deck size and height off the ground",
      "Material grade (treated pine vs hardwood vs composite)",
      "Site access and footings",
      "Stairs, balustrade and lighting extras",
    ],
    next_step:
      "We'll review your details and connect you with a vetted Sydney carpentry team for a real quote — no obligation.",
  },
  pergola: {
    range_low: 12000,
    range_high: 70000,
    display_range: "$12k – $70k+",
    confidence: "medium",
    summary:
      "Pergola and covered outdoor builds typically range $12k–$70k+, depending on roof type, structure and finish.",
    cost_drivers: [
      "Cover size and span",
      "Roof type (open, polycarbonate, metal, insulated)",
      "Whether deck or paving sits underneath",
      "Site access and council requirements",
    ],
    next_step:
      "We'll review your details and connect you with a vetted Sydney carpentry team for a real quote.",
  },
  screen: {
    range_low: 5000,
    range_high: 35000,
    display_range: "$5k – $35k+",
    confidence: "medium",
    summary:
      "Timber screens and feature walls typically range $5k–$35k+, depending on size, material and detail.",
    cost_drivers: [
      "Length and height of the screen",
      "Material grade and finish",
      "Custom pattern fabrication",
      "Mounting and structural support",
    ],
    next_step:
      "We'll review your scope and respond with a tailored ballpark, or connect you with a Sydney carpentry team.",
  },
  cladding: {
    range_low: 8000,
    range_high: 50000,
    display_range: "$8k – $50k+",
    confidence: "medium",
    summary:
      "Facade and feature cladding typically lands between $8k and $50k+, depending on area, material and access.",
    cost_drivers: [
      "Wall area and storey count",
      "Material grade",
      "Existing surface and prep work",
      "Scaffolding and access",
    ],
    next_step:
      "We'll review your details and connect you with a Sydney carpentry team for a real cladding quote.",
  },
  fitout: {
    range_low: 20000,
    range_high: 150000,
    display_range: "$20k – $150k+",
    confidence: "low",
    summary:
      "Internal fit-outs and feature rooms vary widely — typically $20k–$150k+, depending on scope, joinery and finish level.",
    cost_drivers: [
      "Number of rooms and total scope",
      "Joinery, built-ins and detailing level",
      "Finish tier (standard → architectural)",
      "Coordination with other trades",
    ],
    next_step:
      "We'll review your scope and connect you with a Sydney carpentry team for a real quote.",
  },
  framing: {
    range_low: null,
    range_high: null,
    display_range: "Reviewed manually — case by case",
    confidence: "manual",
    summary:
      "Framing and renovation carpentry varies a lot. We review the scope manually and come back with a tailored ballpark, usually within one business day.",
    cost_drivers: [
      "Engineering and council approvals",
      "Project size and complexity",
      "Renovation, extension or new build context",
      "Crew size and timeline",
    ],
    next_step:
      "We'll review your project details and respond with a tailored ballpark range, usually within one business day.",
  },
  builder: {
    range_low: null,
    range_high: null,
    display_range: "Manual review — crew matching",
    confidence: "manual",
    summary:
      "We manually match builders with available carpentry crews. We'll review your project, timeline and delivery preferences and come back with options.",
    cost_drivers: [
      "Crew size and labour duration",
      "Project type and timeline",
      "Plans availability",
      "Delivery preference (labour-only vs supply-and-install)",
    ],
    next_step:
      "We'll review your details and come back with crew options that match your project type and timeline.",
  },
  unsure: {
    range_low: null,
    range_high: null,
    display_range: "Manual review",
    confidence: "manual",
    summary:
      "We'll review your rough idea and come back with the right scope and ballpark range, usually within one business day.",
    cost_drivers: [
      "Type of work and final scope",
      "Site access and conditions",
      "Materials and finish ambition",
    ],
    next_step:
      "We'll review your idea and respond with a tailored scope and ballpark range, usually within one business day.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Quote builder — single + combined
// ─────────────────────────────────────────────────────────────────────────────

function formatK(amount: number): string {
  return `$${Math.round(amount / 1000)}k`;
}

function deriveContextWarnings(answers: AnswerMap): string[] {
  const warnings: string[] = [];

  const stringAnswers = (...keys: string[]): string[] =>
    keys
      .map((k) => answers[k])
      .filter((v): v is string => typeof v === "string");

  const arrAnswer = (key: string): string[] =>
    Array.isArray(answers[key]) ? (answers[key] as string[]) : [];

  const difficult = stringAnswers("deck_complexity", "cladding_access").some(
    (a) =>
      a.includes("Difficult") ||
      a.includes("Waterfront") ||
      a.includes("Two-storey"),
  );
  if (difficult) {
    warnings.push(
      "Difficult site access can add 15–25% to labour costs — we'll factor this in.",
    );
  }

  const premium = stringAnswers(
    "deck_finish",
    "fitout_finish",
    "cladding_material",
    "screen_finish",
  ).some((a) => a.includes("Premium") || a.includes("Architectural"));
  if (premium) {
    warnings.push(
      "Premium / architectural finishes typically push the project to the upper end of the range.",
    );
  }

  const demoMentioned =
    arrAnswer("deck_extras").includes("Existing structure removal") ||
    arrAnswer("pergola_extras").includes("Existing structure removal") ||
    answers.cladding_existing === "Existing cladding to remove";
  if (demoMentioned) {
    warnings.push(
      "Demolition adds time and waste removal — included in the range above.",
    );
  }

  return warnings;
}

function buildSingleBranchQuote(
  branch: BranchKey,
  answers: AnswerMap,
): QuoteResult {
  const base = QUOTE_BASE[branch];
  const warnings = deriveContextWarnings(answers);

  if (
    typeof answers.budget === "string" &&
    answers.budget === "Under $10k" &&
    base.range_low !== null &&
    base.range_low > 10000
  ) {
    warnings.push(
      "Your indicated budget is below typical project ranges in this category — scope may need to be reduced.",
    );
  }

  if (base.confidence === "low") {
    warnings.push(
      "Wide range — pricing varies meaningfully with scope, finish level and joinery detail.",
    );
  }

  if (base.confidence === "manual") {
    warnings.push(
      "We'll review your details manually and respond with a tailored ballpark, usually within one business day.",
    );
  }

  return { ...base, warnings };
}

function buildCombinedQuote(
  branchIds: BranchKey[],
  answers: AnswerMap,
): QuoteResult {
  let lowSum = 0;
  let highSum = 0;
  let hasNumeric = false;
  let hasManual = false;

  const driverSet = new Set<string>();
  const summaryParts: string[] = [];

  for (const id of branchIds) {
    const base = QUOTE_BASE[id];
    if (base.range_low !== null && base.range_high !== null) {
      lowSum += base.range_low;
      highSum += base.range_high;
      hasNumeric = true;
      summaryParts.push(`${labelFor(id)} (${base.display_range})`);
    } else {
      hasManual = true;
      summaryParts.push(`${labelFor(id)} — manual review`);
    }
    base.cost_drivers.forEach((d) => driverSet.add(d));
  }

  let display_range: string;
  let range_low: number | null;
  let range_high: number | null;
  let confidence: Confidence;

  if (hasNumeric && hasManual) {
    display_range = `From ${formatK(lowSum)}+ — manual review recommended`;
    range_low = lowSum;
    range_high = null;
    confidence = "manual";
  } else if (hasNumeric) {
    display_range = `${formatK(lowSum)} – ${formatK(highSum)}+`;
    range_low = lowSum;
    range_high = highSum;
    confidence = "low"; // wider envelope when stacked
  } else {
    display_range = "Manual review recommended";
    range_low = null;
    range_high = null;
    confidence = "manual";
  }

  const summary = `Your project combines ${summaryParts.join(
    ", ",
  )}. We've stacked the typical ranges so you can sanity-check the overall envelope before any site visit.`;

  const warnings = deriveContextWarnings(answers);

  if (
    typeof answers.budget === "string" &&
    answers.budget === "Under $10k" &&
    range_low !== null &&
    range_low > 10000
  ) {
    warnings.push(
      "Your indicated budget is below the combined ranges for these scopes — you may need to phase the work or trim scope.",
    );
  }

  if (confidence === "low") {
    warnings.push(
      "Combining multiple scopes widens the range — we'll tighten it once we see photos and confirm scope.",
    );
  }

  if (hasManual) {
    warnings.push(
      "One or more selected scopes need manual review — we'll come back with a tailored ballpark, usually within one business day.",
    );
  }

  const next_step = hasManual
    ? "We'll review your scope manually and respond with a tailored ballpark, usually within one business day."
    : "We'll review your details and connect you with a vetted Sydney carpentry team for a real quote.";

  return {
    range_low,
    range_high,
    display_range,
    confidence,
    summary,
    cost_drivers: Array.from(driverSet),
    warnings,
    next_step,
  };
}

function labelFor(id: BranchKey): string {
  return PROJECT_TYPES.find((p) => p.id === id)?.label ?? id;
}

function buildQuote(
  branchIds: BranchKey[],
  answers: AnswerMap,
): QuoteResult {
  if (branchIds.length === 1) {
    return buildSingleBranchQuote(branchIds[0], answers);
  }
  return buildCombinedQuote(branchIds, answers);
}

// Fire-and-forget POST to the server-side n8n webhook proxy.
// Failures are logged but never block the quote result UI.
async function sendLeadToWebhook(payload: unknown): Promise<void> {
  try {
    const res = await fetch("/api/clockworkcarpentry-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as unknown;
    // eslint-disable-next-line no-console
    console.log("Clockwork lead webhook result", json);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Clockwork lead webhook error", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function isSuburbEntry(v: AnswerValue): v is SuburbEntry {
  return (
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    "suburb" in (v as object) &&
    "state" in (v as object) &&
    "postcode" in (v as object)
  );
}

function isContactValue(v: AnswerValue): v is ContactValue {
  return (
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    "name" in (v as object) &&
    "phone" in (v as object) &&
    "email" in (v as object)
  );
}

function isStepAnswered(step: Step, answers: AnswerMap): boolean {
  if (step.optional) return true;
  const v = answers[step.id];
  switch (step.kind) {
    case "single":
      return typeof v === "string" && v.length > 0;
    case "multi":
      return Array.isArray(v) && (v as string[]).length > 0;
    case "text":
      return typeof v === "string" && v.trim().length > 0;
    case "textarea":
      return true;
    case "photos":
      return true;
    case "suburb":
      return isSuburbEntry(v);
    case "contact": {
      if (!isContactValue(v)) return false;
      return Boolean(
        v.name?.trim() &&
          v.phone?.trim() &&
          /\S+@\S+\.\S+/.test(v.email ?? ""),
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ClockworkCarpentryPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  // Pending submission (held while OTP overlay is open)
  const [pendingPayload, setPendingPayload] = useState<unknown | null>(null);
  const [pendingQuote, setPendingQuote] = useState<QuoteResult | null>(null);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);

  // ── derived: selected types (preserved in selection order) ───────────────

  const selectedTypes = useMemo<ProjectType[]>(() => {
    const labels = (answers[PROJECT_TYPES_STEP.id] as string[] | undefined) ?? [];
    const out: ProjectType[] = [];
    for (const label of labels) {
      const t = PROJECT_TYPES.find((p) => p.label === label);
      if (t) out.push(t);
    }
    return out;
  }, [answers]);

  const selectedTypeIds = useMemo<BranchKey[]>(
    () => selectedTypes.map((t) => t.id),
    [selectedTypes],
  );

  // ── flow: project types step → all selected branches' steps → shared ────

  const flow: Step[] = useMemo(() => {
    const steps: Step[] = [PROJECT_TYPES_STEP];
    if (selectedTypes.length === 0) return steps;
    for (const t of selectedTypes) {
      steps.push(...BRANCH_STEPS[t.id]);
    }
    steps.push(...SHARED_STEPS);
    return steps;
  }, [selectedTypes]);

  // Clamp stepIndex if flow shrinks (e.g. user goes back and unselects branches)
  useEffect(() => {
    if (stepIndex >= flow.length) {
      setStepIndex(Math.max(0, flow.length - 1));
    }
  }, [flow.length, stepIndex]);

  const totalDisplay = selectedTypes.length > 0 ? flow.length : 12;
  const progress = Math.min(100, ((stepIndex + 1) / totalDisplay) * 100);
  const currentStep: Step | undefined = flow[stepIndex];
  const isLastStep =
    selectedTypes.length > 0 && stepIndex === flow.length - 1;

  // ── handlers ─────────────────────────────────────────────────────────────

  const setAnswer = (key: string, value: AnswerValue) => {
    setAnswers((a) => ({ ...a, [key]: value }));
  };

  const handleToggleProjectType = (label: string) => {
    setAnswers((a) => {
      const existing = Array.isArray(a[PROJECT_TYPES_STEP.id])
        ? (a[PROJECT_TYPES_STEP.id] as string[])
        : [];
      const isAdding = !existing.includes(label);
      const next = isAdding
        ? [...existing, label]
        : existing.filter((x) => x !== label);

      // If unselecting, clear that branch's stale answers
      let cleaned: AnswerMap = a;
      if (!isAdding) {
        const removed = PROJECT_TYPES.find((p) => p.label === label);
        if (removed) {
          cleaned = { ...a };
          for (const s of BRANCH_STEPS[removed.id]) {
            delete cleaned[s.id];
          }
        }
      }
      return { ...cleaned, [PROJECT_TYPES_STEP.id]: next };
    });
  };

  const handleSingleSelect = (key: string, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    window.setTimeout(() => {
      setStepIndex((s) => s + 1);
    }, 180);
  };

  const handleMultiToggle = (key: string, value: string) => {
    setAnswers((a) => {
      const existing = Array.isArray(a[key]) ? (a[key] as string[]) : [];
      const next = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      return { ...a, [key]: next };
    });
  };

  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    setAnswers((a) => {
      const existing = Array.isArray(a.photos) ? (a.photos as File[]) : [];
      return { ...a, photos: [...existing, ...incoming] };
    });
  };

  const handleRemovePhoto = (index: number) => {
    setAnswers((a) => {
      const existing = Array.isArray(a.photos) ? (a.photos as File[]) : [];
      return { ...a, photos: existing.filter((_, i) => i !== index) };
    });
  };

  const handleContactChange = (
    field: keyof ContactValue,
    value: string,
  ) => {
    setAnswers((a) => {
      const existing = isContactValue(a.contact)
        ? a.contact
        : { name: "", phone: "", email: "" };
      return { ...a, contact: { ...existing, [field]: value } };
    });
  };

  // Build the submission payload + quote, but don't reveal the result yet.
  const buildSubmission = () => {
    const result = buildQuote(selectedTypeIds, answers);

    const photoFiles = Array.isArray(answers.photos)
      ? (answers.photos as File[])
      : [];

    const contact = isContactValue(answers.contact) ? answers.contact : null;
    const suburbEntry = isSuburbEntry(answers.suburb) ? answers.suburb : null;

    const {
      contact: _c,
      photos: _p,
      suburb: _s,
      [PROJECT_TYPES_STEP.id]: _pt,
      ...payloadAnswers
    } = answers;
    void _c;
    void _p;
    void _s;
    void _pt;

    const payload = {
      submitted_at: new Date().toISOString(),
      vertical: "carpentry",
      partner: "Clockwork Carpentry",
      source_page: "clockworkcarpentry",
      campaign_name: "clockwork_carpentry_pilot",
      selected_project_types: selectedTypes.map((t) => ({
        id: t.id,
        label: t.label,
      })),
      selected_project_type_ids: selectedTypeIds,
      suburb_entry: suburbEntry,
      contact,
      answers: payloadAnswers,
      photos: photoFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      quote_result: result,
    };

    return { payload, result };
  };

  const goNext = () => {
    if (!currentStep) return;
    if (!isStepAnswered(currentStep, answers)) return;
    if (stepIndex < flow.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }

    // Last step (contact) — generate
    if (selectedTypeIds.length === 0) return;
    const { payload, result } = buildSubmission();

    if (OTP_VERIFICATION_ENABLED) {
      // Hold the result; only reveal after verified.
      setPendingPayload(payload);
      setPendingQuote(result);
      setShowPhoneVerify(true);
    } else {
      // eslint-disable-next-line no-console
      console.log("[ClockworkCarpentry] submission payload:", payload);
      setQuote(result);
      // Fire-and-forget — show the quote regardless of webhook outcome.
      void sendLeadToWebhook(payload);
    }
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((s) => s - 1);
  };

  const handleOTPVerified = () => {
    if (pendingPayload && pendingQuote) {
      // eslint-disable-next-line no-console
      console.log(
        "[ClockworkCarpentry] submission payload (OTP verified):",
        pendingPayload,
      );
      setQuote(pendingQuote);
      // Fire-and-forget — show the quote regardless of webhook outcome.
      void sendLeadToWebhook(pendingPayload);
    }
    setShowPhoneVerify(false);
    setPendingPayload(null);
    setPendingQuote(null);
  };

  const handleOTPCancel = () => {
    // Return to contact step — keep all answers and contact details intact.
    setShowPhoneVerify(false);
    setPendingPayload(null);
    setPendingQuote(null);
  };

  const reset = () => {
    setStepIndex(0);
    setAnswers({});
    setQuote(null);
    setPendingPayload(null);
    setPendingQuote(null);
    setShowPhoneVerify(false);
  };

  // ── render ───────────────────────────────────────────────────────────────

  const contactValue = isContactValue(answers.contact)
    ? answers.contact
    : null;

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-30%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-orange-safety/[0.05] blur-[120px]" />
        <div className="absolute bottom-[-25%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-orange-safety/[0.025] blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 flex flex-col px-5 sm:px-8 pt-8 sm:pt-12 pb-8">
        {/* Top: brand label + step + progress */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-orange-safety">
              DirectBuild cost check
            </span>
            <span className="text-xs text-gray-text tabular-nums">
              {quote
                ? "Result"
                : selectedTypes.length > 0
                  ? `Step ${stepIndex + 1} of ${flow.length}`
                  : "Step 1"}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-gray-mid overflow-hidden">
            <motion.div
              className="h-full bg-orange-safety"
              initial={false}
              animate={{ width: quote ? "100%" : `${progress}%` }}
              transition={{ type: "spring", stiffness: 130, damping: 22 }}
            />
          </div>
        </div>

        {/* Step / result body */}
        <div className="flex-1">
          {quote ? (
            <ResultScreen
              selectedTypes={selectedTypes}
              quote={quote}
              onReset={reset}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${stepIndex}-${currentStep?.id ?? "root"}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                {stepIndex === 0 ? (
                  <ProjectTypesStep
                    selectedLabels={selectedTypes.map((t) => t.label)}
                    onToggle={handleToggleProjectType}
                  />
                ) : (
                  <DynamicStep
                    step={currentStep}
                    answers={answers}
                    onSingleSelect={handleSingleSelect}
                    onMultiToggle={handleMultiToggle}
                    onTextChange={(key, v) => setAnswer(key, v)}
                    onContactChange={handleContactChange}
                    onAddPhotos={handleAddPhotos}
                    onRemovePhoto={handleRemovePhoto}
                    onSuburbChange={(entry) =>
                      setAnswer("suburb", entry ?? undefined)
                    }
                    onEnter={goNext}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Bottom nav */}
        {!quote && (
          <div className="mt-8 flex items-center justify-between gap-3">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 rounded-lg bg-steel/20 px-5 min-h-[48px] text-sm font-semibold text-gray-text hover:text-white cursor-pointer"
              >
                <ArrowLeft size={16} weight="bold" />
                Back
              </button>
            ) : (
              <span aria-hidden />
            )}

            {currentStep && currentStep.kind !== "single" && (
              <button
                type="button"
                onClick={goNext}
                disabled={!isStepAnswered(currentStep, answers)}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-safety px-6 min-h-[48px] text-sm font-bold text-black-deep hover:bg-orange-hover cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-safety"
              >
                {isLastStep ? "Generate My Ballpark Range" : "Next"}
                <ArrowRight size={16} weight="bold" />
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-10 text-[11px] text-gray-text leading-relaxed">
          Ballpark guide only. Final pricing depends on site access, materials, engineering,
          approvals, finish level and final scope.
        </p>
      </div>

      {/* OTP overlay — gates the result reveal when enabled */}
      {showPhoneVerify && contactValue && (
        <PhoneVerify
          phone={contactValue.phone}
          onVerified={handleOTPVerified}
          onCancel={handleOTPCancel}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 0 — multi-select project types (with strong outcome headline)
// ─────────────────────────────────────────────────────────────────────────────

function ProjectTypesStep({
  selectedLabels,
  onToggle,
}: {
  selectedLabels: string[];
  onToggle: (label: string) => void;
}) {
  return (
    <div>
      <h1 className="text-[1.75rem] sm:text-[2.25rem] font-bold leading-[1.1] text-white">
        Get an Itemised Ballpark Quote Before You Speak to a Contractor
      </h1>
      <p className="mt-3 text-sm sm:text-base text-gray-text leading-relaxed max-w-[52ch]">
        Select what you&apos;re planning. We&apos;ll ask a few quick questions and give you a
        rough project range with the main cost drivers, likely scope items and what could
        push the price up.
      </p>

      <div className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            Select everything involved
          </h2>
          <span className="text-xs text-gray-text">
            {selectedLabels.length} selected
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-text">
          Pick all that apply — we&apos;ll ask about each one.
        </p>

        <ul className="mt-4 grid gap-2.5">
          {PROJECT_TYPES.map((opt) => {
            const isSelected = selectedLabels.includes(opt.label);
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => onToggle(opt.label)}
                  className={[
                    "group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors min-h-[60px] cursor-pointer",
                    isSelected
                      ? "border-2 border-orange-safety bg-orange-safety/10"
                      : "border border-gray-light bg-gray-mid hover:border-orange-safety/50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-orange-safety text-black-deep"
                        : "bg-orange-safety/10 text-orange-safety group-hover:bg-orange-safety/20",
                    ].join(" ")}
                  >
                    <opt.icon size={20} weight="duotone" />
                  </span>
                  <span className="flex-1 text-sm sm:text-base font-medium text-white">
                    {opt.label}
                  </span>
                  <span
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                      isSelected
                        ? "border-orange-safety bg-orange-safety text-black-deep"
                        : "border-gray-light bg-transparent text-transparent",
                    ].join(" ")}
                  >
                    <Check size={14} weight="bold" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic step renderer (steps 1+)
// ─────────────────────────────────────────────────────────────────────────────

function DynamicStep({
  step,
  answers,
  onSingleSelect,
  onMultiToggle,
  onTextChange,
  onContactChange,
  onAddPhotos,
  onRemovePhoto,
  onSuburbChange,
  onEnter,
}: {
  step: Step | undefined;
  answers: AnswerMap;
  onSingleSelect: (key: string, value: string) => void;
  onMultiToggle: (key: string, value: string) => void;
  onTextChange: (key: string, value: string) => void;
  onContactChange: (field: keyof ContactValue, value: string) => void;
  onAddPhotos: (files: FileList | null) => void;
  onRemovePhoto: (index: number) => void;
  onSuburbChange: (entry: SuburbEntry | null) => void;
  onEnter: () => void;
}) {
  if (!step) return null;

  return (
    <div>
      <StepHeader title={step.title} hint={step.hint} />

      {step.kind === "single" && step.options && (
        <SingleSelectStep
          stepId={step.id}
          options={step.options}
          value={answers[step.id] as string | undefined}
          onSelect={onSingleSelect}
        />
      )}

      {step.kind === "multi" && step.options && (
        <MultiSelectStep
          stepId={step.id}
          options={step.options}
          value={(answers[step.id] as string[] | undefined) ?? []}
          onToggle={onMultiToggle}
        />
      )}

      {step.kind === "text" && (
        <TextStep
          stepId={step.id}
          placeholder={step.placeholder ?? ""}
          value={(answers[step.id] as string | undefined) ?? ""}
          onChange={onTextChange}
          onEnter={onEnter}
        />
      )}

      {step.kind === "textarea" && (
        <TextareaStep
          stepId={step.id}
          placeholder={step.placeholder ?? ""}
          value={(answers[step.id] as string | undefined) ?? ""}
          onChange={onTextChange}
        />
      )}

      {step.kind === "photos" && (
        <PhotosStep
          files={(answers.photos as File[] | undefined) ?? []}
          onAdd={onAddPhotos}
          onRemove={onRemovePhoto}
        />
      )}

      {step.kind === "suburb" && (
        <NSWSuburbSearch
          value={
            isSuburbEntry(answers[step.id])
              ? (answers[step.id] as SuburbEntry)
              : undefined
          }
          onChange={onSuburbChange}
        />
      )}

      {step.kind === "contact" && (
        <ContactStep
          value={
            isContactValue(answers.contact)
              ? answers.contact
              : { name: "", phone: "", email: "" }
          }
          onChange={onContactChange}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step kind components
// ─────────────────────────────────────────────────────────────────────────────

function StepHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[1.75rem] sm:text-3xl font-bold leading-[1.1] text-white">
        {title}
      </h1>
      {hint && (
        <p className="mt-2 text-sm text-gray-text leading-relaxed max-w-[48ch]">
          {hint}
        </p>
      )}
    </div>
  );
}

function SingleSelectStep({
  stepId,
  options,
  value,
  onSelect,
}: {
  stepId: string;
  options: string[];
  value: string | undefined;
  onSelect: (stepId: string, value: string) => void;
}) {
  return (
    <ul className="grid gap-2.5">
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <li key={opt}>
            <button
              type="button"
              onClick={() => onSelect(stepId, opt)}
              className={[
                "group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors min-h-[56px] cursor-pointer",
                isSelected
                  ? "border-2 border-orange-safety bg-orange-safety/10"
                  : "border border-gray-light bg-gray-mid hover:border-orange-safety/50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isSelected
                    ? "border-orange-safety bg-orange-safety text-black-deep"
                    : "border-gray-light bg-transparent text-transparent",
                ].join(" ")}
              >
                <Check size={14} weight="bold" />
              </span>
              <span className="flex-1 text-sm sm:text-base font-medium text-white">
                {opt}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MultiSelectStep({
  stepId,
  options,
  value,
  onToggle,
}: {
  stepId: string;
  options: string[];
  value: string[];
  onToggle: (stepId: string, value: string) => void;
}) {
  return (
    <ul className="grid gap-2.5">
      {options.map((opt) => {
        const isSelected = value.includes(opt);
        return (
          <li key={opt}>
            <button
              type="button"
              onClick={() => onToggle(stepId, opt)}
              className={[
                "group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors min-h-[56px] cursor-pointer",
                isSelected
                  ? "border-2 border-orange-safety bg-orange-safety/10"
                  : "border border-gray-light bg-gray-mid hover:border-orange-safety/50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                  isSelected
                    ? "border-orange-safety bg-orange-safety text-black-deep"
                    : "border-gray-light bg-transparent text-transparent",
                ].join(" ")}
              >
                <Check size={14} weight="bold" />
              </span>
              <span className="flex-1 text-sm sm:text-base font-medium text-white">
                {opt}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function TextStep({
  stepId,
  placeholder,
  value,
  onChange,
  onEnter,
}: {
  stepId: string;
  placeholder: string;
  value: string;
  onChange: (key: string, value: string) => void;
  onEnter: () => void;
}) {
  return (
    <div className="relative">
      <MapPin
        size={18}
        weight="duotone"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text"
      />
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(stepId, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-light bg-gray-mid pl-11 pr-4 py-4 text-base text-white placeholder:text-gray-text focus:border-orange-safety focus:bg-gray-mid outline-none min-h-[56px]"
      />
    </div>
  );
}

function TextareaStep({
  stepId,
  placeholder,
  value,
  onChange,
}: {
  stepId: string;
  placeholder: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(stepId, e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-xl border border-gray-light bg-gray-mid px-4 py-3.5 text-base text-white placeholder:text-gray-text focus:border-orange-safety outline-none resize-none"
      />
    </div>
  );
}

function PhotosStep({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-orange-safety/40 bg-orange-safety/5 px-6 min-h-[96px] text-base font-semibold text-orange-safety hover:border-orange-safety hover:bg-orange-safety/10 cursor-pointer"
      >
        <Upload size={22} weight="duotone" />
        <span>Click to add photos or plans</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onAdd(e.target.files)}
      />

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-gray-light bg-gray-mid px-3 py-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-safety/10 text-orange-safety">
                <FileText size={18} weight="duotone" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white truncate">{f.name}</div>
                <div className="text-xs text-gray-text">
                  {(f.size / 1024).toFixed(0)} KB · {f.type || "file"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-text hover:text-white hover:bg-gray-light/40 cursor-pointer"
                aria-label={`Remove ${f.name}`}
              >
                <X size={16} weight="bold" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-gray-text">
        <Info size={14} weight="duotone" className="mt-0.5 shrink-0" />
        <span>
          Files stay on this device for now — we don&apos;t upload them yet. You can also send
          photos through later if easier.
        </span>
      </p>
    </div>
  );
}

function ContactStep({
  value,
  onChange,
}: {
  value: ContactValue;
  onChange: (field: keyof ContactValue, value: string) => void;
}) {
  const fields: {
    field: keyof ContactValue;
    label: string;
    placeholder: string;
    type: string;
    icon: PhosphorIcon;
  }[] = [
    { field: "name", label: "Full name", placeholder: "Jane Smith", type: "text", icon: User },
    { field: "phone", label: "Phone", placeholder: "04xx xxx xxx", type: "tel", icon: Phone },
    {
      field: "email",
      label: "Email",
      placeholder: "you@email.com",
      type: "email",
      icon: EnvelopeSimple,
    },
  ];

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.field}>
          <label className="block text-xs font-medium text-gray-text mb-1.5">
            {f.label}
          </label>
          <div className="relative">
            <f.icon
              size={16}
              weight="duotone"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-text"
            />
            <input
              type={f.type}
              value={value[f.field]}
              onChange={(e) => onChange(f.field, e.target.value)}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-gray-light bg-gray-mid pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety outline-none min-h-[48px]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NSW Suburb Search (local component, no shared component imported)
// ─────────────────────────────────────────────────────────────────────────────

function NSWSuburbSearch({
  value,
  onChange,
}: {
  value: SuburbEntry | undefined;
  onChange: (entry: SuburbEntry | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [allNSW, setAllNSW] = useState<SuburbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/australian-suburbs.json")
      .then((r) => r.json())
      .then((all: SuburbEntry[]) => {
        if (cancelled) return;
        setAllNSW(all.filter((e) => e.state === "NSW"));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    return allNSW
      .filter(
        (e) =>
          e.suburb.toLowerCase().includes(q) ||
          e.postcode.includes(q),
      )
      .slice(0, 20);
  }, [query, allNSW]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-orange-safety bg-orange-safety/10 px-4 py-3.5 min-h-[56px]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-safety text-black-deep">
          <MapPin size={18} weight="duotone" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-orange-safety">
            Selected
          </div>
          <div className="mt-0.5 text-sm sm:text-base font-medium text-white truncate">
            {value.suburb}, {value.state} {value.postcode}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
            setShowResults(false);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-text hover:text-white hover:bg-gray-light/40 cursor-pointer"
          aria-label="Clear selected suburb"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlass
          size={18}
          weight="duotone"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text"
        />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={
            loading ? "Loading NSW suburbs…" : "Search NSW suburb or postcode"
          }
          className="w-full rounded-xl border border-gray-light bg-gray-mid pl-11 pr-4 py-4 text-base text-white placeholder:text-gray-text focus:border-orange-safety outline-none min-h-[56px]"
        />
      </div>

      {showResults && query.trim().length > 0 && (
        <ul className="mt-2 max-h-72 overflow-auto rounded-xl border border-gray-light bg-gray-mid shadow-brand">
          {loading ? (
            <li className="px-4 py-3 text-sm text-gray-text">
              Loading NSW suburbs…
            </li>
          ) : results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-text">
              No NSW suburbs match &ldquo;{query}&rdquo;.
            </li>
          ) : (
            results.map((e, i) => (
              <li key={`${e.suburb}-${e.postcode}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(e);
                    setShowResults(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-light/40 cursor-pointer"
                >
                  <MapPin
                    size={16}
                    weight="duotone"
                    className="shrink-0 text-orange-safety"
                  />
                  <span className="flex-1 text-sm text-white truncate">
                    {e.suburb}
                    <span className="text-gray-text">
                      {" "}
                      · NSW {e.postcode}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Result screen
// ─────────────────────────────────────────────────────────────────────────────

function ResultScreen({
  selectedTypes,
  quote,
  onReset,
}: {
  selectedTypes: ProjectType[];
  quote: QuoteResult;
  onReset: () => void;
}) {
  const HeaderIcon = selectedTypes[0]?.icon ?? Sparkle;
  const headerLabel =
    selectedTypes.length === 0
      ? "Project"
      : selectedTypes.length === 1
        ? selectedTypes[0].label
        : `${selectedTypes.length} scopes combined`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-safety text-black-deep">
          <HeaderIcon size={20} weight="duotone" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-orange-safety">
            Your preliminary project range
          </div>
          <div className="mt-0.5 text-sm font-medium text-white truncate">
            {headerLabel}
          </div>
        </div>
      </div>

      {/* Selected type chips when combined */}
      {selectedTypes.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {selectedTypes.map((t) => (
            <li
              key={t.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-light bg-gray-mid/60 px-2.5 py-1 text-[11px] font-medium text-white"
            >
              <t.icon size={12} weight="duotone" className="text-orange-safety" />
              {t.label}
            </li>
          ))}
        </ul>
      )}

      {/* Range card */}
      <div className="mt-5 rounded-2xl border border-orange-safety/30 bg-orange-safety/[0.07] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-orange-safety">
            Estimated range
          </div>
          <ConfidenceBadge confidence={quote.confidence} />
        </div>
        <div className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white">
          {quote.display_range}
        </div>
        <p className="mt-3 text-sm text-gray-text leading-relaxed">{quote.summary}</p>
      </div>

      {/* Cost drivers */}
      <div className="mt-5 rounded-2xl border border-gray-light bg-gray-mid/60 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <ClipboardText size={16} weight="duotone" className="text-orange-safety" />
          Likely scope and cost drivers
        </div>
        <ul className="mt-3 space-y-2">
          {quote.cost_drivers.map((d) => (
            <li key={d} className="flex gap-2 text-sm text-gray-text leading-relaxed">
              <Check
                size={14}
                weight="bold"
                className="mt-1 shrink-0 text-orange-safety"
              />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Warnings */}
      {quote.warnings.length > 0 && (
        <div className="mt-5 rounded-2xl border border-orange-safety/25 bg-orange-safety/[0.04] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Warning size={16} weight="duotone" className="text-orange-safety" />
            Things to factor in
          </div>
          <ul className="mt-3 space-y-2">
            {quote.warnings.map((w) => (
              <li key={w} className="text-sm text-gray-text leading-relaxed">
                • {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next step */}
      <div className="mt-5 rounded-2xl border border-gray-light bg-gray-dark/60 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <ArrowRight size={16} weight="bold" className="text-orange-safety" />
          What happens next
        </div>
        <p className="mt-2 text-sm text-gray-text leading-relaxed">{quote.next_step}</p>
      </div>

      {/* Disclaimer */}
      <p className="mt-5 text-xs text-gray-text leading-relaxed">
        This is a rough range, not a fixed quote. Final pricing depends on site access,
        materials, engineering, approvals, finish level and final scope.
      </p>

      {/* Reset */}
      <div className="mt-6">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg bg-steel/20 px-5 min-h-[48px] text-sm font-semibold text-gray-text hover:text-white cursor-pointer"
        >
          <ArrowLeft size={16} weight="bold" />
          Start over
        </button>
      </div>
    </motion.div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const map: Record<Confidence, { label: string; className: string }> = {
    medium: {
      label: "Medium confidence",
      className: "border-orange-safety/30 bg-orange-safety/10 text-orange-safety",
    },
    low: {
      label: "Wide range",
      className: "border-orange-safety/20 bg-orange-safety/5 text-orange-safety",
    },
    manual: {
      label: "Manual review",
      className: "border-gray-light bg-gray-mid text-gray-text",
    },
  };
  const cfg = map[confidence];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
        cfg.className,
      ].join(" ")}
    >
      {cfg.label}
    </span>
  );
}
