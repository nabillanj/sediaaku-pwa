import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import JadwalTab from "./JadwalTab";

async function getJobs(uid: string) {
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  const to = new Date();
  to.setMonth(to.getMonth() + 3);
  const { rows } = await pool.query(
    `SELECT o.id, o.scheduled_date::text AS scheduled_date, o.start_time, o.end_time,
            o.order_status, o.partner_earning,
            u.name AS user_name,
            c.name AS category_name, c.emoji AS category_emoji
     FROM orders o
     JOIN users u ON u.uid = o.user_uid
     JOIN categories c ON c.id = o.category_id
     WHERE o.partner_uid = $1
       AND o.scheduled_date BETWEEN $2 AND $3
       AND o.order_status NOT IN ('cancelled','pending_payment')
     ORDER BY o.start_time ASC`,
    [uid, from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)]
  );
  return rows;
}

export default async function JadwalPage() {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/");

  const jobs = await getJobs(session.uid);

  return <JadwalTab jobs={jobs} />;
}
