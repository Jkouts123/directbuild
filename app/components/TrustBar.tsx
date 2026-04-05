"use client";

import { ShieldCheck, Handshake, Flag, Timer } from "@phosphor-icons/react";

const badges = [
  { icon: ShieldCheck, label: "Licensed contractors only" },
  { icon: Handshake, label: "Free no obligation quote" },
  { icon: Flag, label: "Australian owned & operated" },
  { icon: Timer, label: "60 second estimate" },
];

export default function TrustBar() {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {badges.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
        >
          <Icon size={14} weight="fill" className="text-orange-safety shrink-0" />
          {label}
        </span>
      ))}
    </div>
  );
}
