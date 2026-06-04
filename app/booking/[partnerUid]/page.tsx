import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import BookingScheduleClient from "./BookingScheduleClient";

async function getBookingData(partnerUid: string) {
  const [servicesRes, availRes, daysRes, blockedRes, bookedRes] = await Promise.all([
    pool.query(
      `SELECT p.uid, p.name, p.photo_url, p.rating, p.total_jobs,
              ps.rate_per_hour, c.name AS category_name, c.id AS category_id, c.emoji
       FROM partners p
       JOIN partner_services ps ON ps.partner_uid = p.uid AND ps.is_active = true
       JOIN categories c ON c.id = ps.category_id
       WHERE p.uid = $1 AND p.is_active = true AND p.verify_status = 'verified'
       ORDER BY c.display_order ASC`,
      [partnerUid]
    ),
    pool.query(
      `SELECT id, work_start_time, work_end_time, min_duration_hours, min_booking_lead_hours
       FROM availability WHERE partner_uid = $1`,
      [partnerUid]
    ),
    pool.query(
      `SELECT day_of_week, start_time, end_time
       FROM availability_active_days
       WHERE availability_id = (SELECT id FROM availability WHERE partner_uid = $1)`,
      [partnerUid]
    ),
    pool.query(
      `SELECT blocked_date::text AS blocked_date
       FROM availability_blocked_dates
       WHERE availability_id = (SELECT id FROM availability WHERE partner_uid = $1)
         AND blocked_date >= CURRENT_DATE`,
      [partnerUid]
    ),
    // booked slots dari orders aktif (pending_payment, confirmed, on_the_way, arrived, in_progress)
    pool.query(
      `SELECT scheduled_date::text AS slot_date, start_time, end_time
       FROM orders
       WHERE partner_uid = $1
         AND scheduled_date >= CURRENT_DATE
         AND order_status NOT IN ('cancelled', 'completed')
         AND payment_status != 'failed'`,
      [partnerUid]
    ),
  ]);

  if (servicesRes.rows.length === 0) return null;

  const first = servicesRes.rows[0];
  const services = servicesRes.rows.map((r) => ({
    categoryId: r.category_id,
    categoryName: r.category_name,
    emoji: r.emoji,
    ratePerHour: r.rate_per_hour,
  }));

  const partnerInfo = {
    uid: first.uid,
    name: first.name,
    photoUrl: first.photo_url,
    rating: first.rating,
    totalJobs: first.total_jobs,
  };

  const avail = availRes.rows[0];
  const activeDays: Record<string, { start: string; end: string }> = {};
  for (const r of daysRes.rows) {
    // gunakan jam dari day override; kalau null fallback ke work hours
    const start = r.start_time && r.start_time !== "00:00" ? r.start_time : (avail?.work_start_time && avail.work_start_time !== "00:00" ? avail.work_start_time : "08:00");
    const end = r.end_time ?? avail?.work_end_time ?? "17:00";
    activeDays[r.day_of_week] = { start, end };
  }

  const bookedSlots: Record<string, string[]> = {};
  for (const r of bookedRes.rows) {
    if (!bookedSlots[r.slot_date]) bookedSlots[r.slot_date] = [];
    bookedSlots[r.slot_date].push(`${r.start_time}-${r.end_time}`);
  }

  return {
    partner: partnerInfo,
    services,
    availability: {
      workStart: avail?.work_start_time ?? "08:00",
      workEnd: avail?.work_end_time ?? "17:00",
      minDurationHours: avail?.min_duration_hours ?? 2,
      minBookingLeadHours: avail?.min_booking_lead_hours ?? 1,
      activeDays,
      blockedDates: blockedRes.rows.map((r: { blocked_date: string }) => r.blocked_date),
      bookedSlots,
    },
  };
}

export default async function BookingSchedulePage({
  params,
}: {
  params: Promise<{ partnerUid: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { partnerUid } = await params;
  const data = await getBookingData(partnerUid);
  if (!data) notFound();

  // jam server dalam WIB (UTC+7)
  const nowWIB = new Date(Date.now() + 7 * 3600 * 1000);
  const todayWIB = nowWIB.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const hourWIB = nowWIB.getUTCHours();
  const minuteWIB = nowWIB.getUTCMinutes();

  return (
    <BookingScheduleClient
      partner={data.partner}
      services={data.services}
      availability={data.availability}
      todayWIB={todayWIB}
      hourWIB={hourWIB}
      minuteWIB={minuteWIB}
    />
  );
}
