"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, Loader2, Check, X } from "lucide-react";

export interface SuburbEntry {
  suburb: string;
  state: string;
  postcode: string;
}

interface MultiSuburbSearchProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiSuburbSearch({
  values,
  onChange,
  placeholder = "Search suburb, state or postcode...",
}: MultiSuburbSearchProps) {
  const [allSuburbs, setAllSuburbs] = useState<SuburbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/australian-suburbs.json")
      .then((r) => r.json())
      .then((data: SuburbEntry[]) => {
        setAllSuburbs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
    if (!values.includes(display)) {
      onChange([...values, display]);
    }
    setQuery("");
    inputRef.current?.focus();
  }

  function removeValue(val: string) {
    onChange(values.filter((v) => v !== val));
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
          value={query}
          placeholder={loading ? "Loading suburbs..." : placeholder}
          disabled={loading}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          className="w-full rounded-lg border border-gray-light bg-gray-mid pl-11 pr-10 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none min-h-[48px]"
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

      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-light bg-gray-dark shadow-xl max-h-64 overflow-y-auto">
          {query.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-text text-center">
              Start typing to search...
            </p>
          )}
          {query.length > 0 && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-text text-center">No suburbs found</p>
          )}
          {results.map((entry) => {
            const display = `${entry.suburb} ${entry.state} ${entry.postcode}`;
            const isSelected = values.includes(display);
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

      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 rounded-full bg-orange-safety/10 border border-orange-safety/30 px-2.5 py-1 text-xs text-orange-safety font-medium"
            >
              {val}
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
