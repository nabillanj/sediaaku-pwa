"use server";

import pool from "@/lib/db";
import { cookies } from "next/headers";
import { getSession } from "@/lib/actions/auth";

export async function updateUserProfile(data: {
  name: string;
  city: string;
  email?: string;
}) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sesi tidak ditemukan" };

  const name = data.name.trim();
  const city = data.city.trim();
  const email = data.email?.trim() || null;

  if (!name || !city) return { ok: false, error: "Nama dan kota wajib diisi" };

  await pool.query(
    `UPDATE users SET name=$1, city=$2, email=$3 WHERE uid=$4`,
    [name, city, email, session.uid]
  );

  const jar = await cookies();
  const updated = { ...session, name, city };
  jar.set("pwa_session", Buffer.from(JSON.stringify(updated)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return { ok: true };
}

export async function updatePartnerProfile(data: {
  name: string;
  city: string;
  domicileDetail?: string;
  bio?: string;
}) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sesi tidak ditemukan" };

  const name = data.name.trim();
  const city = data.city.trim();
  if (!name || !city) return { ok: false, error: "Nama dan kota wajib diisi" };

  await pool.query(
    `UPDATE partners SET name=$1, city=$2, domicile_detail=$3, bio=$4 WHERE uid=$5`,
    [name, city, data.domicileDetail?.trim() || null, data.bio?.trim() || null, session.uid]
  );

  const jar = await cookies();
  const updated = { ...session, name, city };
  jar.set("pwa_session", Buffer.from(JSON.stringify(updated)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return { ok: true };
}

export async function updatePhotoUrl(photoUrl: string) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sesi tidak ditemukan" };

  const table = session.role === "partner" ? "partners" : "users";
  await pool.query(`UPDATE ${table} SET photo_url=$1 WHERE uid=$2`, [photoUrl, session.uid]);
  return { ok: true };
}

export async function getFullUserProfile() {
  const session = await getSession();
  if (!session) return null;

  if (session.role === "partner") {
    const { rows } = await pool.query(
      `SELECT name, phone, city, domicile_detail, bio, gender, birth_date, photo_url
       FROM partners WHERE uid=$1`,
      [session.uid]
    );
    return rows[0] ? { ...rows[0], role: "partner" } : null;
  } else {
    const { rows } = await pool.query(
      `SELECT name, phone, city, email, photo_url FROM users WHERE uid=$1`,
      [session.uid]
    );
    return rows[0] ? { ...rows[0], role: "user" } : null;
  }
}
