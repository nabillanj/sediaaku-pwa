import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, serviceAmount, durationHours, categoryId } = await req.json();
  if (!code) return NextResponse.json({ error: "Kode voucher tidak boleh kosong" }, { status: 400 });

  const { rows } = await pool.query(
    `SELECT v.*
     FROM vouchers v
     WHERE UPPER(v.code) = UPPER($1)`,
    [code]
  );
  const v = rows[0];

  if (!v) return NextResponse.json({ error: "Kode voucher tidak ditemukan" }, { status: 404 });
  if (!v.is_active) return NextResponse.json({ error: "Voucher tidak aktif" }, { status: 400 });
  if (v.valid_until && new Date(v.valid_until) < new Date()) {
    return NextResponse.json({ error: "Voucher sudah kadaluarsa" }, { status: 400 });
  }
  if (v.usage_limit !== null && v.times_used >= v.usage_limit) {
    return NextResponse.json({ error: "Voucher sudah habis digunakan" }, { status: 400 });
  }
  if (v.min_transaction_amount && serviceAmount < v.min_transaction_amount) {
    return NextResponse.json({
      error: `Minimum transaksi Rp ${Number(v.min_transaction_amount).toLocaleString("id-ID")} untuk voucher ini`,
    }, { status: 400 });
  }
  if (v.min_hours && durationHours < v.min_hours) {
    return NextResponse.json({
      error: `Minimum ${v.min_hours} jam untuk voucher ini`,
    }, { status: 400 });
  }
  if (v.category_id && v.category_id !== categoryId) {
    return NextResponse.json({ error: "Voucher hanya berlaku untuk kategori tertentu" }, { status: 400 });
  }

  // Cek apakah user sudah pakai voucher ini sebelumnya
  const { rows: used } = await pool.query(
    `SELECT 1 FROM user_vouchers WHERE user_uid = $1 AND voucher_id = $2`,
    [session.uid, v.id]
  );
  if (used.length > 0) {
    return NextResponse.json({ error: "Kamu sudah pernah menggunakan voucher ini" }, { status: 400 });
  }

  // Hitung diskon
  let discountAmount = 0;
  if (v.discount_type === "flat") {
    discountAmount = Math.min(Number(v.discount_value), serviceAmount);
  } else if (v.discount_type === "percent") {
    discountAmount = Math.round((serviceAmount * Number(v.discount_value)) / 100);
    if (v.max_discount) discountAmount = Math.min(discountAmount, Number(v.max_discount));
  }

  return NextResponse.json({
    ok: true,
    voucherId: v.id,
    title: v.title,
    discountType: v.discount_type,
    discountValue: v.discount_value,
    maxDiscount: v.max_discount,
    discountAmount,
  });
}
