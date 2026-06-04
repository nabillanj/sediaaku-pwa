import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import AturJadwalForm from "./AturJadwalForm";

const DAY_KEYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

async function getJadwalData(uid: string) {
  const [availRes, daysRes, partnerRes] = await Promise.all([
    pool.query(
      `SELECT id, work_start_time, work_end_time,
              min_duration_hours, max_radius_km, min_booking_lead_hours
       FROM availability WHERE partner_uid=$1`,
      [uid]
    ),
    pool.query(
      `SELECT day_of_week, start_time, end_time
       FROM availability_active_days
       WHERE availability_id=(SELECT id FROM availability WHERE partner_uid=$1)`,
      [uid]
    ),
    pool.query(`SELECT is_online FROM partners WHERE uid=$1`, [uid]),
  ]);

  const avail = availRes.rows[0];
  const activeDaysSet = new Set(daysRes.rows.map((r: { day_of_week: string }) => r.day_of_week));
  const dayTimeMap: Record<string, { start: string; end: string }> = {};
  for (const r of daysRes.rows) {
    dayTimeMap[r.day_of_week] = { start: r.start_time ?? "08:00", end: r.end_time ?? "17:00" };
  }

  const workStart = avail?.work_start_time ?? "08:00";
  const workEnd = avail?.work_end_time ?? "17:00";

  const days: Record<string, { active: boolean; start: string; end: string }> = {};
  for (const key of DAY_KEYS) {
    days[key] = {
      active: activeDaysSet.has(key),
      start: dayTimeMap[key]?.start ?? workStart,
      end: dayTimeMap[key]?.end ?? workEnd,
    };
  }

  return {
    days,
    rules: { workStart, workEnd,
      minDuration: avail?.min_duration_hours ?? 2,
      maxRadius: avail?.max_radius_km ?? 10,
      minLeadHours: avail?.min_booking_lead_hours ?? 1,
    },
    isCutiAktif: !(partnerRes.rows[0]?.is_online ?? true),
  };
}

export default async function AturJadwalPage() {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/");

  const data = await getJadwalData(session.uid);

  return (
    <AturJadwalForm
      initialDays={data.days}
      initialRules={data.rules}
      isCutiAktif={data.isCutiAktif}
    />
  );
}
