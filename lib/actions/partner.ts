"use server";

import pool from "@/lib/db";
import { cookies } from "next/headers";
import { getSession } from "@/lib/actions/auth";

const COOKIE = "pwa_session";

export async function updateMitraProfile(data: {
  name: string;
  city: string;
  domicileDetail?: string;
  gender: string;
  birthDate: string;
  bio?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "partner") return { ok: false, error: "Unauthorized" };

  await pool.query(
    `UPDATE partners
     SET name=$1, city=$2, domicile_detail=$3, gender=$4, birth_date=$5, bio=$6,
         verify_status = CASE WHEN verify_status='rejected' THEN 'pending' ELSE verify_status END
     WHERE uid=$7`,
    [data.name, data.city, data.domicileDetail || null, data.gender, data.birthDate, data.bio || null, session.uid]
  );

  const jar = await cookies();
  const updated = { ...session, name: data.name, city: data.city };
  jar.set(COOKIE, Buffer.from(JSON.stringify(updated)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return { ok: true };
}

export async function updateMitraServices(
  services: Array<{ categoryId: string; ratePerHour: number; skills: string[] }>
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "partner") return { ok: false, error: "Unauthorized" };

  const uid = session.uid;

  // Reset to pending if previously rejected
  await pool.query(
    `UPDATE partners SET verify_status='pending' WHERE uid=$1 AND verify_status='rejected'`,
    [uid]
  );

  // Deactivate all current services
  await pool.query(`UPDATE partner_services SET is_active=false WHERE partner_uid=$1`, [uid]);

  for (const svc of services) {
    await pool.query(
      `INSERT INTO partner_services (partner_uid, category_id, rate_per_hour, is_active)
       VALUES ($1,$2,$3,true)
       ON CONFLICT (partner_uid, category_id) DO UPDATE SET rate_per_hour=$3, is_active=true`,
      [uid, svc.categoryId, svc.ratePerHour]
    );

    // Replace skills for this category
    await pool.query(
      `DELETE FROM partner_skills WHERE partner_uid=$1 AND category_id=$2`,
      [uid, svc.categoryId]
    );
    for (const skill of svc.skills) {
      await pool.query(
        `INSERT INTO partner_skills (id, partner_uid, category_id, skill_name) VALUES ($1,$2,$3,$4)`,
        [crypto.randomUUID(), uid, svc.categoryId, skill]
      );
    }
  }

  return { ok: true };
}

export async function updateMitraDokumen(data: {
  ktpUrl?: string;
  selfieUrl?: string;
  domisiliDocUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "partner") return { ok: false, error: "Unauthorized" };

  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (data.ktpUrl) { updates.push(`ktp_url=$${i++}`); values.push(data.ktpUrl); }
  if (data.selfieUrl) { updates.push(`selfie_url=$${i++}`); values.push(data.selfieUrl); }
  if (data.domisiliDocUrl !== undefined) { updates.push(`domisili_doc_url=$${i++}`); values.push(data.domisiliDocUrl || null); }

  if (updates.length === 0) return { ok: true };

  // Also reset to pending if previously rejected
  updates.push(`verify_status = CASE WHEN verify_status='rejected' THEN 'pending' ELSE verify_status END`);

  values.push(session.uid);
  await pool.query(`UPDATE partners SET ${updates.join(",")} WHERE uid=$${i}`, values);
  return { ok: true };
}

export type Category = {
  id: string;
  name: string;
  description: string;
  emoji: string;
};

export async function listCategories(): Promise<Category[]> {
  const { rows } = await pool.query(
    "SELECT id, name, description, emoji FROM categories WHERE is_active=true ORDER BY display_order"
  );
  return rows;
}

export async function createPartner(data: {
  phone: string;
  name: string;
  city: string;
  domicileDetail?: string;
  gender: string;
  birthDate: string;
  bio?: string;
  serviceRadiusKm?: number;
  ktpUrl: string;
  selfieUrl: string;
  domisiliDocUrl?: string;
  services: Array<{ categoryId: string; ratePerHour: number; skills: string[] }>;
}): Promise<{ ok: boolean; error?: string; uid?: string }> {
  const phone = data.phone.replace(/\D/g, "");

  // Check if partner already exists
  const existing = await pool.query("SELECT uid FROM partners WHERE phone=$1", [phone]);
  if (existing.rows.length > 0) {
    return { ok: true, uid: existing.rows[0].uid };
  }

  const uid = crypto.randomUUID();

  await pool.query(
    `INSERT INTO partners (
      uid, name, phone, city, domicile_detail, gender, birth_date,
      photo_url, ktp_url, selfie_url, domisili_doc_url, bio,
      min_hours, verify_status, is_online, is_active,
      rating, total_reviews, total_jobs, balance, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,$8,$9,$10,$11,2,'pending',false,true,NULL,0,0,0,NOW())`,
    [
      uid, data.name, phone, data.city,
      data.domicileDetail || null,
      data.gender, data.birthDate,
      data.ktpUrl, data.selfieUrl,
      data.domisiliDocUrl || null,
      data.bio || null,
    ]
  );

  // Insert default availability row with the partner's chosen service radius
  const radiusKm = data.serviceRadiusKm ?? 10;
  await pool.query(
    `INSERT INTO availability (id, partner_uid, work_start_time, work_end_time,
       min_duration_hours, max_radius_km, min_booking_lead_hours, overtime_percent, updated_at)
     VALUES ($1,$2,'08:00','17:00',2,$3,1,20,NOW())`,
    [crypto.randomUUID(), uid, radiusKm]
  );

  // Insert services + skills
  for (const svc of data.services) {
    await pool.query(
      `INSERT INTO partner_services (partner_uid, category_id, rate_per_hour, is_active)
       VALUES ($1,$2,$3,true)
       ON CONFLICT (partner_uid, category_id) DO UPDATE SET rate_per_hour=$3`,
      [uid, svc.categoryId, svc.ratePerHour]
    );
    for (const skill of svc.skills) {
      await pool.query(
        `INSERT INTO partner_skills (id, partner_uid, category_id, skill_name)
         VALUES ($1,$2,$3,$4)`,
        [crypto.randomUUID(), uid, svc.categoryId, skill]
      );
    }
  }

  // Set session as partner
  const jar = await cookies();
  const session = { uid, name: data.name, phone, role: "partner" };
  jar.set("pwa_session", Buffer.from(JSON.stringify(session)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return { ok: true, uid };
}
