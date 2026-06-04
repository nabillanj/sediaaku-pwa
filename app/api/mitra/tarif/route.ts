import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "partner") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { services } = await req.json();
  const uid = session.uid;

  for (const svc of services as { categoryId: string; rate: number; skills: string[]; active: boolean }[]) {
    await pool.query(
      `INSERT INTO partner_services (partner_uid, category_id, rate_per_hour, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (partner_uid, category_id) DO UPDATE
         SET rate_per_hour=$3, is_active=$4`,
      [uid, svc.categoryId, svc.rate, svc.active]
    );

    await pool.query(
      `DELETE FROM partner_skills WHERE partner_uid=$1 AND category_id=$2`,
      [uid, svc.categoryId]
    );
    for (const skill of svc.skills) {
      await pool.query(
        `INSERT INTO partner_skills (id, partner_uid, category_id, skill_name)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [uid, svc.categoryId, skill]
      );
    }
  }

  return NextResponse.json({ ok: true });
}
