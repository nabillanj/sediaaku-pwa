import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

// GET: ambil notif terbaru + jumlah unread
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT id, title, body, type, order_id, url, is_read, created_at
     FROM notifications WHERE uid = $1
     ORDER BY created_at DESC LIMIT 50`,
    [session.uid]
  );

  const unread = rows.filter((r) => !r.is_read).length;
  return NextResponse.json({ notifications: rows, unread });
}

// PATCH: mark semua / satu sebagai read
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));

  if (id) {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND uid = $2`,
      [id, session.uid]
    );
  } else {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE uid = $1`,
      [session.uid]
    );
  }

  return NextResponse.json({ ok: true });
}
