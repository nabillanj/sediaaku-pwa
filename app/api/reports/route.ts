import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const raw = jar.get("pwa_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let session: { uid: string } | null = null;
  try {
    session = JSON.parse(Buffer.from(raw, "base64").toString());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, reason, detail } = await req.json();
  if (!orderId || !reason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify order belongs to this user
  const { rows } = await pool.query(
    `SELECT id FROM orders WHERE id = $1 AND user_uid = $2`,
    [orderId, session.uid]
  );
  if (!rows[0]) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const id = randomUUID();
  await pool.query(
    `INSERT INTO reports (id, order_id, reporter_type, reason, detail, status, created_at)
     VALUES ($1, $2, 'user', $3, $4, 'pending', NOW())`,
    [id, orderId, reason, detail ?? null]
  );

  return NextResponse.json({ ok: true, id });
}
