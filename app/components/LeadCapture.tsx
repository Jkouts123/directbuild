"use client";

import { useState } from "react";
import { User, Phone, Mail, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import PhoneVerify from "./PhoneVerify";
import SampleQuotePreview from "./SampleQuotePreview";

interface LeadCaptureProps {
  firstName: string;
  phone: string;
  email: string;
  onFirstNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  serviceName: string;
  error?: string;
}

const INPUT =
  "w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3.5 text-base text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none min-h-[48px]";

export default function LeadCapture({
  firstName,
  phone,
  email,
  onFirstNameChange,
  onPhoneChange,
  onEmailChange,
  onSubmit,
  onBack,
  loading,
  serviceName,
  error,
}: LeadCaptureProps) {
  const [showOTP, setShowOTP] = useState(false);
  const isValid = firstName.trim().length > 0 && phone.trim().length >= 8;

  function handleVerifyClick() {
    setShowOTP(true);
  }

  function handleVerified() {
    onSubmit();
    setShowOTP(false);
  }

  // OTP overlay
  if (showOTP) {
    return (
      <PhoneVerify
        phone={phone}
        onVerified={handleVerified}
        onCancel={() => setShowOTP(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black-deep flex flex-col md:relative md:inset-auto md:bg-transparent md:z-auto">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-light md:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-text hover:text-white min-h-[48px] cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <span className="text-xs text-gray-text font-medium uppercase tracking-wider">
          Final Step
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 md:p-0 overflow-y-auto">
        <div className="max-w-md mx-auto w-full space-y-6 md:space-y-8">
          <div className="md:rounded-2xl md:border md:border-gray-light md:bg-gray-dark md:p-8 space-y-6 md:space-y-8">
            {/* Hidden on mobile back button for desktop */}
            <button
              onClick={onBack}
              className="hidden md:inline-flex items-center gap-2 rounded-lg bg-steel/20 px-5 min-h-[48px] text-sm font-semibold text-gray-text hover:text-white cursor-pointer"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-heading)]">
                Almost there!
              </h3>
              <p className="text-sm text-gray-text">
                Enter your details to receive your personalised {serviceName} estimate.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none"
                />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => onFirstNameChange(e.target.value)}
                  placeholder="First name"
                  className={`${INPUT} pl-11`}
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none"
                />
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="04XX XXX XXX"
                  className={`${INPUT} pl-11`}
                  autoComplete="tel"
                />
              </div>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="Email (optional)"
                  className={`${INPUT} pl-11`}
                  autoComplete="email"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center bg-red-400/10 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              onClick={handleVerifyClick}
              disabled={loading || !isValid}
              className={`w-full flex items-center justify-center gap-2 rounded-lg bg-orange-safety px-6 min-h-[56px] text-base font-bold text-black-deep hover:bg-orange-hover cursor-pointer ${
                loading || !isValid ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              Verify & Get My {serviceName} Quote
              <ArrowRight size={18} />
            </button>

            {/* Trust signal */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-text">
              <ShieldCheck size={14} className="text-orange-safety" />
              <span>We&apos;ll send a quick SMS to verify your number. No spam, ever.</span>
            </div>
          </div>

          {/* Sample quote preview */}
          <SampleQuotePreview serviceName={serviceName} />
        </div>
      </div>
    </div>
  );
}
