"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ShieldCheck, X, Loader2 } from "lucide-react";

interface PhoneVerifyProps {
  phone: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function PhoneVerify({ phone, onVerified, onCancel }: PhoneVerifyProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Format phone to E.164 for Australian numbers
  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) return "+61" + digits.slice(1);
    if (digits.startsWith("61")) return "+" + digits;
    if (digits.startsWith("+")) return raw;
    return "+61" + digits;
  }

  // Initialize the RecaptchaVerifier once on mount
  useEffect(() => {
    if (!recaptchaRef.current || verifierRef.current) return;

    verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
      size: "invisible",
    });

    // Render the widget into the DOM so it can produce tokens
    verifierRef.current.render().catch((err) => {
      console.error("reCAPTCHA render failed:", err);
    });

    return () => {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    };
  }, []);

  const sendOTP = useCallback(async () => {
    if (!verifierRef.current) {
      setError("reCAPTCHA not ready. Please reload and try again.");
      return;
    }
    setSending(true);
    setError("");

    try {
      const result = await signInWithPhoneNumber(auth, formatPhone(phone), verifierRef.current);
      setConfirmation(result);
    } catch (err) {
      console.error("Firebase OTP error:", err);
      const message = err instanceof Error ? err.message : "Failed to send SMS";
      if (message.includes("too-many-requests")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (message.includes("invalid-phone-number")) {
        setError("Invalid phone number. Please check and try again.");
      } else if (message.includes("app-not-authorized") || message.includes("recaptcha")) {
        setError("Verification service error. Please reload the page.");
      } else {
        setError("Could not send verification code. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }, [phone]);

  // Send OTP automatically on mount (after reCAPTCHA renders)
  const hasSentRef = useRef(false);
  useEffect(() => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    // Small delay to let reCAPTCHA render() complete
    const timer = setTimeout(() => sendOTP(), 600);
    return () => clearTimeout(timer);
  }, [sendOTP]);

  function handleInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (next.every((d) => d !== "")) {
      verifyCode(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setCode(digits);
      verifyCode(pasted);
    }
  }

  async function verifyCode(fullCode: string) {
    if (!confirmation) return;
    setVerifying(true);
    setError("");

    try {
      await confirmation.confirm(fullCode);
      onVerified();
    } catch {
      setError("Incorrect code. Please try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black-deep/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-orange-safety" />
            <h3 className="text-lg font-bold text-white">Verify Your Phone</h3>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-text hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status */}
        {sending ? (
          <div className="text-center py-8 space-y-3">
            <Loader2 size={32} className="mx-auto text-orange-safety animate-spin" />
            <p className="text-sm text-gray-text">
              Sending verification code to <span className="text-white font-medium">{phone}</span>
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-text text-center">
              Enter the 6-digit code sent to <span className="text-white font-medium">{phone}</span>
            </p>

            {/* Code inputs */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={verifying}
                  className="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border-2 border-gray-light bg-gray-mid text-center text-xl font-bold text-white focus:border-orange-safety focus:outline-none"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            {/* Verifying state */}
            {verifying && (
              <div className="flex items-center justify-center gap-2 text-sm text-orange-safety">
                <Loader2 size={16} className="animate-spin" />
                Verifying...
              </div>
            )}

            {/* Resend */}
            {!verifying && (
              <button
                onClick={sendOTP}
                className="block mx-auto text-sm text-gray-text hover:text-orange-safety cursor-pointer"
              >
                Didn't receive it? Resend code
              </button>
            )}
          </>
        )}
      </div>

      {/* Invisible reCAPTCHA container */}
      <div ref={recaptchaRef} />
    </div>
  );
}
