"use client";

import { useState, useRef, useCallback } from "react";
import { Search, Check, Loader2, X } from "lucide-react";

export interface AbnResult {
  abn: string;
  name: string;
  entityType: string;
  state: string;
  postcode: string;
  status: string;
}

export interface AbnSelected {
  abn: string;
  business_name: string;
  state: string;
  postcode: string;
  entity_type: string;
  status: string;
}

interface Props {
  value: AbnSelected | null;
  onChange: (value: AbnSelected | null) => void;
}

function formatABN(abn: string): string {
  const d = abn.replace(/\s/g, "");
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
}

const INPUT_BASE =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-4 py-3.5 text-base text-white placeholder:text-white/35 focus:border-orange-safety focus:outline-none focus:bg-white/[0.06] transition-colors min-h-[52px]";

export default function AbnSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AbnResult[]>([]);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = useCallback(
    (result: AbnResult) => {
      onChange({
        abn: formatABN(result.abn),
        business_name: result.name,
        state: result.state,
        postcode: result.postcode,
        entity_type: result.entityType,
        status: result.status,
      });
      setQuery("");
      setResults([]);
      setError("");
    },
    [onChange],
  );

  const search = useCallback(
    (q: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const digits = q.replace(/\s/g, "");
      setError("");
      setResults([]);
      if (!q.trim()) return;
      if (!/^\d{11}$/.test(digits) && q.trim().length < 3) return;
      timerRef.current = setTimeout(async () => {
        setLooking(true);
        try {
          const res = await fetch(
            `/api/abn-lookup?q=${encodeURIComponent(q.trim())}`,
          );
          const json = (await res.json()) as {
            results: AbnResult[];
            error?: string;
          };
          if (!res.ok) {
            setError("Lookup unavailable. The field is optional — you can skip it.");
            return;
          }
          if (/^\d{11}$/.test(digits) && json.results.length === 1) {
            handleSelect(json.results[0]);
            return;
          }
          if (json.error && json.results.length === 0) {
            setError(json.error);
            return;
          }
          setResults(json.results);
        } catch {
          setError("Could not reach lookup. The field is optional — you can skip it.");
        } finally {
          setLooking(false);
        }
      }, 400);
    },
    [handleSelect],
  );

  function handleClear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setError("");
  }

  if (value) {
    return (
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Check size={14} strokeWidth={2.5} className="text-emerald-300 shrink-0" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-300">
              ABN verified
            </span>
            {value.status && (
              <span
                className={`ml-1 text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 rounded-full whitespace-nowrap ${
                  value.status === "Active"
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-red-400/20 text-red-300"
                }`}
              >
                {value.status}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-white/45 hover:text-white shrink-0"
          >
            <X size={12} /> Clear
          </button>
        </div>
        <p className="text-sm font-semibold text-white truncate">
          {value.business_name}
        </p>
        <p className="text-xs text-white/45 font-mono">ABN {value.abn}</p>
        {(value.entity_type || value.state) && (
          <p className="text-xs text-white/40">
            {[
              value.entity_type,
              value.state && value.postcode
                ? `${value.state} ${value.postcode}`
                : value.state,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="Business name or ABN…"
          className={`${INPUT_BASE} pl-12 pr-12`}
          autoComplete="off"
        />
        {looking && (
          <Loader2
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-safety animate-spin"
          />
        )}
      </div>
      {results.length > 0 && (
        <div className="rounded-lg border border-white/15 bg-black-deep/95 max-h-64 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.abn}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{r.name}</p>
                  <p className="text-xs text-white/45 mt-0.5 font-mono">
                    ABN {formatABN(r.abn)}
                    {r.state ? ` · ${r.state}` : ""}
                    {r.postcode ? ` ${r.postcode}` : ""}
                  </p>
                </div>
                {r.status && (
                  <span
                    className={`text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                      r.status === "Active"
                        ? "bg-emerald-400/20 text-emerald-200"
                        : "bg-red-400/20 text-red-300"
                    }`}
                  >
                    {r.status}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
