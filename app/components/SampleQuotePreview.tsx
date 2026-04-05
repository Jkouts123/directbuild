"use client";

import { Lock } from "@phosphor-icons/react";

export default function SampleQuotePreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-dark">
      {/* Blurred fake quote content */}
      <div className="select-none blur-[6px] pointer-events-none px-5 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-orange-safety/60" />
          <div className="h-4 w-40 rounded bg-white/20" />
        </div>

        {/* Price range */}
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center space-y-1">
          <div className="h-3 w-24 mx-auto rounded bg-white/15" />
          <div className="h-7 w-56 mx-auto rounded bg-orange-safety/30" />
          <div className="h-3 w-32 mx-auto rounded bg-white/10" />
        </div>

        {/* Summary text */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-white/10" />
          <div className="h-3 w-4/5 rounded bg-white/10" />
        </div>

        {/* Line items */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-white/8 bg-white/5 px-4 py-3"
          >
            <div className="space-y-1">
              <div className="h-3.5 rounded bg-white/15" style={{ width: `${100 + i * 30}px` }} />
              <div className="h-2.5 rounded bg-white/8" style={{ width: `${140 + i * 20}px` }} />
            </div>
            <div className="h-4 w-14 rounded bg-orange-safety/20" />
          </div>
        ))}
      </div>

      {/* Overlay with CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black-deep/40 backdrop-blur-[1px] px-6 text-center">
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
