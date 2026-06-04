import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import SelesaiClient from "./SelesaiClient";

async function getJob(orderId: string, partnerUid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.order_status, o.partner_earning, o.duration_hours,
              o.scheduled_date::text AS scheduled_date, o.start_time, o.end_time,
              u.name AS user_name
       FROM orders o
       JOIN users u ON u.uid = o.user_uid
       WHERE o.id = $1 AND o.partner_uid = $2 AND o.order_status = 'in_progress'`,
      [orderId, partnerUid]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function SelesaiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/mitra/home");

  const { id } = await params;
  const job = await getJob(id, session.uid);
  if (!job) notFound();

  return <SelesaiClient job={job} />;
}
