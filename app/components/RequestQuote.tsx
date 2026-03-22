"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface RequestQuoteProps {
  service: string;
}

export default function RequestQuote({ service }: RequestQuoteProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gray-light bg-gray-dark p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-safety/20">
          <Send className="text-orange-safety" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request Received</h3>
        <p className="text-gray-text">
          A vetted {service.toLowerCase()} specialist will be in touch within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8 space-y-5"
    >
      <h3 className="text-xl font-bold text-white">
        Request a {service} Quote
      </h3>
      <p className="text-sm text-gray-text">
        Get matched with a vetted tradie. Free, no obligation.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder="Full name"
          className="w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none transition-colors"
        />
        <input
          type="tel"
          required
          placeholder="Phone number"
          className="w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none transition-colors"
        />
      </div>

      <input
        type="email"
        required
        placeholder="Email address"
        className="w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none transition-colors"
      />

      <input
        type="text"
        required
        placeholder="Suburb / Postcode"
        className="w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none transition-colors"
      />

      <textarea
        rows={3}
        placeholder="Tell us about your project..."
        className="w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none transition-colors resize-none"
      />

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-safety px-6 py-3 text-sm font-bold text-black-deep hover:bg-orange-hover transition-colors cursor-pointer"
      >
        <Send size={16} />
        Get My Free Quote
      </button>
    </form>
  );
}
