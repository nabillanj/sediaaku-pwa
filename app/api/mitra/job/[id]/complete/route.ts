import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "partner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { proofUrls, completionNote } = await req.json();

  if (!proofUrls?.length) {
    return NextResponse.json({ error: "Foto bukti wajib diupload" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT id, order_status, user_uid, partner_earning FROM orders WHERE id = $1 AND partner_uid = $2`,
    [id, session.uid]
  );
  const order = rows[0];
  if (!order || order.order_status !== "in_progress") {
    return NextResponse.json({ error: "Order tidak valid" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // complete order
    await client.query(
      `UPDATE orders SET order_status='completed', completed_at=NOW(), completion_note=$1 WHERE id=$2`,
      [completionNote ?? null, id]
    );

    // insert proof photos — tampil di CMS dan detail order user
    for (const url of proofUrls) {
      await client.query(
        `INSERT INTO order_proof_photos (id, order_id, photo_url) VALUES ($1, $2, $3)`,
        [crypto.randomUUID(), id, url]
      );
    }

    // credit partner balance
    await client.query(
      `UPDATE partners SET balance = balance + $1, total_jobs = total_jobs + 1 WHERE uid = $2`,
      [order.partner_earning, session.uid]
    );

    // increment user total_orders
    await client.query(
      `UPDATE users SET total_orders = total_orders + 1 WHERE uid = $1`,
      [order.user_uid]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Complete job error:", e);
    return NextResponse.json({ error: "Gagal menyelesaikan sesi" }, { status: 500 });
  } finally {
    client.release();
  }
}
