import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import VoucherClient, { VoucherRow, HistoryRow } from "./VoucherClient";

async function getAvailableVouchers(uid: string): Promise<VoucherRow[]> {
  try {
    const { rows } = await pool.query(
      `SELECT v.id, v.code, v.title, v.description,
              v.category_id AS "categoryId",
              v.discount_type AS "discountType",
              v.discount_value AS "discountValue",
              v.max_discount AS "maxDiscount",
              v.min_transaction_amount AS "minTransactionAmount",
              v.min_hours AS "minHours",
              v.valid_until AS "validUntil"
       FROM vouchers v
       WHERE v.is_active = true
         AND v.valid_until > NOW()
         AND (v.usage_limit IS NULL OR v.times_used < v.usage_limit)
         AND NOT EXISTS (
           SELECT 1 FROM user_vouchers uv WHERE uv.voucher_id = v.id AND uv.user_uid = $1
         )
       ORDER BY v.created_at DESC`,
      [uid]
    );
    return rows;
  } catch {
    return [];
  }
}

async function getVoucherHistory(uid: string): Promise<HistoryRow[]> {
  try {
    const { rows } = await pool.query(
      `SELECT v.code, v.title, v.description,
              v.discount_type AS "discountType",
              v.discount_value AS "discountValue",
              uv.used_at AS "usedAt"
       FROM user_vouchers uv
       JOIN vouchers v ON v.id = uv.voucher_id
       WHERE uv.user_uid = $1
       ORDER BY uv.used_at DESC`,
      [uid]
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function VouchersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const params = await searchParams;
  const fromBooking = params.from === "booking";
  const serviceAmount = fromBooking ? Number(params.serviceAmount ?? 0) : 0;
  const durationHours = fromBooking ? Number(params.durationHours ?? 0) : 0;
  const categoryId = fromBooking ? (params.categoryId ?? null) : null;
  const partnerUid = fromBooking ? (params.partnerUid ?? null) : null;

  const [available, history] = await Promise.all([
    getAvailableVouchers(session.uid),
    getVoucherHistory(session.uid),
  ]);

  return (
    <VoucherClient
      available={available}
      history={history}
      fromBooking={fromBooking}
      serviceAmount={serviceAmount}
      durationHours={durationHours}
      categoryId={categoryId}
      partnerUid={partnerUid}
    />
  );
}
