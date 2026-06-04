import { NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "no session" });

  const { rows } = await pool.query(
    `SELECT id, label, is_default FROM user_addresses WHERE user_uid = $1`,
    [session.uid]
  );
  return NextResponse.json({ uid: session.uid, role: session.role, count: rows.length, rows });
}
