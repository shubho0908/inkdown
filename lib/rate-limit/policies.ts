export type RateLimitPolicy = {
  /** Sliding window length in milliseconds. */
  windowMs: number;
  max: number;
};

/** Per-recipient auth email sends (verification + password reset). */
export const AUTH_EMAIL_RECIPIENT: RateLimitPolicy = {
  windowMs: 60 * 60 * 1000,
  max: 3,
};

/** Verification gate PRG resend — per IP. */
export const VERIFICATION_GATE_RESEND_IP: RateLimitPolicy = {
  windowMs: 60 * 60 * 1000,
  max: 3,
};

/** Sign-up email enumeration probe — per IP. */
export const CHECK_EMAIL_IP: RateLimitPolicy = {
  windowMs: 60 * 1000,
  max: 5,
};
