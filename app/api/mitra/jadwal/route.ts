import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "partner") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { days, workStart, workEnd, minDuration, maxRadius, minLeadHours, cutiAktif } = body;

  const uid = session.uid;

  // Get or create availability
  const existRes = await pool.query(`SELECT id FROM availability WHERE partner_uid=$1`, [uid]);
  let availId: string;

  if (existRes.rows.length > 0) {
    availId = existRes.rows[0].id;
    await pool.query(
      `UPDATE availability SET
         work_start_time=$1, work_end_time=$2,
         min_duration_hours=$3, max_radius_km=$4, min_booking_lead_hours=$5,
         updated_at=NOW()
       WHERE id=$6`,
      [workStart, workEnd, minDuration, maxRadius, minLeadHours, availId]
    );
  } else {
    const newId = crypto.randomUUID();
    availId = newId;
    await pool.query(
      `INSERT INTO availability (id, partner_uid, work_start_time, work_end_time,
         min_duration_hours, max_radius_km, min_booking_lead_hours, overtime_percent, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 20, NOW())`,
      [newId, uid, workStart, workEnd, minDuration, maxRadius, minLeadHours]
    );
  }

  // Update is_online + min_hours on partners
  await pool.query(`UPDATE partners SET is_online=$1, min_hours=$2 WHERE uid=$3`, [!cutiAktif, minDuration, uid]);

  // Replace active days
  await pool.query(`DELETE FROM availability_active_days WHERE availability_id=$1`, [availId]);

  for (const [day, sched] of Object.entries(days) as [string, { active: boolean; start: string; end: string }][]) {
    if (sched.active) {
      await pool.query(
        `INSERT INTO availability_active_days (availability_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [availId, day, sched.start, sched.end]
      );
    }
  }

  return NextResponse.json({ ok: true });
}
