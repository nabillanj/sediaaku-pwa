"use server";

import pool from "@/lib/db";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export type UserAddress = {
  id: string;
  label: string;
  address: string;
  kabupaten: string;
  latitude: number | null;
  longitude: number | null;
  street_name: string | null;
  is_default: boolean;
};

// Ensure street_name column exists — runs once, safe to call repeatedly
async function ensureStreetNameColumn() {
  await pool.query(
    `ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS street_name VARCHAR(200)`
  );
}

export async function listAddresses(): Promise<UserAddress[]> {
  const session = await getSession();
  if (!session) return [];

  await ensureStreetNameColumn();

  const { rows } = await pool.query(
    `SELECT id, label, address, kabupaten, latitude, longitude, street_name, is_default
     FROM user_addresses WHERE user_uid = $1
     ORDER BY is_default DESC, created_at DESC`,
    [session.uid]
  );
  return rows;
}

export async function createAddress(data: {
  label: string;
  address: string;
  kabupaten: string;
  latitude: number | null;
  longitude: number | null;
  streetName: string | null;
  isDefault: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sesi tidak ditemukan" };

  const label = data.label.trim();
  const address = data.address.trim();
  if (!label) return { ok: false, error: "Label alamat wajib diisi" };
  if (!address) return { ok: false, error: "Alamat lengkap wajib diisi" };
  if (!data.kabupaten) return { ok: false, error: "Kota / kabupaten wajib dipilih" };

  await ensureStreetNameColumn();

  if (data.isDefault) {
    await pool.query(
      `UPDATE user_addresses SET is_default = false WHERE user_uid = $1`,
      [session.uid]
    );
  }

  await pool.query(
    `INSERT INTO user_addresses (id, user_uid, label, address, kabupaten, latitude, longitude, street_name, is_default, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [
      crypto.randomUUID(),
      session.uid,
      label,
      address,
      data.kabupaten,
      data.latitude,
      data.longitude,
      data.streetName,
      data.isDefault,
    ]
  );

  revalidatePath("/profile/addresses");
  return { ok: true };
}

export async function getAddress(id: string): Promise<UserAddress | null> {
  const session = await getSession();
  if (!session) return null;

  await ensureStreetNameColumn();

  const { rows } = await pool.query(
    `SELECT id, label, address, kabupaten, latitude, longitude, street_name, is_default
     FROM user_addresses WHERE id = $1 AND user_uid = $2`,
    [id, session.uid]
  );
  return rows[0] ?? null;
}

export async function updateAddress(
  id: string,
  data: {
    label: string;
    address: string;
    kabupaten: string;
    latitude: number | null;
    longitude: number | null;
    streetName: string | null;
    isDefault: boolean;
  }
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sesi tidak ditemukan" };

  const label = data.label.trim();
  const address = data.address.trim();
  if (!label) return { ok: false, error: "Label alamat wajib diisi" };
  if (!address) return { ok: false, error: "Alamat lengkap wajib diisi" };
  if (!data.kabupaten) return { ok: false, error: "Kota / kabupaten wajib dipilih" };

  await ensureStreetNameColumn();

  if (data.isDefault) {
    await pool.query(
      `UPDATE user_addresses SET is_default = false WHERE user_uid = $1`,
      [session.uid]
    );
  }

  await pool.query(
    `UPDATE user_addresses
     SET label=$1, address=$2, kabupaten=$3, latitude=$4, longitude=$5, street_name=$6, is_default=$7
     WHERE id=$8 AND user_uid=$9`,
    [label, address, data.kabupaten, data.latitude, data.longitude, data.streetName, data.isDefault, id, session.uid]
  );

  revalidatePath("/profile/addresses");
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };

  await pool.query(
    `DELETE FROM user_addresses WHERE id = $1 AND user_uid = $2`,
    [id, session.uid]
  );
  revalidatePath("/profile/addresses");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };

  await pool.query(
    `UPDATE user_addresses SET is_default = false WHERE user_uid = $1`,
    [session.uid]
  );
  await pool.query(
    `UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_uid = $2`,
    [id, session.uid]
  );
  revalidatePath("/profile/addresses");
  return { ok: true };
}
