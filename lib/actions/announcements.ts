"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  target_type: string;
  starts_at: string;
  created_at: string;
  is_read: boolean;
};

export async function getAnnouncementsForUser(uid: string, role: "user" | "partner"): Promise<AnnouncementItem[]> {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.body, a.target_type, a.starts_at, a.created_at,
              (ar.user_uid IS NOT NULL) AS is_read
       FROM announcements a
       LEFT JOIN announcement_reads ar
         ON ar.announcement_id = a.id AND ar.user_uid = $1
       WHERE a.starts_at <= NOW()
         AND (
           a.target_type = 'all'
           OR a.target_type = $2
           OR (a.target_type = 'specific' AND a.target_uid = $1)
         )
       ORDER BY a.created_at DESC`,
      [uid, role]
    );
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      body: String(r.body),
      target_type: String(r.target_type),
      starts_at: String(r.starts_at),
      created_at: String(r.created_at),
      is_read: Boolean(r.is_read),
    }));
  } catch {
    return [];
  }
}

export async function getUnreadCount(uid: string, role: "user" | "partner"): Promise<number> {
  try {
    const [ann, notif] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS count
         FROM announcements a
         LEFT JOIN announcement_reads ar
           ON ar.announcement_id = a.id AND ar.user_uid = $1
         WHERE a.starts_at <= NOW()
           AND ar.user_uid IS NULL
           AND (
             a.target_type = 'all'
             OR a.target_type = $2
             OR (a.target_type = 'specific' AND a.target_uid = $1)
           )`,
        [uid, role]
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM notifications WHERE uid = $1 AND is_read = false`,
        [uid]
      ),
    ]);
    return Number(ann.rows[0]?.count ?? 0) + Number(notif.rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function markAllAsRead(uid: string, announcementIds: string[]) {
  if (announcementIds.length === 0) return;
  const values = announcementIds.map((id, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ");
  const params = announcementIds.flatMap((id) => [id, uid]);
  await pool.query(
    `INSERT INTO announcement_reads (announcement_id, user_uid)
     VALUES ${values}
     ON CONFLICT DO NOTHING`,
    params
  );
  revalidatePath("/notifications");
}
