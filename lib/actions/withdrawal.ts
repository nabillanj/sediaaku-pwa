"use server";

import pool from "@/lib/db";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

const MIN_WITHDRAW = 100000;

export async function requestWithdrawal(
  amount: number
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "partner") {
    return { ok: false, error: "Unauthorized" };
  }

  if (!amount || amount < MIN_WITHDRAW) {
    return { ok: false, error: `Minimum pencairan Rp ${MIN_WITHDRAW.toLocaleString("id-ID")}` };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: partnerRows } = await client.query(
      `SELECT balance FROM partners WHERE uid = $1 FOR UPDATE`,
      [session.uid]
    );
    const balance = Number(partnerRows[0]?.balance ?? 0);

    if (amount > balance) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Jumlah melebihi saldo aktif" };
    }

    const { rows: pending } = await client.query(
      `SELECT id FROM withdrawal_requests WHERE partner_uid = $1 AND status = 'pending'`,
      [session.uid]
    );
    if (pending.length > 0) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Ada permintaan pencairan yang masih diproses" };
    }

    const { rows: bank } = await client.query(
      `SELECT bank_name, account_number, account_holder FROM partner_bank_accounts WHERE partner_uid = $1 LIMIT 1`,
      [session.uid]
    );
    if (!bank[0]) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Tambah rekening bank terlebih dahulu" };
    }

    const transferFee = bank[0].bank_name === "BCA" ? 0 : 7500;
    const adminFee = transferFee;
    const netAmount = amount - adminFee;

    await client.query(
      `INSERT INTO withdrawal_requests
         (id, partner_uid, amount, admin_fee, net_amount, bank_name, account_number, account_holder, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',NOW())`,
      [
        crypto.randomUUID(),
        session.uid,
        amount,
        adminFee,
        netAmount,
        bank[0].bank_name,
        bank[0].account_number,
        bank[0].account_holder,
      ]
    );

    await client.query("COMMIT");
    revalidatePath("/mitra/saldo");
    return { ok: true };
  } catch (err) {
    await client.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  } finally {
    client.release();
  }
}
