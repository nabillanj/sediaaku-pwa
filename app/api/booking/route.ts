import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

const APP_FEE = 5000;
const PLATFORM_CUT_PERCENT = 8;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    partnerUid, categoryId, scheduledDate, startTime, endTime,
    durationHours, address, addressKabupaten, addressLat, addressLng,
    landmark, careSubjects,
    userNote, serviceAmount, totalAmount, paymentMethod, proofUrl,
    voucherCode, voucherId, discountAmount: clientDiscount,
  } = body;

  if (!partnerUid || !categoryId || !scheduledDate || !startTime || !endTime
    || !durationHours || !address || !serviceAmount || !totalAmount || !paymentMethod) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Validasi ulang voucher server-side
    let discountAmount = 0;
    let resolvedVoucherId = voucherId ?? null;
    let resolvedVoucherCode = voucherCode ?? null;

    if (voucherCode && voucherId) {
      const { rows: vRows } = await client.query(
        `SELECT * FROM vouchers WHERE id = $1 AND UPPER(code) = UPPER($2) FOR UPDATE`,
        [voucherId, voucherCode]
      );
      const v = vRows[0];
      const alreadyUsed = await client.query(
        `SELECT 1 FROM user_vouchers WHERE user_uid = $1 AND voucher_id = $2`,
        [session.uid, voucherId]
      );
      if (
        v && v.is_active &&
        (!v.valid_until || new Date(v.valid_until) >= new Date()) &&
        (v.usage_limit === null || v.times_used < v.usage_limit) &&
        serviceAmount >= Number(v.min_transaction_amount ?? 0) &&
        (!v.min_hours || durationHours >= v.min_hours) &&
        (!v.category_id || v.category_id === categoryId) &&
        alreadyUsed.rows.length === 0
      ) {
        if (v.discount_type === "flat") {
          discountAmount = Math.min(Number(v.discount_value), serviceAmount);
        } else if (v.discount_type === "percent") {
          discountAmount = Math.round((serviceAmount * Number(v.discount_value)) / 100);
          if (v.max_discount) discountAmount = Math.min(discountAmount, Number(v.max_discount));
        }
      } else {
        // voucher tidak valid lagi, abaikan
        resolvedVoucherId = null;
        resolvedVoucherCode = null;
      }
    }

    const verifiedTotal = serviceAmount + APP_FEE - discountAmount;

    const partnerEarning = Math.round(serviceAmount * (1 - PLATFORM_CUT_PERCENT / 100));
    const platformCut = serviceAmount - partnerEarning;
    const orderId = crypto.randomUUID();

    let paymentStatus = "pending";
    let orderStatus = "pending_payment";
    let walletAmountUsed = 0;
    let paymentConfirmedAt = null;

    if (paymentMethod === "wallet") {
      // verify balance still sufficient
      const { rows } = await client.query(
        `SELECT wallet_balance FROM users WHERE uid = $1 FOR UPDATE`,
        [session.uid]
      );
      const balance = Number(rows[0]?.wallet_balance ?? 0);
      if (balance < verifiedTotal) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Saldo tidak cukup" }, { status: 400 });
      }

      // deduct wallet
      await client.query(
        `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE uid = $2`,
        [verifiedTotal, session.uid]
      );

      // record transaction
      await client.query(
        `INSERT INTO user_wallet_transactions (id, user_uid, amount, type, description, order_id, created_at)
         VALUES ($1, $2, $3, 'payment', $4, $5, NOW())`,
        [
          crypto.randomUUID(), session.uid, verifiedTotal,
          `Pembayaran pesanan #${orderId.slice(0, 8).toUpperCase()}`,
          orderId,
        ]
      );

      walletAmountUsed = verifiedTotal;
      paymentStatus = "paid";
      orderStatus = "confirmed";
      paymentConfirmedAt = new Date().toISOString();
    }

    // create order
    await client.query(
      `INSERT INTO orders (
        id, user_uid, partner_uid, category_id,
        scheduled_date, start_time, end_time, duration_hours,
        address, address_note, address_lat, address_lng, landmark, user_note,
        discount_amount, voucher_code, service_amount, app_fee, total_amount,
        partner_earning, platform_cut,
        payment_status, payment_proof_url, payment_confirmed_at,
        order_status, is_paid_out, payment_method, wallet_amount_used,
        created_at
      ) VALUES (
        $1,$2,$3,$4, $5,$6,$7,$8, $9,$10,$11,$12,$13,$14, $15,$16,$17,$18,$19,
        $20,$21, $22,$23,$24, $25,false,$26,$27, NOW()
      )`,
      [
        orderId, session.uid, partnerUid, categoryId,
        scheduledDate, startTime, endTime, durationHours,
        address, addressKabupaten, addressLat ?? null, addressLng ?? null, landmark ?? null, userNote ?? null,
        discountAmount, resolvedVoucherCode,
        serviceAmount, APP_FEE, verifiedTotal,
        partnerEarning, platformCut,
        paymentStatus, proofUrl ?? null, paymentConfirmedAt,
        orderStatus, paymentMethod, walletAmountUsed,
      ]
    );

    // catat pemakaian voucher
    if (resolvedVoucherId) {
      await client.query(
        `INSERT INTO user_vouchers (user_uid, voucher_id, order_id, used_at)
         VALUES ($1, $2, $3, NOW())`,
        [session.uid, resolvedVoucherId, orderId]
      );
      await client.query(
        `UPDATE vouchers SET times_used = times_used + 1 WHERE id = $1`,
        [resolvedVoucherId]
      );
    }

    // add booked slot to availability
    if (paymentMethod === "wallet") {
      await client.query(
        `INSERT INTO availability_booked_slots (id, availability_id, slot_date, slot_range)
         SELECT $1, a.id, $2, $3
         FROM availability a WHERE a.partner_uid = $4`,
        [
          crypto.randomUUID(), scheduledDate,
          `${startTime}-${endTime}`, partnerUid,
        ]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ orderId });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Booking error:", e);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  } finally {
    client.release();
  }
}
