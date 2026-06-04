import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "partner") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { bankName, accountNumber, accountHolder } = await req.json();

  if (!bankName || !accountNumber || !accountHolder) {
    return NextResponse.json({ ok: false, error: "Semua field wajib diisi" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM partner_bank_accounts WHERE partner_uid = $1`,
      [session.uid]
    );
    await client.query(
      `INSERT INTO partner_bank_accounts (id, partner_uid, bank_name, account_number, account_holder, is_primary, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW())`,
      [session.uid, bankName, accountNumber.replace(/\s/g, ""), accountHolder]
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== "partner") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await pool.query(
    `DELETE FROM partner_bank_accounts WHERE partner_uid = $1`,
    [session.uid]
  );
  return NextResponse.json({ ok: true });
}
