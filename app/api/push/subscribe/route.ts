import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO push_subscriptions (uid, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (uid, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
    [session.uid, endpoint, keys.p256dh, keys.auth]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json();
  await pool.query(
    `DELETE FROM push_subscriptions WHERE uid = $1 AND endpoint = $2`,
    [session.uid, endpoint]
  );

  return NextResponse.json({ ok: true });
}
