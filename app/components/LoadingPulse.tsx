"use client";

import { Home } from "lucide-react";

interface LoadingPulseProps {
  service: string;
}

export default function LoadingPulse({ service }: LoadingPulseProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-deep/98 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 px-6 text-center max-w-sm">
        {/* Brand icon pulse */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-safety/10 border-2 border-orange-safety/30 animate-brand-pulse">
            <Home className="text-orange-safety" size={36} />
          </div>
          <div className="absolute -inset-3 rounded-3xl border border-orange-safety/10 animate-brand-pulse" style={{ animationDelay: "0.3s" }} />
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-safety animate-dot-1" />
          <div className="h-3 w-3 rounded-full bg-orange-safety animate-dot-2" />
          <div className="h-3 w-3 rounded-full bg-orange-safety animate-dot-3" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-lg font-bold text-white font-[family-name:var(--font-heading)]">
            Calculating your 2026 Sydney rates...
          </p>
          <p className="text-sm text-gray-text">
            Our AI is analysing {service} market data to build your personalised estimate.
          </p>
        </div>

        {/* Progress shimmer */}
        <div className="w-full h-1.5 rounded-full bg-gray-light overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-safety/60 via-orange-safety to-orange-safety/60"
            style={{
              animation: "shimmer 2s ease-in-out infinite",
              width: "40%",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
