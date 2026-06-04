import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import MitraJobTabs from "./MitraJobTabs";

export const dynamic = "force-dynamic";

async function getUpcomingJobs(partnerUid: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { rows } = await pool.query(
    `SELECT o.id, o.scheduled_date::text AS scheduled_date, o.start_time, o.end_time,
            o.order_status, o.partner_earning, o.address,
            u.name AS user_name,
            c.name AS category_name, c.emoji AS category_emoji
     FROM orders o
     JOIN users u ON u.uid = o.user_uid
     JOIN categories c ON c.id = o.category_id
     WHERE o.partner_uid = $1
       AND o.scheduled_date >= $2
       AND o.order_status NOT IN ('cancelled','pending_payment')
     ORDER BY o.scheduled_date ASC, o.start_time ASC`,
    [partnerUid, today]
  );
  return rows;
}

async function getHistoryJobs(partnerUid: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { rows } = await pool.query(
    `SELECT o.id, o.scheduled_date::text AS scheduled_date, o.start_time, o.end_time,
            o.order_status, o.partner_earning, o.address,
            u.name AS user_name,
            c.name AS category_name, c.emoji AS category_emoji
     FROM orders o
     JOIN users u ON u.uid = o.user_uid
     JOIN categories c ON c.id = o.category_id
     WHERE o.partner_uid = $1
       AND (o.scheduled_date < $2 OR o.order_status IN ('completed','cancelled'))
       AND o.order_status NOT IN ('confirmed','on_the_way','arrived','in_progress','pending_payment')
     ORDER BY o.scheduled_date DESC, o.start_time DESC
     LIMIT 50`,
    [partnerUid, today]
  );
  return rows;
}

export default async function MitraJobPage() {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/");

  const [upcoming, history] = await Promise.all([
    getUpcomingJobs(session.uid),
    getHistoryJobs(session.uid),
  ]);

  return <MitraJobTabs upcoming={upcoming} history={history} />;
}
