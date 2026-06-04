import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { rating, comment } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating tidak valid" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT id, partner_uid, order_status FROM orders WHERE id = $1 AND user_uid = $2`,
    [id, session.uid]
  );
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  if (order.order_status !== "completed") {
    return NextResponse.json({ error: "Pesanan belum selesai" }, { status: 400 });
  }

  const { rows: existing } = await pool.query(
    `SELECT id FROM reviews WHERE order_id = $1`,
    [id]
  );
  if (existing.length > 0) {
    return NextResponse.json({ error: "Ulasan sudah diberikan" }, { status: 409 });
  }

  await pool.query(
    `INSERT INTO reviews (id, order_id, user_uid, partner_uid, rating, comment, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [crypto.randomUUID(), id, session.uid, order.partner_uid, rating, comment || null]
  );

  // update partner avg rating
  await pool.query(
    `UPDATE partners SET
       rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE partner_uid = $1),
       total_reviews = (SELECT COUNT(*) FROM reviews WHERE partner_uid = $1)
     WHERE uid = $1`,
    [order.partner_uid]
  );

  return NextResponse.json({ ok: true });
}
