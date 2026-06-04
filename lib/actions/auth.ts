"use server";

import { cookies } from "next/headers";
import pool from "@/lib/db";
import { generateOtp, verifyOtp } from "@/lib/otp";

export type UserSession = {
  uid: string;
  name: string;
  phone: string;
  city?: string;
  role: "user" | "partner";
};

const COOKIE = "pwa_session";

export async function getSession(): Promise<UserSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString()) as UserSession;
  } catch {
    return null;
  }
}

async function setSession(session: UserSession) {
  const jar = await cookies();
  jar.set(COOKIE, Buffer.from(JSON.stringify(session)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

// ── Step 1: send OTP ──────────────────────────────────────
export async function requestOtp(
  phone: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = phone.replace(/\D/g, "");
  if (normalized.length < 9 || normalized.length > 13) {
    return { ok: false, error: "Nomor HP tidak valid" };
  }
  generateOtp(normalized);
  return { ok: true };
}

// ── Step 2: verify OTP + create user ─────────────────────
export async function verifyAndCreateUser(data: {
  phone: string;
  code: string;
  name: string;
  city: string;
  email?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const phone = data.phone.replace(/\D/g, "");

  if (!verifyOtp(phone, data.code)) {
    return { ok: false, error: "Kode OTP salah atau sudah kadaluarsa" };
  }

  // Check if user already exists
  const existing = await pool.query("SELECT uid FROM users WHERE phone=$1", [phone]);
  if (existing.rows.length > 0) {
    const uid = existing.rows[0].uid;
    await setSession({ uid, name: data.name, phone, city: data.city, role: "user" });
    return { ok: true };
  }

  const uid = crypto.randomUUID();
  await pool.query(
    `INSERT INTO users (uid, name, phone, city, email, is_active, total_orders, created_at)
     VALUES ($1,$2,$3,$4,$5,true,0,NOW())`,
    [uid, data.name, phone, data.city, data.email || null]
  );

  await setSession({ uid, name: data.name, phone, city: data.city, role: "user" });
  return { ok: true };
}

// ── Step 2 (login): verify OTP + login existing user ─────
export async function loginUser(data: {
  phone: string;
  code: string;
  role?: "user" | "partner";
}): Promise<{
  ok: boolean;
  error?: string;
  notFound?: boolean;
  needRoleSelect?: boolean;
}> {
  const phone = data.phone.replace(/\D/g, "");

  // Cocokkan kedua format: "87654321098" dan "+6287654321098"
  const phoneNorm = `WHERE regexp_replace(phone, '^\\+62|^62', '') = $1`;
  let userRes: { rows: { uid: string; name: string; phone: string; city: string }[] };
  let partnerRes: { rows: { uid: string; name: string; phone: string; city: string }[] };
  try {
    [userRes, partnerRes] = await Promise.all([
      pool.query(`SELECT uid, name, phone, city FROM users ${phoneNorm}`, [phone]),
      pool.query(`SELECT uid, name, phone, city FROM partners ${phoneNorm}`, [phone]),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Koneksi database gagal";
    return { ok: false, error: msg };
  }

  const isUser = userRes.rows.length > 0;
  const isPartner = partnerRes.rows.length > 0;

  if (!isUser && !isPartner) {
    return { ok: false, notFound: true, error: "Nomor HP belum terdaftar. Silakan buat akun dulu." };
  }

  // Kalau ada di dua-duanya dan belum pilih role — tanya dulu, OTP belum diverifikasi
  if (isUser && isPartner && !data.role) {
    return { ok: false, needRoleSelect: true };
  }

  // Verifikasi OTP baru setelah role jelas
  if (!verifyOtp(phone, data.code)) {
    return { ok: false, error: "Kode OTP salah atau sudah kadaluarsa" };
  }

  const useAsPartner = isPartner && (!isUser || data.role === "partner");
  const row = useAsPartner ? partnerRes.rows[0] : userRes.rows[0];
  const role = useAsPartner ? "partner" : "user";

  await setSession({ uid: row.uid, name: row.name, phone: row.phone, city: row.city, role });
  return { ok: true, role };
}

// ── Step 2 (mitra): verify OTP only, no DB insert yet ────
export async function verifyOtpForMitra(
  phone: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = phone.replace(/\D/g, "");
  if (!verifyOtp(normalized, code)) {
    return { ok: false, error: "Kode OTP salah atau sudah kadaluarsa" };
  }
  return { ok: true };
}
