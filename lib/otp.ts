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
  const code = process.env.NODE_ENV === "production"
    ? String(Math.floor(100000 + Math.random() * 900000))
    : "000000";

  store.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[OTP] ${phone} → ${code}`); // visible in terminal
  return code;
}

export function verifyOtp(phone: string, code: string): boolean {
  console.log(`[OTP verify] phone="${phone}" code="${code}" storeKeys=[${[...store.keys()].join(",")}]`);
  const entry = store.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return false;
  }
  if (entry.code !== code) return false;
  store.delete(phone);
  return true;
}
