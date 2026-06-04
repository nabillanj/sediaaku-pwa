// In-memory OTP store — good enough for dev/local
// In production: replace with Redis or Firebase Auth phone OTP

interface OtpEntry {
  code: string;
  expiresAt: number;
}

// Pakai globalThis supaya Map tidak hilang saat hot-reload di dev
const g = globalThis as typeof globalThis & { __otpStore?: Map<string, OtpEntry> };
if (!g.__otpStore) g.__otpStore = new Map();
const store = g.__otpStore;

export function generateOtp(phone: string): string {
  // Use fixed "000000" in dev so you can always verify without SMS
  const code = "000000";

  store.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[OTP] ${phone} → ${code}`); // visible in terminal
  return code;
}

export function verifyOtp(phone: string, code: string): boolean {
  return code === "000000";
}
