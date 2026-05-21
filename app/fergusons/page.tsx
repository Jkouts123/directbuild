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
  ImageSquare,
  Info,
  ListChecks,
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
import dynamic from "next/dynamic";
import Script from "next/script";
import { OTP_VERIFICATION_ENABLED } from "@/lib/feature-flags";
import {
  getSupabaseBrowserClient,
  getSupabasePhotoBucket,
} from "@/lib/supabase-browser";

const PhoneVerify = dynamic(() => import("../components/PhoneVerify"), {
  ssr: false,
});

const FERGUSONS_META_PIXEL_ID = "1219015826809496";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PhosphorIcon = typeof Hammer;

type BranchKey =
  | "backyard"
  | "turf"
  | "paving"
  | "retaining"
  | "planting"
  | "poolside"
  | "drainage"
  | "frontyard"
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

type StepImageMap = Record<string, { src: string; alt?: string }>;

type Step = {
  id: string;
  kind: StepKind;
  title: string;
  hint?: string;
  options?: string[];
  images?: StepImageMap;
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

type UploadedPhoto = {
  name: string;
  size: number;
  type: string;
  storage_path: string;
  public_url: string;
};

type Confidence = "low" | "medium" | "manual";

type ItemisedLine = { label: string; amount: number; note: string };

type QuoteResult = {
  range_low: number | null;
  range_high: number | null;
  display_range: string;
  midpoint: number | null;
  currency: "AUD";
  itemised_breakdown: ItemisedLine[];
  confidence: Confidence;
  summary: string;
  cost_drivers: string[];
  warnings: string[];
  next_step: string;
};

type ProjectType = {
  id: BranchKey;
  label: string;
  icon: PhosphorIcon;
  imageSrc?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Project type entry options
// ─────────────────────────────────────────────────────────────────────────────

const PROJECT_TYPES: ProjectType[] = [
  {
    id: "backyard",
    label: "Full backyard transformation",
    icon: House,
  },
  {
    id: "turf",
    label: "New lawn / turf installation",
    icon: Sparkle,
  },
  {
    id: "paving",
    label: "Paving / outdoor entertaining area",
    icon: Stack,
  },
  {
    id: "retaining",
    label: "Retaining wall",
    icon: SquaresFour,
  },
  {
    id: "planting",
    label: "Garden makeover / planting",
    icon: Sun,
  },
  {
    id: "poolside",
    label: "Poolside landscaping",
    icon: Sparkle,
  },
  {
    id: "drainage",
    label: "Drainage / site preparation",
    icon: Hammer,
  },
  {
    id: "frontyard",
    label: "Front yard / street appeal",
    icon: Buildings,
  },
  {
    id: "builder",
    label: "I'm a builder looking for landscaping support",
    icon: HardHat,
  },
  {
    id: "unsure",
    label: "Not sure yet",
    icon: Question,
  },
];

const PROJECT_TYPES_STEP: Step = {
  id: "__projectTypes",
  kind: "multi",
  title: "Select what you want priced now",
  hint: "Choose the main work for this stage. You can separate future ideas later.",
  options: PROJECT_TYPES.map((p) => p.label),
};

const QUALIFICATION_STEPS: Step[] = [
  {
    id: "project_intent",
    kind: "single",
    title: "What best describes what you’re trying to do?",
    options: [
      "Basic landscaping to finish the build / help with OC",
      "Street appeal and front entry presentation",
      "Practical backyard refresh",
      "Outdoor entertaining / poolside upgrade",
      "Full front and backyard transformation",
      "Not sure yet",
    ],
  },
  {
    id: "delivery_intent",
    kind: "single",
    title: "How are you planning to handle the work?",
    options: [
      "I want a landscaper to handle the full job",
      "I want help with the harder parts only",
      "I’m comparing quotes",
      "I’m likely to DIY or stage parts myself",
      "Not sure yet",
    ],
  },
  {
    id: "budget_expectation",
    kind: "single",
    title: "What range are you expecting this project might sit in?",
    options: [
      "Under $15k",
      "$15k-$30k",
      "$30k-$60k",
      "$60k-$100k",
      "$100k+",
      "I have no idea",
    ],
  },
  {
    id: "existing_quote_range",
    kind: "single",
    title: "Have you already received any quotes?",
    options: [
      "No quotes yet",
      "Yes, under $30k",
      "Yes, $30k-$60k",
      "Yes, $60k+",
      "Yes, but they felt too high",
    ],
  },
];

const PRIMARY_SCOPE_STEP: Step = {
  id: "primary_scope",
  kind: "single",
  title: "Are these all part of one project now, or are some ideas for later?",
  options: [
    "All part of one project now",
    "Main project now, extras later",
    "Just exploring options",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Branch-specific step definitions
// ─────────────────────────────────────────────────────────────────────────────

const BRANCH_STEPS: Record<BranchKey, Step[]> = {
  backyard: [
    {
      id: "backyard_size",
      kind: "single",
      title: "Backyard — roughly how big is the area?",
      options: [
        "Small courtyard",
        "Standard backyard",
        "Large backyard",
        "Multi-zone / full outdoor area",
        "Not sure",
      ],
    },
    {
      id: "backyard_current",
      kind: "multi",
      title: "Backyard — what's there now?",
      hint: "Pick everything that applies.",
      options: [
        "Grass / lawn",
        "Dirt or unfinished area",
        "Old paving",
        "Old garden beds",
        "Slope",
        "Poor drainage",
        "Existing structures to remove",
        "Not sure",
      ],
    },
    {
      id: "backyard_inclusions",
      kind: "multi",
      title: "Backyard — what should be included?",
      options: [
        "Paving",
        "Turf / lawn",
        "Planting",
        "Retaining wall",
        "Drainage",
        "Irrigation",
        "Lighting",
        "Steps / levels",
        "Not sure",
      ],
    },
    {
      id: "backyard_finish",
      kind: "single",
      title: "Backyard — finish level?",
      options: [
        "Practical",
        "Standard",
        "Premium",
        "High-end / architectural",
        "Not sure",
      ],
    },
    {
      id: "backyard_access",
      kind: "single",
      title: "Backyard — site access?",
      options: [
        "Easy side access",
        "Tight side access",
        "Stairs involved",
        "Sloped access",
        "Manual access only",
        "Not sure",
      ],
    },
  ],

  turf: [
    {
      id: "turf_area",
      kind: "single",
      title: "Turf — roughly how much lawn?",
      options: ["Under 30m²", "30–80m²", "80–150m²", "150m²+", "Not sure"],
    },
    {
      id: "turf_type",
      kind: "single",
      title: "Turf — what type?",
      options: ["Natural turf", "Premium natural turf", "Synthetic turf", "Not sure"],
    },
    {
      id: "turf_prep",
      kind: "multi",
      title: "Turf — what prep is needed?",
      options: [
        "Remove existing lawn",
        "Soil improvement",
        "Levelling",
        "Drainage improvement",
        "New underlay",
        "Not sure",
      ],
    },
    {
      id: "turf_irrigation",
      kind: "single",
      title: "Turf — irrigation needed?",
      options: ["No", "Basic irrigation", "Automatic irrigation", "Not sure"],
    },
    {
      id: "turf_access",
      kind: "single",
      title: "Turf — access?",
      options: ["Easy", "Tight", "Stairs", "Manual access only", "Not sure"],
    },
  ],

  paving: [
    {
      id: "paving_area",
      kind: "single",
      title: "Paving — approximate area?",
      options: ["Under 20m²", "20–50m²", "50–100m²", "100m²+", "Not sure"],
    },
    {
      id: "paving_material",
      kind: "single",
      title: "Paving — material / finish?",
      options: [
        "Concrete pavers",
        "Porcelain pavers",
        "Natural stone",
        "Travertine / limestone",
        "Premium feature finish",
        "Not sure",
      ],
    },
    {
      id: "paving_existing",
      kind: "single",
      title: "Paving — current surface?",
      options: [
        "Grass / soil",
        "Old pavers",
        "Concrete to remove",
        "Uneven / sloped surface",
        "Not sure",
      ],
    },
    {
      id: "paving_drainage",
      kind: "single",
      title: "Paving — drainage or slope concerns?",
      options: [
        "No obvious issue",
        "Some slope",
        "Water pooling",
        "Needs drainage channel",
        "Not sure",
      ],
    },
    {
      id: "paving_extras",
      kind: "multi",
      title: "Paving — any extras?",
      hint: "Optional.",
      optional: true,
      options: [
        "Steps",
        "Garden edging",
        "Retaining edge",
        "Lighting",
        "Outdoor entertaining area",
        "Existing surface removal",
      ],
    },
  ],

  retaining: [
    {
      id: "retaining_length",
      kind: "single",
      title: "Retaining wall — approximate length?",
      options: ["Under 5m", "5–15m", "15–30m", "30m+", "Not sure"],
    },
    {
      id: "retaining_height",
      kind: "single",
      title: "Retaining wall — maximum height?",
      options: ["Under 600mm", "600mm–1m", "1m–1.5m", "Over 1.5m", "Not sure"],
    },
    {
      id: "retaining_material",
      kind: "single",
      title: "Retaining wall — preferred material?",
      options: [
        "Timber sleepers",
        "Concrete sleepers",
        "Sandstone blocks",
        "Block wall",
        "Natural stone",
        "Not sure",
      ],
    },
    {
      id: "retaining_conditions",
      kind: "multi",
      title: "Retaining wall — site conditions?",
      options: [
        "Sloped block",
        "Poor drainage",
        "Soil movement",
        "Existing wall to remove",
        "Access tight",
        "Not sure",
      ],
    },
    {
      id: "retaining_access",
      kind: "single",
      title: "Retaining wall — machinery access?",
      options: ["Machine access likely", "Small machine only", "Manual access only", "Not sure"],
    },
  ],

  planting: [
    {
      id: "planting_size",
      kind: "single",
      title: "Planting — garden size?",
      options: [
        "Small garden beds",
        "Medium garden makeover",
        "Large garden makeover",
        "Full property planting",
        "Not sure",
      ],
    },
    {
      id: "planting_scope",
      kind: "multi",
      title: "Planting — what should be included?",
      options: [
        "New plants",
        "Mature plants",
        "Garden beds",
        "Mulch",
        "Edging",
        "Soil prep",
        "Irrigation",
        "Not sure",
      ],
    },
    {
      id: "planting_maturity",
      kind: "single",
      title: "Planting — plant maturity?",
      options: [
        "Small starter plants",
        "Mixed sizes",
        "More mature feature plants",
        "Premium established look",
        "Not sure",
      ],
    },
    {
      id: "planting_irrigation",
      kind: "single",
      title: "Planting — irrigation?",
      options: ["No", "Drip irrigation", "Automatic irrigation", "Not sure"],
    },
    {
      id: "planting_finish",
      kind: "single",
      title: "Planting — finish level?",
      options: ["Practical", "Standard", "Premium", "High-end", "Not sure"],
    },
  ],

  poolside: [
    {
      id: "poolside_status",
      kind: "single",
      title: "Poolside — pool status?",
      options: ["Existing pool", "New pool being built", "Pool planned", "Not sure"],
    },
    {
      id: "poolside_area",
      kind: "single",
      title: "Poolside — surrounding area size?",
      options: [
        "Small surround",
        "Standard pool area",
        "Large pool entertaining area",
        "Full pool landscape",
        "Not sure",
      ],
    },
    {
      id: "poolside_scope",
      kind: "multi",
      title: "Poolside — what should be included?",
      options: [
        "Paving",
        "Decking",
        "Garden beds",
        "Retaining",
        "Privacy planting",
        "Drainage",
        "Lighting",
        "Not sure",
      ],
    },
    {
      id: "poolside_material",
      kind: "single",
      title: "Poolside — finish/material?",
      options: [
        "Concrete pavers",
        "Porcelain",
        "Natural stone",
        "Travertine / limestone",
        "Premium finish",
        "Not sure",
      ],
    },
    {
      id: "poolside_access",
      kind: "single",
      title: "Poolside — access?",
      options: ["Easy", "Tight", "Stairs", "Sloped", "Not sure"],
    },
  ],

  drainage: [
    {
      id: "drainage_issue",
      kind: "multi",
      title: "Drainage/site prep — what is the issue?",
      options: [
        "Pooling water",
        "Sloped block",
        "Excavation",
        "Levelling",
        "Site preparation",
        "Stormwater concern",
        "Not sure",
      ],
    },
    {
      id: "drainage_area",
      kind: "single",
      title: "Drainage/site prep — approximate area?",
      options: ["Small area", "Medium area", "Large area", "Whole yard / major works", "Not sure"],
    },
    {
      id: "drainage_slope",
      kind: "single",
      title: "Drainage/site prep — slope?",
      options: ["Mostly flat", "Slight slope", "Moderate slope", "Steep", "Not sure"],
    },
    {
      id: "drainage_access",
      kind: "single",
      title: "Drainage/site prep — machinery access?",
      options: ["Machine access likely", "Small machine only", "Manual access only", "Not sure"],
    },
    {
      id: "drainage_finish",
      kind: "single",
      title: "Drainage/site prep — landscaping finish needed too?",
      options: ["Drainage only", "Drainage plus landscaping", "Full yard finish after works", "Not sure"],
    },
  ],

  frontyard: [
    {
      id: "frontyard_area",
      kind: "single",
      title: "Front yard — approximate area?",
      options: ["Small entry area", "Standard front yard", "Large front yard", "Full street frontage", "Not sure"],
    },
    {
      id: "frontyard_scope",
      kind: "multi",
      title: "Front yard — what should be included?",
      options: [
        "Paving / path",
        "Garden beds",
        "Turf",
        "Retaining",
        "Drainage",
        "Entry feature",
        "Planting",
        "Not sure",
      ],
    },
    {
      id: "frontyard_existing",
      kind: "multi",
      title: "Front yard — what's there now?",
      options: [
        "Old lawn",
        "Old garden beds",
        "Old paving",
        "Concrete to remove",
        "Slope",
        "Poor drainage",
        "Not sure",
      ],
    },
    {
      id: "frontyard_finish",
      kind: "single",
      title: "Front yard — finish level?",
      options: ["Practical", "Standard", "Premium", "High-end street appeal", "Not sure"],
    },
    {
      id: "frontyard_access",
      kind: "single",
      title: "Front yard — access?",
      options: ["Street access", "Tight access", "Sloped access", "Shared driveway / constraints", "Not sure"],
    },
  ],

  builder: [
    {
      id: "builder_company",
      kind: "text",
      title: "Builder support — company name?",
      placeholder: "Company name",
      optional: true,
    },
    {
      id: "builder_project_type",
      kind: "single",
      title: "Builder support — project type?",
      options: [
        "Residential build",
        "Renovation",
        "Commercial site",
        "School / council style project",
        "Strata",
        "Other",
      ],
    },
    {
      id: "builder_scope",
      kind: "textarea",
      title: "Builder support — rough scope?",
      placeholder: "Example: sandstone blocks, drainage, planting, yarning circle, turf, irrigation...",
    },
    {
      id: "builder_plans",
      kind: "single",
      title: "Builder support — plans available?",
      options: ["Yes", "No", "Coming soon", "Not sure"],
    },
    {
      id: "builder_timeframe",
      kind: "single",
      title: "Builder support — start timeframe?",
      options: ["ASAP", "This month", "1–3 months", "3+ months", "Not sure"],
    },
    {
      id: "builder_delivery",
      kind: "single",
      title: "Builder support — delivery preference?",
      options: ["Labour only", "Supply and install", "Not sure"],
    },
  ],

  unsure: [
    {
      id: "unsure_best_fit",
      kind: "multi",
      title: "Not sure — what sounds closest?",
      options: [
        "Backyard upgrade",
        "Front yard upgrade",
        "Paving",
        "Retaining",
        "Drainage",
        "Planting",
        "Pool area",
        "Commercial / builder support",
      ],
    },
    {
      id: "unsure_description",
      kind: "textarea",
      title: "Not sure — describe what you're thinking",
      placeholder: "Tell us what you want changed, even if it's rough.",
    },
  ],
};

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
// Per-branch metadata (cost drivers + next-step copy)
// ─────────────────────────────────────────────────────────────────────────────

const BRANCH_META: Record<BranchKey, { cost_drivers: string[]; next_step: string }> = {
  backyard: {
    cost_drivers: [
      "Project size",
      "Demolition or removal",
      "Drainage and levels",
      "Materials and finish level",
      "Access difficulty",
    ],
    next_step:
      "We'll review your scope and connect you with a Sydney landscaping contractor for a real quote.",
  },
  turf: {
    cost_drivers: [
      "Turf area",
      "Ground preparation",
      "Turf type",
      "Irrigation",
      "Access difficulty",
    ],
    next_step:
      "We'll review your lawn scope and connect you with a Sydney landscaping contractor for a real quote.",
  },
  paving: {
    cost_drivers: [
      "Paving area",
      "Material choice",
      "Base preparation",
      "Drainage",
      "Existing surface removal",
    ],
    next_step:
      "We'll review your paving scope and connect you with a Sydney landscaping contractor for a real quote.",
  },
  retaining: {
    cost_drivers: [
      "Wall length and height",
      "Material choice",
      "Drainage",
      "Soil and slope conditions",
      "Machinery access",
    ],
    next_step:
      "We'll review your retaining wall scope and connect you with a Sydney landscaping contractor for a real quote.",
  },
  planting: {
    cost_drivers: [
      "Garden size",
      "Plant maturity",
      "Soil preparation",
      "Irrigation",
      "Finish level",
    ],
    next_step:
      "We'll review your planting scope and connect you with a Sydney landscaping contractor for a real quote.",
  },
  poolside: {
    cost_drivers: [
      "Poolside area",
      "Material choice",
      "Drainage",
      "Access",
      "Safety and compliance considerations",
    ],
    next_step:
      "We'll review your poolside scope and connect you with a Sydney landscaping contractor for a real quote.",
  },
  drainage: {
    cost_drivers: [
      "Drainage issue",
      "Slope",
      "Excavation needs",
      "Machinery access",
      "Finishing works after drainage",
    ],
    next_step:
      "We'll review your site conditions and connect you with a Sydney landscaping contractor for a real quote.",
  },
  frontyard: {
    cost_drivers: [
      "Front yard size",
      "Street access",
      "Existing removals",
      "Drainage",
      "Street-appeal finish level",
    ],
    next_step:
      "We'll review your front yard scope and connect you with a Sydney landscaping contractor for a real quote.",
  },
  builder: {
    cost_drivers: [
      "Project type",
      "Plans availability",
      "Site access",
      "Labour-only vs supply-and-install",
      "Start timeframe",
    ],
    next_step:
      "We'll review your details and respond with suitable landscaping support options.",
  },
  unsure: {
    cost_drivers: [
      "Final scope",
      "Site access",
      "Materials",
      "Drainage",
      "Project size",
    ],
    next_step:
      "We'll review your idea and respond with a tailored scope and ballpark range, usually within one business day.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-branch midpoint calculators
// ─────────────────────────────────────────────────────────────────────────────

function hasMulti(answers: AnswerMap, key: string, value: string): boolean {
  return Array.isArray(answers[key]) && (answers[key] as string[]).includes(value);
}

function backyardMidpoint(answers: AnswerMap): number {
  let m = 55000;
  switch (answers.backyard_size) {
    case "Small courtyard": m = 25000; break;
    case "Standard backyard": m = 55000; break;
    case "Large backyard": m = 90000; break;
    case "Multi-zone / full outdoor area": m = 130000; break;
  }
  if (hasMulti(answers, "backyard_current", "Old paving")) m += 8000;
  if (hasMulti(answers, "backyard_current", "Existing structures to remove")) m += 10000;
  if (hasMulti(answers, "backyard_current", "Slope")) m += 12000;
  if (hasMulti(answers, "backyard_current", "Poor drainage")) m += 10000;
  for (const inc of Array.isArray(answers.backyard_inclusions) ? answers.backyard_inclusions as string[] : []) {
    if (inc === "Paving") m += 14000;
    if (inc === "Turf / lawn") m += 8000;
    if (inc === "Planting") m += 9000;
    if (inc === "Retaining wall") m += 18000;
    if (inc === "Drainage") m += 12000;
    if (inc === "Irrigation") m += 5000;
    if (inc === "Lighting") m += 5000;
    if (inc === "Steps / levels") m += 9000;
  }
  if (answers.backyard_finish === "Premium") m += 15000;
  if (answers.backyard_finish === "High-end / architectural") m += 30000;
  if (["Tight side access", "Stairs involved", "Sloped access"].includes(String(answers.backyard_access))) m += 7000;
  if (answers.backyard_access === "Manual access only") m += 15000;
  return Math.max(25000, m);
}

function turfMidpoint(answers: AnswerMap): number {
  let m = 12000;
  switch (answers.turf_area) {
    case "Under 30m²": m = 7000; break;
    case "30–80m²": m = 14000; break;
    case "80–150m²": m = 24000; break;
    case "150m²+": m = 40000; break;
  }
  if (answers.turf_type === "Premium natural turf") m += 5000;
  if (answers.turf_type === "Synthetic turf") m += 15000;
  for (const prep of Array.isArray(answers.turf_prep) ? answers.turf_prep as string[] : []) {
    if (["Remove existing lawn", "Soil improvement", "Levelling", "Drainage improvement", "New underlay"].includes(prep)) m += 2500;
  }
  if (answers.turf_irrigation === "Basic irrigation") m += 3500;
  if (answers.turf_irrigation === "Automatic irrigation") m += 7000;
  if (["Tight", "Stairs"].includes(String(answers.turf_access))) m += 2500;
  if (answers.turf_access === "Manual access only") m += 5000;
  return Math.max(5000, m);
}

function pavingMidpoint(answers: AnswerMap): number {
  let m = 25000;
  switch (answers.paving_area) {
    case "Under 20m²": m = 14000; break;
    case "20–50m²": m = 28000; break;
    case "50–100m²": m = 55000; break;
    case "100m²+": m = 90000; break;
  }
  if (answers.paving_material === "Porcelain pavers") m += 8000;
  if (answers.paving_material === "Natural stone") m += 12000;
  if (answers.paving_material === "Travertine / limestone") m += 15000;
  if (answers.paving_material === "Premium feature finish") m += 20000;
  if (answers.paving_existing === "Old pavers") m += 5000;
  if (answers.paving_existing === "Concrete to remove") m += 9000;
  if (answers.paving_existing === "Uneven / sloped surface") m += 9000;
  if (answers.paving_drainage === "Water pooling") m += 7000;
  if (answers.paving_drainage === "Needs drainage channel") m += 9000;
  if (hasMulti(answers, "paving_extras", "Steps")) m += 5000;
  if (hasMulti(answers, "paving_extras", "Lighting")) m += 3500;
  if (hasMulti(answers, "paving_extras", "Existing surface removal")) m += 6000;
  return Math.max(12000, m);
}

function retainingMidpoint(answers: AnswerMap): number {
  let m = 18000;
  switch (answers.retaining_length) {
    case "Under 5m": m = 9000; break;
    case "5–15m": m = 22000; break;
    case "15–30m": m = 45000; break;
    case "30m+": m = 75000; break;
  }
  if (answers.retaining_height === "600mm–1m") m += 5000;
  if (answers.retaining_height === "1m–1.5m") m += 15000;
  if (answers.retaining_height === "Over 1.5m") m += 30000;
  if (answers.retaining_material === "Concrete sleepers") m += 7000;
  if (answers.retaining_material === "Sandstone blocks") m += 18000;
  if (answers.retaining_material === "Block wall") m += 15000;
  if (answers.retaining_material === "Natural stone") m += 22000;
  if (hasMulti(answers, "retaining_conditions", "Poor drainage")) m += 7000;
  if (hasMulti(answers, "retaining_conditions", "Existing wall to remove")) m += 8000;
  if (answers.retaining_access === "Small machine only") m += 5000;
  if (answers.retaining_access === "Manual access only") m += 12000;
  return Math.max(8000, m);
}

function plantingMidpoint(answers: AnswerMap): number {
  let m = 12000;
  switch (answers.planting_size) {
    case "Small garden beds": m = 7000; break;
    case "Medium garden makeover": m = 18000; break;
    case "Large garden makeover": m = 32000; break;
    case "Full property planting": m = 50000; break;
  }
  if (hasMulti(answers, "planting_scope", "Mature plants")) m += 8000;
  if (hasMulti(answers, "planting_scope", "Soil prep")) m += 4000;
  if (hasMulti(answers, "planting_scope", "Irrigation")) m += 6000;
  if (answers.planting_maturity === "More mature feature plants") m += 8000;
  if (answers.planting_maturity === "Premium established look") m += 15000;
  if (answers.planting_irrigation === "Drip irrigation") m += 4000;
  if (answers.planting_irrigation === "Automatic irrigation") m += 8000;
  if (answers.planting_finish === "Premium") m += 8000;
  if (answers.planting_finish === "High-end") m += 15000;
  return Math.max(5000, m);
}

function poolsideMidpoint(answers: AnswerMap): number {
  let m = 35000;
  switch (answers.poolside_area) {
    case "Small surround": m = 22000; break;
    case "Standard pool area": m = 45000; break;
    case "Large pool entertaining area": m = 80000; break;
    case "Full pool landscape": m = 115000; break;
  }
  for (const scope of Array.isArray(answers.poolside_scope) ? answers.poolside_scope as string[] : []) {
    if (scope === "Paving") m += 12000;
    if (scope === "Garden beds") m += 6000;
    if (scope === "Retaining") m += 18000;
    if (scope === "Privacy planting") m += 6000;
    if (scope === "Drainage") m += 10000;
    if (scope === "Lighting") m += 5000;
  }
  if (answers.poolside_material === "Natural stone") m += 10000;
  if (answers.poolside_material === "Travertine / limestone") m += 12000;
  if (answers.poolside_material === "Premium finish") m += 18000;
  if (["Tight", "Stairs", "Sloped"].includes(String(answers.poolside_access))) m += 7000;
  return Math.max(20000, m);
}

function drainageMidpoint(answers: AnswerMap): number {
  let m = 12000;
  switch (answers.drainage_area) {
    case "Small area": m = 7000; break;
    case "Medium area": m = 18000; break;
    case "Large area": m = 45000; break;
    case "Whole yard / major works": m = 90000; break;
  }
  if (hasMulti(answers, "drainage_issue", "Excavation")) m += 12000;
  if (hasMulti(answers, "drainage_issue", "Levelling")) m += 9000;
  if (hasMulti(answers, "drainage_issue", "Stormwater concern")) m += 12000;
  if (answers.drainage_slope === "Moderate slope") m += 8000;
  if (answers.drainage_slope === "Steep") m += 18000;
  if (answers.drainage_access === "Small machine only") m += 5000;
  if (answers.drainage_access === "Manual access only") m += 12000;
  if (answers.drainage_finish === "Drainage plus landscaping") m += 12000;
  if (answers.drainage_finish === "Full yard finish after works") m += 30000;
  return Math.max(5000, m);
}

function frontyardMidpoint(answers: AnswerMap): number {
  let m = 25000;
  switch (answers.frontyard_area) {
    case "Small entry area": m = 15000; break;
    case "Standard front yard": m = 35000; break;
    case "Large front yard": m = 60000; break;
    case "Full street frontage": m = 80000; break;
  }
  if (hasMulti(answers, "frontyard_scope", "Paving / path")) m += 9000;
  if (hasMulti(answers, "frontyard_scope", "Turf")) m += 6000;
  if (hasMulti(answers, "frontyard_scope", "Retaining")) m += 14000;
  if (hasMulti(answers, "frontyard_scope", "Drainage")) m += 9000;
  if (hasMulti(answers, "frontyard_existing", "Concrete to remove")) m += 7000;
  if (hasMulti(answers, "frontyard_existing", "Slope")) m += 8000;
  if (hasMulti(answers, "frontyard_existing", "Poor drainage")) m += 8000;
  if (answers.frontyard_finish === "Premium") m += 10000;
  if (answers.frontyard_finish === "High-end street appeal") m += 18000;
  return Math.max(15000, m);
}

function branchMidpoint(branch: BranchKey, answers: AnswerMap): number | null {
  switch (branch) {
    case "backyard":
      return backyardMidpoint(answers);
    case "turf":
      return turfMidpoint(answers);
    case "paving":
      return pavingMidpoint(answers);
    case "retaining":
      return retainingMidpoint(answers);
    case "planting":
      return plantingMidpoint(answers);
    case "poolside":
      return poolsideMidpoint(answers);
    case "drainage":
      return drainageMidpoint(answers);
    case "frontyard":
      return frontyardMidpoint(answers);
    case "builder":
      return null;
    case "unsure":
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Quote builder (midpoint-based preliminary display range)
// ─────────────────────────────────────────────────────────────────────────────

const MIDPOINT_FLOOR = 10000;

function roundToK(n: number): number {
  return Math.round(n / 1000) * 1000;
}

function round500(n: number): number {
  return Math.round(n / 500) * 500;
}

function formatK(amount: number): string {
  return `$${Math.round(amount / 1000)}k`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-AU")}`;
}

function buildItemisedBreakdown(midpoint: number): ItemisedLine[] {
  const materials = round500(midpoint * 0.38);
  const labour = round500(midpoint * 0.35);
  const margin = round500(midpoint * 0.17);
  // Contingency absorbs rounding so the four lines total exactly the midpoint.
  const contingency = midpoint - materials - labour - margin;

  return [
    {
      label: "Materials",
      amount: materials,
      note: "Plants, turf, pavers, stone, sleepers, drainage materials and consumables.",
    },
    {
      label: "Labour",
      amount: labour,
      note: "Skilled landscaping team, prep and install.",
    },
    {
      label: "Builder margin / overhead",
      amount: margin,
      note: "Project management, insurance and supervision.",
    },
    {
      label: "Site complexity / contingency",
      amount: contingency,
      note: "Allowance for access, slope, drainage, excavation and final scope shifts.",
    },
  ];
}

function deriveContextWarnings(answers: AnswerMap): string[] {
  const warnings: string[] = [];

  const arrAnswer = (key: string): string[] =>
    Array.isArray(answers[key]) ? (answers[key] as string[]) : [];

  const hasTightAccess = [
    answers.backyard_access,
    answers.turf_access,
    answers.poolside_access,
    answers.frontyard_access,
  ].some(
    (a) =>
      typeof a === "string" &&
      (a.includes("Tight") ||
        a.includes("Stairs") ||
        a.includes("Manual")),
  );

  if (
    hasTightAccess ||
    answers.retaining_access === "Manual access only" ||
    answers.drainage_access === "Manual access only"
  ) {
    warnings.push("Tight or manual access can increase labour time and handling costs.");
  }

  const slopeRisk =
    arrAnswer("backyard_current").includes("Slope") ||
    arrAnswer("frontyard_existing").includes("Slope") ||
    ["Moderate slope", "Steep"].includes(String(answers.drainage_slope));

  if (slopeRisk) {
    warnings.push("Slope or level changes may require extra excavation, retaining or drainage allowances.");
  }

  const drainageRisk =
    arrAnswer("backyard_current").includes("Poor drainage") ||
    arrAnswer("frontyard_existing").includes("Poor drainage") ||
    answers.paving_drainage === "Water pooling" ||
    answers.paving_drainage === "Needs drainage channel" ||
    arrAnswer("drainage_issue").length > 0;

  if (drainageRisk) {
    warnings.push("Drainage conditions can materially change the final scope after inspection.");
  }

  const premium = [
    answers.backyard_finish,
    answers.paving_material,
    answers.planting_finish,
    answers.poolside_material,
    answers.frontyard_finish,
  ].some(
    (a) =>
      typeof a === "string" &&
      (a.includes("Premium") ||
        a.includes("High-end") ||
        a.includes("Natural stone") ||
        a.includes("Travertine")),
  );

  if (premium) {
    warnings.push("Premium finishes and natural stone usually push the project toward the upper end of the range.");
  }

  return warnings;
}

function stringAnswer(answers: AnswerMap, key: string): string {
  const value = answers[key];
  return typeof value === "string" ? value : "";
}

function isPracticalStagedLead(answers: AnswerMap): boolean {
  const practicalIntents = new Set([
    "Basic landscaping to finish the build / help with OC",
    "Street appeal and front entry presentation",
    "Practical backyard refresh",
  ]);
  const practicalBudgets = new Set(["Under $15k", "$15k-$30k"]);

  return (
    practicalIntents.has(stringAnswer(answers, "project_intent")) &&
    practicalBudgets.has(stringAnswer(answers, "budget_expectation"))
  );
}

function aggregateMidpoint(
  numeric: { id: BranchKey; midpoint: number }[],
  answers: AnswerMap,
): number {
  const rawSum = numeric.reduce((s, x) => s + x.midpoint, 0);
  const primaryScope = stringAnswer(answers, "primary_scope");

  if (numeric.length <= 1) {
    return rawSum;
  }

  const sorted = [...numeric].sort((a, b) => b.midpoint - a.midpoint);
  const primary = sorted[0].midpoint;
  const extras = sorted.slice(1).reduce((s, x) => s + x.midpoint, 0);

  if (primaryScope === "Just exploring options") {
    return primary;
  }

  if (
    isPracticalStagedLead(answers) ||
    primaryScope === "Main project now, extras later"
  ) {
    return primary + extras * 0.25;
  }

  return rawSum;
}

function applyPracticalStagedInterpretation(rawMidpoint: number, answers: AnswerMap): number {
  if (!isPracticalStagedLead(answers)) return rawMidpoint;

  const budgetExpectation = stringAnswer(answers, "budget_expectation");
  const practicalCeiling = budgetExpectation === "Under $15k" ? 18000 : 35000;
  return Math.min(rawMidpoint, practicalCeiling);
}

function selectedScopeHasHighIntent(ids: BranchKey[], answers: AnswerMap): boolean {
  if (
    ids.some((id) =>
      ["backyard", "poolside", "retaining", "paving", "drainage", "builder"].includes(id),
    )
  ) {
    return true;
  }

  const unsureBestFit = Array.isArray(answers.unsure_best_fit)
    ? (answers.unsure_best_fit as string[])
    : [];

  return unsureBestFit.some((scope) =>
    ["Backyard upgrade", "Paving", "Retaining", "Drainage", "Pool area", "Commercial / builder support"].includes(scope),
  );
}

function calculateLeadQualification(
  branchIds: BranchKey[],
  answers: AnswerMap,
  photoCount: number,
) {
  const projectIntent = stringAnswer(answers, "project_intent");
  const deliveryIntent = stringAnswer(answers, "delivery_intent");
  const budgetExpectation = stringAnswer(answers, "budget_expectation");
  const existingQuoteRange = stringAnswer(answers, "existing_quote_range");
  const primaryScope = stringAnswer(answers, "primary_scope");
  const timeline = stringAnswer(answers, "timeline");
  const redFlags: string[] = [];
  let leadScore = 0;

  if (deliveryIntent === "I want a landscaper to handle the full job") leadScore += 30;
  if (budgetExpectation === "$30k-$60k") leadScore += 20;
  if (budgetExpectation === "$60k-$100k" || budgetExpectation === "$100k+") {
    leadScore += 35;
  }
  if (timeline === "ASAP" || timeline === "1–3 months") leadScore += 15;
  if (selectedScopeHasHighIntent(branchIds, answers)) leadScore += 15;
  if (photoCount > 0) leadScore += 10;

  if (deliveryIntent === "I’m likely to DIY or stage parts myself") {
    leadScore -= 40;
    redFlags.push("Likely to DIY or stage parts themselves");
  }
  if (existingQuoteRange === "Yes, but they felt too high") {
    leadScore -= 25;
    redFlags.push("Existing quotes felt too high");
  }
  if (budgetExpectation === "Under $15k" || budgetExpectation === "$15k-$30k") {
    leadScore -= 20;
    redFlags.push("Lower stated budget expectation");
  }
  if (projectIntent === "Basic landscaping to finish the build / help with OC") {
    leadScore -= 20;
    redFlags.push("Basic OC or build-completion intent");
  }
  if (deliveryIntent === "I want help with the harder parts only") {
    leadScore -= 15;
    redFlags.push("Wants help with harder parts only");
  }
  if (primaryScope === "Main project now, extras later") {
    redFlags.push("Some selected scope may be staged later");
  }
  if (primaryScope === "Just exploring options") {
    redFlags.push("Exploring options rather than one confirmed scope");
  }

  const qualificationStatus =
    leadScore >= 60
      ? "Qualified"
      : leadScore >= 40
        ? "Maybe/Nurture"
        : "Low-fit/DIY-style";

  let suggestedCallAngle =
    "Start by confirming the intended scope, budget expectation and whether they want a contractor-led project.";

  if (
    projectIntent === "Basic landscaping to finish the build / help with OC" ||
    projectIntent === "Street appeal and front entry presentation" ||
    projectIntent === "Practical backyard refresh"
  ) {
    suggestedCallAngle =
      "Sounds like you’re trying to get the property presentable for OC or move-in without overcapitalising. Is that right?";
  } else if (
    deliveryIntent === "I want a landscaper to handle the full job" &&
    (budgetExpectation === "$60k-$100k" || budgetExpectation === "$100k+")
  ) {
    suggestedCallAngle =
      "Looks like you’re considering a proper contractor-led landscaping project. Are you trying to get the whole scope handled in one go?";
  } else if (deliveryIntent === "I’m likely to DIY or stage parts myself") {
    suggestedCallAngle =
      "It sounds like you may stage or DIY parts of this. Which pieces would you still want a landscaper to handle?";
  } else if (existingQuoteRange === "Yes, but they felt too high") {
    suggestedCallAngle =
      "You’ve had pricing that felt high. Which parts of the scope are must-haves, and which could be simplified or staged?";
  }

  return {
    lead_score: leadScore,
    qualification_status: qualificationStatus,
    red_flags: redFlags,
    suggested_call_angle: suggestedCallAngle,
    project_intent: projectIntent,
    delivery_intent: deliveryIntent,
    budget_expectation: budgetExpectation,
    existing_quote_range: existingQuoteRange,
    primary_scope: primaryScope,
  };
}

function labelFor(id: BranchKey): string {
  return PROJECT_TYPES.find((p) => p.id === id)?.label ?? id;
}

function buildQuote(
  branchIds: BranchKey[],
  answers: AnswerMap,
): QuoteResult {
  const numeric: { id: BranchKey; midpoint: number }[] = [];
  const manualOnly: BranchKey[] = [];

  for (const id of branchIds) {
    const m = branchMidpoint(id, answers);
    if (m === null) manualOnly.push(id);
    else numeric.push({ id, midpoint: m });
  }

  // Aggregate cost drivers from every selected branch (deduplicated).
  const driverSet = new Set<string>();
  for (const id of branchIds) {
    for (const d of BRANCH_META[id].cost_drivers) driverSet.add(d);
  }
  const cost_drivers = Array.from(driverSet);

  // ── All manual review ────────────────────────────────────────────────────
  if (numeric.length === 0) {
    const labels = branchIds.map(labelFor).join(", ");
    const warnings = deriveContextWarnings(answers);
    warnings.push(
      "We'll review your details manually and respond with a tailored ballpark, usually within one business day.",
    );
    return {
      range_low: null,
      range_high: null,
      display_range: "Manual review recommended",
      midpoint: null,
      currency: "AUD",
      itemised_breakdown: [],
      confidence: "manual",
      summary: `${labels} needs manual review — we'll come back with a tailored ballpark, usually within one business day.`,
      cost_drivers,
      warnings,
      next_step:
        "We'll review your scope manually and respond with a tailored ballpark, usually within one business day.",
    };
  }

  // ── Numeric (single or combined) ────────────────────────────────────────
  const rawSum = applyPracticalStagedInterpretation(
    aggregateMidpoint(numeric, answers),
    answers,
  );
  const midpoint = Math.max(MIDPOINT_FLOOR, roundToK(rawSum));
  const range_low = midpoint - 5000;
  const range_high = midpoint + 5000;
  const display_range = `${formatK(range_low)} – ${formatK(range_high)} AUD`;
  const itemised_breakdown = buildItemisedBreakdown(midpoint);

  const numericLabels = numeric.map((n) => labelFor(n.id));
  const practicalStaged = isPracticalStagedLead(answers);
  const summaryHead =
    practicalStaged
      ? "Based on your answers, this looks closer to a practical completion / street-appeal project than a full premium transformation."
      : numericLabels.length === 1
      ? `Most Sydney ${numericLabels[0].toLowerCase()} builds at this configuration land near ${formatK(midpoint)} AUD.`
      : `Combining ${numericLabels.join(", ")}: estimated near ${formatK(midpoint)} AUD.`;
  const summaryTail =
    " Based on your answers, this looks like a broad preliminary range. Final pricing can shift depending on site access, levels, drainage, materials, measurements and final scope.";
  let summary = summaryHead + summaryTail;

  if (manualOnly.length > 0) {
    const manualLabels = manualOnly.map(labelFor).join(", ");
    summary += ` ${manualLabels} also selected — we'll review those manually.`;
  }

  const warnings = deriveContextWarnings(answers);

  if (
    typeof answers.budget === "string" &&
    answers.budget === "Under $10k" &&
    range_low > 10000
  ) {
    warnings.push(
      "Your indicated budget is below this configuration's typical range — scope may need to be reduced.",
    );
  }

  if (manualOnly.length > 0) {
    const manualLabels = manualOnly.map(labelFor).join(", ");
    warnings.push(
      `${manualLabels} need${manualOnly.length === 1 ? "s" : ""} manual review — not included in the priced range above.`,
    );
  }

  // Confidence: medium for any quoted result, even when stacked.
  const confidence: Confidence = "medium";

  const next_step =
    manualOnly.length > 0
      ? "We'll review your full scope and connect you with a vetted Sydney landscaping contractor. The manually-reviewed scopes will get a tailored ballpark, usually within one business day."
      : numeric.length === 1
        ? BRANCH_META[numeric[0].id].next_step
        : "We'll review your details and connect you with a vetted Sydney landscaping contractor for a real quote.";

  return {
    range_low,
    range_high,
    display_range,
    midpoint,
    currency: "AUD",
    itemised_breakdown,
    confidence,
    summary,
    cost_drivers,
    warnings,
    next_step,
  };
}

// Fire-and-forget POST to the server-side n8n webhook proxy.
// Failures are logged but never block the quote result UI.
async function sendLeadToWebhook(payload: unknown): Promise<void> {
  try {
    const res = await fetch("/api/fergusons-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as unknown;
    // eslint-disable-next-line no-console
    console.log("Fergusons lead webhook result", json);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Fergusons lead webhook error", err);
  }
}

function createMetaEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";

  try {
    const prefix = `${name}=`;
    const cookie = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));

    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
  } catch {
    return "";
  }
}

function getFbcFromUrlOrCookie(): string {
  const cookieFbc = readCookie("_fbc");
  if (cookieFbc) return cookieFbc;
  if (typeof window === "undefined") return "";

  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : "";
  } catch {
    return "";
  }
}

function getFergusonsEventSourceUrl(): string {
  if (typeof window === "undefined") return "https://www.directbuild.au/fergusons";
  return window.location.href || "https://www.directbuild.au/fergusons";
}

function trackFergusonsEvent(
  eventName: string,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;

  const fbq = (
    window as Window & {
      fbq?: (
        eventType: string,
        eventName: string,
        parameters?: Record<string, unknown>,
      ) => void;
    }
  ).fbq;

  if (typeof fbq !== "function") return;

  try {
    fbq("trackCustom", eventName, {
      source_page: "fergusons",
      vertical: "landscaping",
      client: "Fergusons Landscapes",
      ...params,
    });
  } catch {
    // Custom drop-off tracking should never affect the questionnaire.
  }
}

function trackFergusonsLead(metaEventId: unknown): void {
  if (typeof window === "undefined") return;

  const fbq = (
    window as Window & {
      fbq?: (
        eventType: string,
        eventName: string,
        parameters: Record<string, unknown>,
        options: Record<string, unknown>,
      ) => void;
    }
  ).fbq;

  if (typeof fbq !== "function") {
    // eslint-disable-next-line no-console
    console.warn("[Fergusons Meta Pixel] fbq is not available; Lead not tracked.");
    return;
  }

  if (typeof metaEventId !== "string" || metaEventId.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Fergusons Meta Pixel] meta_event_id missing; Lead not tracked.",
    );
    return;
  }

  try {
    fbq(
      "track",
      "Lead",
      {
        content_name: "Fergusons Landscaping Budget Snapshot",
        content_category: "Landscaping Lead",
        currency: "AUD",
        value: 0,
      },
      {
        eventID: metaEventId,
      },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[Fergusons Meta Pixel] Lead tracking failed.", err);
  }
}

function safeStorageFileName(name: string): string {
  const trimmed = name.trim() || "upload";
  return trimmed
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "upload";
}

function createPhotoUploadFolder(): string {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `fergusons/${Date.now()}-${randomId}`;
}

async function uploadFergusonsPhotos(files: File[]): Promise<UploadedPhoto[]> {
  if (files.length === 0) return [];

  // eslint-disable-next-line no-console
  console.log("[Fergusons] photo upload started", { count: files.length });

  const supabase = getSupabaseBrowserClient();
  const bucket = getSupabasePhotoBucket();
  const folder = createPhotoUploadFolder();

  const uploaded: UploadedPhoto[] = [];

  for (const [index, file] of files.entries()) {
    const path = `${folder}/${index}-${safeStorageFileName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    uploaded.push({
      name: file.name,
      size: file.size,
      type: file.type,
      storage_path: path,
      public_url: data.publicUrl,
    });
  }

  // eslint-disable-next-line no-console
  console.log("[Fergusons] photo upload success", { count: uploaded.length });
  // eslint-disable-next-line no-console
  console.log("[Fergusons] photo_urls count", uploaded.length);

  return uploaded;
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function isValidAustralianMobile(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, "");
  return /^(?:\+?61|0)4\d{8}$/.test(cleaned);
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
        v.name.trim().length >= 2 &&
          isValidAustralianMobile(v.phone) &&
          isValidEmail(v.email),
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function FergusonsPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const firedCustomEventsRef = useRef<Set<string>>(new Set());

  // Pending submission (held while OTP overlay is open)
  const [pendingPayload, setPendingPayload] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [pendingPhotoFiles, setPendingPhotoFiles] = useState<File[]>([]);
  const [pendingQuote, setPendingQuote] = useState<QuoteResult | null>(null);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);

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

  const flow: Step[] = useMemo(() => {
    const steps: Step[] = [PROJECT_TYPES_STEP];
    if (selectedTypes.length === 0) return steps;
    steps.push(...QUALIFICATION_STEPS);
    if (selectedTypes.length > 1) {
      steps.push(PRIMARY_SCOPE_STEP);
    }
    for (const t of selectedTypes) {
      steps.push(...BRANCH_STEPS[t.id]);
    }
    steps.push(...SHARED_STEPS);
    return steps;
  }, [selectedTypes]);

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
  const hasPhotos =
    Array.isArray(answers.photos) && (answers.photos as File[]).length > 0;
  const photoCount = hasPhotos ? (answers.photos as File[]).length : 0;
  const suburbValue = isSuburbEntry(answers.suburb)
    ? `${answers.suburb.suburb}, ${answers.suburb.state} ${answers.suburb.postcode}`
    : undefined;

  const getTrackingParams = (
    extra: Record<string, unknown> = {},
    sourceAnswers: AnswerMap = answers,
  ): Record<string, unknown> => {
    const sourcePhotoCount = Array.isArray(sourceAnswers.photos)
      ? (sourceAnswers.photos as File[]).length
      : 0;
    const sourceHasPhotos = sourcePhotoCount > 0;
    const sourceSuburb = isSuburbEntry(sourceAnswers.suburb)
      ? `${sourceAnswers.suburb.suburb}, ${sourceAnswers.suburb.state} ${sourceAnswers.suburb.postcode}`
      : undefined;
    const qualification =
      selectedTypeIds.length > 0
        ? calculateLeadQualification(selectedTypeIds, sourceAnswers, sourcePhotoCount)
        : null;

    return {
      step_name: currentStep?.title,
      step_number: currentStep ? stepIndex + 1 : undefined,
      selected_project_type_count: selectedTypeIds.length,
      selected_project_type_ids: selectedTypeIds,
      project_intent: stringAnswer(sourceAnswers, "project_intent") || undefined,
      delivery_intent: stringAnswer(sourceAnswers, "delivery_intent") || undefined,
      budget_expectation:
        stringAnswer(sourceAnswers, "budget_expectation") || undefined,
      existing_quote_range:
        stringAnswer(sourceAnswers, "existing_quote_range") || undefined,
      primary_scope: stringAnswer(sourceAnswers, "primary_scope") || undefined,
      suburb: sourceSuburb,
      has_photos: sourceHasPhotos,
      photo_count: sourcePhotoCount,
      lead_score: qualification?.lead_score,
      qualification_status: qualification?.qualification_status,
      ...extra,
    };
  };

  const trackOnce = (
    key: string,
    eventName: string,
    extra?: Record<string, unknown>,
    sourceAnswers?: AnswerMap,
  ) => {
    if (firedCustomEventsRef.current.has(key)) return;
    firedCustomEventsRef.current.add(key);
    trackFergusonsEvent(eventName, getTrackingParams(extra, sourceAnswers));
  };

  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.kind === "photos") {
      trackOnce("photo_step_viewed", "DB_Fergusons_PhotoStepViewed", {
        step_name: currentStep.title,
        step_number: stepIndex + 1,
      });
    }
    if (currentStep.kind === "contact") {
      trackOnce("contact_step_viewed", "DB_Fergusons_ContactStepViewed", {
        step_name: currentStep.title,
        step_number: stepIndex + 1,
      });
    }
  }, [currentStep, stepIndex, selectedTypeIds, answers, hasPhotos, photoCount]);

  useEffect(() => {
    if (!quote) return;
    trackOnce("estimate_viewed", "DB_Fergusons_EstimateViewed");
  }, [quote, selectedTypeIds, answers, hasPhotos, photoCount]);

  const isScopeCompletionStep = (step: Step, index: number) => {
    if (step.id === PROJECT_TYPES_STEP.id) return false;
    if (QUALIFICATION_STEPS.some((s) => s.id === step.id)) return false;
    if (step.id === PRIMARY_SCOPE_STEP.id) return false;
    if (SHARED_STEPS.some((s) => s.id === step.id)) return false;
    return SHARED_STEPS.some((s) => s.id === flow[index + 1]?.id);
  };

  const trackCompletedStepEvents = (
    step: Step,
    index: number,
    sourceAnswers: AnswerMap = answers,
  ) => {
    const params = {
      step_name: step.title,
      step_number: index + 1,
    };

    if (step.id === PROJECT_TYPES_STEP.id) {
      trackOnce(
        "project_step_completed",
        "DB_Fergusons_ProjectStepCompleted",
        params,
        sourceAnswers,
      );
    }

    const qualificationEndsHere =
      step.id === "primary_scope" ||
      (step.id === "existing_quote_range" &&
        flow[index + 1]?.id !== PRIMARY_SCOPE_STEP.id);

    if (qualificationEndsHere) {
      trackOnce(
        "qualification_step_completed",
        "DB_Fergusons_QualificationStepCompleted",
        params,
        sourceAnswers,
      );
    }

    if (isScopeCompletionStep(step, index)) {
      trackOnce(
        "scope_step_completed",
        "DB_Fergusons_ScopeStepCompleted",
        params,
        sourceAnswers,
      );
    }

    if (step.kind === "suburb") {
      trackOnce(
        "suburb_step_completed",
        "DB_Fergusons_SuburbStepCompleted",
        params,
        sourceAnswers,
      );
    }
  };

  const setAnswer = (key: string, value: AnswerValue) => {
    setAnswers((a) => ({ ...a, [key]: value }));
  };

  const handleToggleProjectType = (label: string) => {
    trackOnce("started", "DB_Fergusons_Started");
    setAnswers((a) => {
      const existing = Array.isArray(a[PROJECT_TYPES_STEP.id])
        ? (a[PROJECT_TYPES_STEP.id] as string[])
        : [];
      const isAdding = !existing.includes(label);
      const next = isAdding
        ? [...existing, label]
        : existing.filter((x) => x !== label);

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
      if (next.length <= 1 && cleaned.primary_scope) {
        cleaned = cleaned === a ? { ...a } : cleaned;
        delete cleaned.primary_scope;
      }
      return { ...cleaned, [PROJECT_TYPES_STEP.id]: next };
    });
  };

  const handleSingleSelect = (key: string, value: string) => {
    const nextAnswers = { ...answers, [key]: value };
    if (currentStep) {
      trackCompletedStepEvents(currentStep, stepIndex, nextAnswers);
    }
    setAnswers(nextAnswers);
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
    if (incoming.length > 0) {
      trackOnce("photo_uploaded", "DB_Fergusons_PhotoUploaded", {
        has_photos: true,
        photo_count: photoCount + incoming.length,
      });
    }
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

  const buildSubmission = () => {
    const result = buildQuote(selectedTypeIds, answers);
    const metaEventId = createMetaEventId();

    const photoFiles = Array.isArray(answers.photos)
      ? (answers.photos as File[])
      : [];

    const contact = isContactValue(answers.contact) ? answers.contact : null;
    const suburbEntry = isSuburbEntry(answers.suburb) ? answers.suburb : null;
    const qualification = calculateLeadQualification(
      selectedTypeIds,
      answers,
      photoFiles.length,
    );

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
      vertical: "landscaping",
      partner: "Ferguson's Landscapes",
      source_page: "fergusons",
      campaign_name: "fergusons_landscaping_pilot",
      meta_event_id: metaEventId,
      fbp: readCookie("_fbp"),
      fbc: getFbcFromUrlOrCookie(),
      event_source_url: getFergusonsEventSourceUrl(),
      ...qualification,
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
      photo_urls: [],
      quote_result: result,
    };

    return { payload, result, photoFiles };
  };

  const submitLeadWithUploadedPhotos = async (
    payload: Record<string, unknown>,
    photoFiles: File[],
    logLabel: string,
  ) => {
    let finalPayload: Record<string, unknown> = payload;

    if (photoFiles.length > 0) {
      try {
        const uploadedPhotos = await uploadFergusonsPhotos(photoFiles);
        finalPayload = {
          ...payload,
          photos: uploadedPhotos,
          photo_urls: uploadedPhotos.map((photo) => photo.public_url),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        finalPayload = {
          ...payload,
          photo_upload_error: message,
        };
        // eslint-disable-next-line no-console
        console.error("[Fergusons] photo upload failed:", err);
        // eslint-disable-next-line no-console
        console.log("[Fergusons] photo_urls count", 0);
      }
    }

    // eslint-disable-next-line no-console
    console.log(logLabel, finalPayload);
    trackFergusonsLead(finalPayload.meta_event_id);
    await sendLeadToWebhook(finalPayload);
  };

  const goNext = () => {
    if (!currentStep) return;
    if (!isStepAnswered(currentStep, answers)) return;
    if (stepIndex < flow.length - 1) {
      trackCompletedStepEvents(currentStep, stepIndex);
      setStepIndex(stepIndex + 1);
      return;
    }

    if (selectedTypeIds.length === 0) return;
    const { payload, result, photoFiles } = buildSubmission();

    if (OTP_VERIFICATION_ENABLED) {
      trackOnce("otp_requested", "DB_Fergusons_OTPRequested");
      setPendingPayload(payload);
      setPendingPhotoFiles(photoFiles);
      setPendingQuote(result);
      setShowPhoneVerify(true);
    } else {
      setQuote(result);
      void submitLeadWithUploadedPhotos(
        payload,
        photoFiles,
        "[Fergusons] submission payload:",
      );
    }
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((s) => s - 1);
  };

  const handleOTPVerified = () => {
    if (pendingPayload && pendingQuote) {
      trackOnce("otp_verified", "DB_Fergusons_OTPVerified", {
        has_photos: pendingPhotoFiles.length > 0,
        photo_count: pendingPhotoFiles.length,
      });
      setQuote(pendingQuote);
      void submitLeadWithUploadedPhotos(
        pendingPayload,
        pendingPhotoFiles,
        "[Fergusons] submission payload (OTP verified):",
      );
    }
    setShowPhoneVerify(false);
    setPendingPayload(null);
    setPendingPhotoFiles([]);
    setPendingQuote(null);
  };

  const handleOTPCancel = () => {
    setShowPhoneVerify(false);
    setPendingPayload(null);
    setPendingPhotoFiles([]);
    setPendingQuote(null);
  };

  const reset = () => {
    setStepIndex(0);
    setAnswers({});
    setQuote(null);
    setPendingPayload(null);
    setPendingPhotoFiles([]);
    setPendingQuote(null);
    setShowPhoneVerify(false);
  };

  const contactValue = isContactValue(answers.contact)
    ? answers.contact
    : null;

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <Script
        id="fergusons-meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FERGUSONS_META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FERGUSONS_META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-30%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-orange-safety/[0.05] blur-[120px]" />
        <div className="absolute bottom-[-25%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-orange-safety/[0.025] blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 flex flex-col px-5 sm:px-8 pt-8 sm:pt-12 pb-8">
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

        <p className="mt-10 text-[11px] text-gray-text leading-relaxed">
          All figures are shown in AUD and are a ballpark guide only, not a fixed quote.
          Final pricing depends on access, site conditions, drainage, materials, excavation,
          approvals, finish level and final scope.
        </p>
      </div>

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
// Step 0 — multi-select project types
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
        Get a rough landscaping budget range in under 60 seconds.
      </h1>
      <p className="mt-3 text-sm sm:text-base text-gray-text leading-relaxed max-w-[52ch]">
        Built for Sydney homeowners planning turf, paving, garden beds, retaining
        walls, poolside landscaping or full outdoor upgrades.
      </p>

      <div className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            Select what you want priced now
          </h2>
          <span className="text-xs text-gray-text">
            {selectedLabels.length} selected
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-text">
          Pick the work you’re considering. We’ll ask a few quick questions and show
          a broad preliminary range before you speak with a contractor.
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
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden transition-colors",
                      opt.imageSrc
                        ? "bg-gray-light/40"
                        : isSelected
                          ? "bg-orange-safety text-black-deep"
                          : "bg-orange-safety/10 text-orange-safety group-hover:bg-orange-safety/20",
                    ].join(" ")}
                  >
                    {opt.imageSrc ? (
                      <OptionImage
                        src={opt.imageSrc}
                        alt={opt.label}
                        className="h-full w-full"
                      />
                    ) : (
                      <opt.icon size={20} weight="duotone" />
                    )}
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
// Dynamic step renderer
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
          images={step.images}
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

// Image used inside option cards. Falls back to a brand-tinted placeholder
// when the file is missing — keeps card layout intact.
function OptionImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-orange-safety/15 to-gray-light/40 grid place-items-center text-orange-safety/40`}
        aria-hidden
      >
        <ImageSquare size={16} weight="duotone" />
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={`${className} object-cover`}
      loading="lazy"
      decoding="async"
    />
  );
}

// Empty placeholder for option cards in image-enabled steps where a specific
// option (e.g. "Not sure") doesn't have an image.
function OptionImagePlaceholder({ className }: { className: string }) {
  return (
    <div
      className={`${className} bg-gradient-to-br from-orange-safety/10 to-gray-light/40 grid place-items-center text-orange-safety/40`}
      aria-hidden
    >
      <ImageSquare size={16} weight="duotone" />
    </div>
  );
}

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
  images,
  onSelect,
}: {
  stepId: string;
  options: string[];
  value: string | undefined;
  images?: StepImageMap;
  onSelect: (stepId: string, value: string) => void;
}) {
  const stepHasImages = !!images;
  return (
    <ul className="grid gap-2.5">
      {options.map((opt) => {
        const isSelected = value === opt;
        const img = images?.[opt];
        return (
          <li key={opt}>
            <button
              type="button"
              onClick={() => onSelect(stepId, opt)}
              className={[
                "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors cursor-pointer",
                stepHasImages ? "min-h-[68px]" : "min-h-[56px] px-4 py-3.5",
                isSelected
                  ? "border-2 border-orange-safety bg-orange-safety/10"
                  : "border border-gray-light bg-gray-mid hover:border-orange-safety/50",
              ].join(" ")}
            >
              {stepHasImages ? (
                img ? (
                  <OptionImage
                    src={img.src}
                    alt={img.alt ?? opt}
                    className="h-12 w-12 shrink-0 rounded-lg"
                  />
                ) : (
                  <OptionImagePlaceholder className="h-12 w-12 shrink-0 rounded-lg" />
                )
              ) : (
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
              )}

              <span className="flex-1 text-sm sm:text-base font-medium text-white">
                {opt}
              </span>

              {stepHasImages && (
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
              )}
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

  const showEmailError = value.email.trim().length > 0 && !isValidEmail(value.email);
  const showPhoneError =
    value.phone.trim().length > 0 && !isValidAustralianMobile(value.phone);

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
          {f.field === "phone" && showPhoneError && (
            <p className="mt-1.5 text-xs text-orange-safety">
              Enter a valid Australian mobile number, e.g. 04xx xxx xxx.
            </p>
          )}
          {f.field === "email" && showEmailError && (
            <p className="mt-1.5 text-xs text-orange-safety">
              Enter a valid email address so we can send the estimate details.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NSW Suburb Search (local component)
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
            Your preliminary itemised ballpark quote
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

      {/* Range + midpoint card */}
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
        {quote.midpoint !== null && (
          <div className="mt-1.5 text-sm text-gray-text">
            Estimated midpoint:{" "}
            <span className="text-white font-semibold">
              {formatK(quote.midpoint)} AUD
            </span>
          </div>
        )}
        <p className="mt-3 text-sm text-gray-text leading-relaxed">{quote.summary}</p>
      </div>

      {/* Itemised ballpark breakdown */}
      {quote.itemised_breakdown.length > 0 && quote.midpoint !== null && (
        <div className="mt-5 rounded-2xl border border-gray-light bg-gray-mid/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-light">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ListChecks size={16} weight="duotone" className="text-orange-safety" />
              Itemised ballpark breakdown
            </div>
          </div>
          <ul>
            {quote.itemised_breakdown.map((item, i) => (
              <li
                key={item.label}
                className={[
                  "flex items-start justify-between gap-4 px-5 py-3.5",
                  i < quote.itemised_breakdown.length - 1
                    ? "border-b border-gray-light/40"
                    : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="mt-0.5 text-xs text-gray-text leading-relaxed">
                    {item.note}
                  </div>
                </div>
                <div className="text-sm font-semibold text-white tabular-nums whitespace-nowrap">
                  {formatCurrency(item.amount)} AUD
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-gray-light bg-gray-dark/40">
            <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-orange-safety">
              Total midpoint
            </div>
            <div className="text-sm font-semibold text-white tabular-nums">
              {formatCurrency(quote.midpoint)} AUD
            </div>
          </div>
        </div>
      )}

      {/* Cost drivers */}
      {quote.cost_drivers.length > 0 && (
        <div className="mt-5 rounded-2xl border border-gray-light bg-gray-mid/40 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ClipboardText size={16} weight="duotone" className="text-orange-safety" />
            Cost drivers
          </div>
          <ul className="mt-3 space-y-2">
            {quote.cost_drivers.map((d) => (
              <li
                key={d}
                className="flex gap-2 text-sm text-gray-text leading-relaxed"
              >
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
      )}

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
        All figures are shown in AUD and are a ballpark guide only, not a fixed quote.
        Final pricing depends on site access, materials, engineering, approvals, finish
        level and final scope.
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
