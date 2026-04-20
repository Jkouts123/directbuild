/**
 * Client-readable feature flags.
 *
 * Flags must use NEXT_PUBLIC_ prefix so they are bundled into the client.
 * Defaults are designed to be safe: production behaviour stays unchanged
 * unless an env var is explicitly set.
 */

// Firebase phone OTP verification. Disable for testing by setting
// NEXT_PUBLIC_OTP_VERIFICATION_ENABLED=false in Vercel env. Any other
// value (or unset) keeps OTP enabled.
export const OTP_VERIFICATION_ENABLED =
  process.env.NEXT_PUBLIC_OTP_VERIFICATION_ENABLED !== "false";
