"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, Loader2, Check } from "lucide-react";

export interface SuburbEntry {
  suburb: string;
  state: string;
  postcode: string;
}

interface SuburbSearchProps {
  value: string;
  onChange: (display: string, entry: SuburbEntry) => void;
}

export default function SuburbSearch({ value, onChange }: SuburbSearchProps) {
  const [allSuburbs, setAllSuburbs] = useState<SuburbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load suburb data once
  useEffect(() => {
    fetch("/data/australian-suburbs.json")
      .then((r) => r.json())
      .then((data: SuburbEntry[]) => {
        setAllSuburbs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useCallback(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: SuburbEntry[] = [];
    for (const s of allSuburbs) {
      if (
        s.suburb.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.postcode.includes(q)
      ) {
        results.push(s);
        if (results.length >= 20) break;
      }
    }
    return results;
  }, [query, allSuburbs]);

  const results = filtered();

  function handleSelect(entry: SuburbEntry) {
    const display = `${entry.suburb} ${entry.state} ${entry.postcode}`;
    onChange(display, entry);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : value || query}
          placeholder={
            loading ? "Loading suburbs..." : "Search suburb, state or postcode..."
          }
          disabled={loading}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          className="w-full rounded-lg border border-gray-light bg-gray-mid pl-11 pr-10 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none transition-colors"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-gray-text" />
          ) : (
            <ChevronDown
              size={16}
              className={`text-gray-text transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-light bg-gray-dark shadow-xl max-h-64 overflow-y-auto">
          {query.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-text text-center">
              Start typing to search...
            </p>
          )}
          {query.length > 0 && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-text text-center">
              No suburbs found
            </p>
          )}
          {results.map((entry) => {
            const display = `${entry.suburb} ${entry.state} ${entry.postcode}`;
            const isSelected = value === display;
            return (
              <button
                key={display}
                type="button"
                onClick={() => handleSelect(entry)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-mid transition-colors cursor-pointer"
              >
                <Check
                  size={14}
                  className={`shrink-0 text-orange-safety ${isSelected ? "opacity-100" : "opacity-0"}`}
                />
                <span className="text-white">
                  {entry.suburb}{" "}
                  <span className="text-gray-text">
                    {entry.state} {entry.postcode}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected badge */}
      {value && !open && (
        <p className="mt-2 text-xs text-gray-text">
          Selected: <span className="text-orange-safety font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}
