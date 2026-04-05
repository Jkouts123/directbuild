"use client";

import { Lock } from "@phosphor-icons/react";

const SAMPLE_ITEMS: Record<string, { label: string; description: string }[]> = {
  Solar: [
    { label: "Solar Panels (6.6kW)", description: "Tier 1 monocrystalline panels, supply & install" },
    { label: "Hybrid Inverter", description: "5kW hybrid inverter with monitoring" },
    { label: "Mounting & Racking", description: "Roof-mount rails, brackets and flashing" },
    { label: "Electrical & Metering", description: "Switchboard upgrade, smart meter config" },
  ],
  HVAC: [
    { label: "Split System Unit", description: "7kW inverter split system, supply only" },
    { label: "Installation Labour", description: "Licensed install incl. pipework & electrical" },
    { label: "Pipework & Drainage", description: "Copper pipe run, conduit and condensate drain" },
    { label: "Commissioning & Testing", description: "System gas check, startup and testing" },
  ],
  Landscaping: [
    { label: "Turf Supply & Laying", description: "Sir Walter Buffalo, soil prep & install" },
    { label: "Paving & Hardscape", description: "Concrete pavers, base prep & laying" },
    { label: "Retaining Wall", description: "Timber sleeper wall, drainage & backfill" },
    { label: "Site Cleanup & Waste", description: "Skip bin, green waste removal & cleanup" },
  ],
  Roofing: [
    { label: "Roof Tile Replacement", description: "Colorbond supply & install incl. battens" },
    { label: "Fascia & Gutter Work", description: "New fascia boards and gutter replacement" },
    { label: "Scaffolding & Safety", description: "Full scaffolding setup and safety equipment" },
    { label: "Waste Disposal", description: "Old roof material removal and tip fees" },
  ],
  "Granny Flat": [
    { label: "Structure & Shell", description: "Timber frame, cladding, roofing & insulation" },
    { label: "Plumbing & Electrical", description: "Full fit-out incl. separate metering" },
    { label: "Kitchen & Bathroom", description: "Joinery, fixtures, tiling & waterproofing" },
    { label: "Council Approvals", description: "CDC or DA lodgement, certifier fees" },
  ],
};

interface SampleQuotePreviewProps {
  serviceName: string;
}

export default function SampleQuotePreview({ serviceName }: SampleQuotePreviewProps) {
  const items = SAMPLE_ITEMS[serviceName] || SAMPLE_ITEMS["Solar"];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-dark">
      <div className="select-none pointer-events-none px-4 sm:px-5 py-5 sm:py-6 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-orange-safety/60 shrink-0" />
          <p className="text-sm font-semibold text-white/70">Your {serviceName} Estimate</p>
        </div>

        {/* Price range — blurred */}
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 sm:px-4 py-4 sm:py-5 text-center space-y-1">
          <p className="text-xs text-white/40">Estimated Range</p>
          <p className="text-2xl sm:text-3xl font-bold text-orange-safety/70 blur-[6px]">
            $12,400 – $16,800
          </p>
          <p className="text-xs text-white/30 blur-[5px]">Centre estimate: $14,600</p>
        </div>

        {/* Line items — labels readable, prices blurred */}
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/5 px-3 sm:px-4 py-2.5 sm:py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/80 truncate">{item.label}</p>
              <p className="text-xs text-white/40 truncate">{item.description}</p>
            </div>
            <span className="text-sm font-semibold text-orange-safety/60 blur-[5px] shrink-0">
              $3,450
            </span>
          </div>
        ))}
      </div>

      {/* Overlay with CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black-deep/30 px-4 sm:px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-safety/20 mb-3">
          <Lock size={20} weight="fill" className="text-orange-safety" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">
          Your itemised quote will look like this
        </p>
        <p className="text-xs text-white/50">
          Unlocks after phone verification
        </p>
      </div>
    </div>
  );
}
