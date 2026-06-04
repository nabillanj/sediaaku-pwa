import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import { notify } from "@/lib/notify";

const NOTIFY_MSG: Record<string, { title: string; body: (name: string) => string }> = {
  accepted:    { title: "Job diterima", body: (n) => `${n} sudah menerima pesananmu dan akan datang sesuai jadwal.` },
  on_the_way:  { title: "TemanSedia sedang menuju lokasimu", body: (n) => `${n} sedang dalam perjalanan ke lokasimu.` },
  arrived:     { title: "TemanSedia sudah tiba", body: (n) => `${n} sudah tiba di lokasimu.` },
  in_progress: { title: "Sesi dimulai", body: (n) => `Sesimu bersama ${n} telah dimulai.` },
};

const VALID_TRANSITIONS: Record<string, string> = {
  confirmed:   "accepted",
  accepted:    "on_the_way",
  on_the_way:  "arrived",
  arrived:     "in_progress",
};

const TIMESTAMP_COL: Record<string, string> = {
  accepted:    "accepted_at",
  on_the_way:  "on_the_way_at",
  arrived:     "arrived_at",
  in_progress: "started_at",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "partner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  const { rows } = await pool.query(
    `SELECT o.order_status, o.payment_status, o.payment_method, o.total_amount, o.wallet_amount_used,
            o.user_uid, o.scheduled_date::text AS scheduled_date, p.name AS partner_name
     FROM orders o JOIN partners p ON p.uid = o.partner_uid
     WHERE o.id = $1 AND o.partner_uid = $2`,
    [id, session.uid]
  );
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

  if (action === "reject") {
    if (order.order_status !== "confirmed" && order.order_status !== "accepted") {
      return NextResponse.json({ error: "Tidak bisa ditolak" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE orders SET order_status='cancelled', cancelled_at=NOW(), cancelled_by='partner',
         cancel_reason='Mitra menolak job' WHERE id=$1`,
        [id]
      );

      // refund ke wallet kalau sudah dibayar
      if (order.payment_status === "paid") {
        const refundAmount = Number(order.payment_method === "wallet"
          ? order.wallet_amount_used
          : order.total_amount);

        if (refundAmount > 0) {
          await client.query(
            `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE uid = $2`,
            [refundAmount, order.user_uid]
          );
          await client.query(
            `INSERT INTO user_wallet_transactions (id, user_uid, amount, type, description, order_id, created_at)
             VALUES ($1, $2, $3, 'refund', $4, $5, NOW())`,
            [
              crypto.randomUUID(), order.user_uid, refundAmount,
              "Refund — mitra menolak job", id,
            ]
          );
        }
      }

      // remove booked slot dari availability
      await client.query(
        `DELETE FROM availability_booked_slots
         WHERE availability_id = (SELECT id FROM availability WHERE partner_uid=$1)
           AND slot_date = (SELECT scheduled_date FROM orders WHERE id=$2)`,
        [session.uid, id]
      );

      await client.query("COMMIT");
      await notify({ uid: order.user_uid, title: "Pesanan dibatalkan", body: `Maaf, ${order.partner_name} tidak bisa memenuhi pesananmu. Silakan cari TemanSedia lain.`, type: "order", orderId: id, url: `/orders/${id}` }).catch(() => {});
      return NextResponse.json({ ok: true });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("Reject error:", e);
      return NextResponse.json({ error: "Gagal menolak job" }, { status: 500 });
    } finally {
      client.release();
    }
  }

  // advance status
  const next = VALID_TRANSITIONS[order.order_status];
  if (!next) return NextResponse.json({ error: "Status tidak bisa diubah" }, { status: 400 });

  // "Mulai Berangkat" hanya boleh di hari H
  if (next === "on_the_way") {
    const today = new Date().toISOString().slice(0, 10);
    if (order.scheduled_date !== today) {
      return NextResponse.json({ error: "Belum bisa berangkat, bukan hari jadwal" }, { status: 400 });
    }
  }

  const tsCol = TIMESTAMP_COL[next];
  await pool.query(
    `UPDATE orders SET order_status=$1, ${tsCol}=NOW() WHERE id=$2`,
    [next, id]
  );

  const msg = NOTIFY_MSG[next];
  if (msg) {
    const firstName = order.partner_name.split(" ")[0];
    await notify({ uid: order.user_uid, title: msg.title, body: msg.body(firstName), type: "order", orderId: id, url: `/orders/${id}` }).catch(() => {});
  }

  return NextResponse.json({ ok: true, newStatus: next });
}
