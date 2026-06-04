import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import JobDetailClient from "./JobDetailClient";

async function getJobDetail(orderId: string, partnerUid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.order_status, o.scheduled_date::text AS scheduled_date,
              o.start_time, o.end_time, o.duration_hours,
              o.address, o.address_lat, o.address_lng, o.landmark, o.user_note, o.service_note,
              o.partner_earning, o.service_amount, o.app_fee,
              o.accepted_at, o.on_the_way_at, o.arrived_at, o.started_at,
              u.name AS user_name, u.phone AS user_phone, u.total_orders AS user_total_orders,
              u.uid AS user_uid,
              c.name AS category_name, c.emoji AS category_emoji,
              conv.id AS conv_id
       FROM orders o
       JOIN users u ON u.uid = o.user_uid
       JOIN categories c ON c.id = o.category_id
       LEFT JOIN conversations conv ON conv.user_uid = o.user_uid AND conv.partner_uid = o.partner_uid
       WHERE o.id = $1 AND o.partner_uid = $2`,
      [orderId, partnerUid]
    );
    if (!rows[0]) return null;
    const { rows: photos } = await pool.query(
      `SELECT photo_url FROM order_proof_photos WHERE order_id = $1 ORDER BY id`,
      [orderId]
    );
    return { ...rows[0], proof_photos: photos.map((p: { photo_url: string }) => p.photo_url) };
  } catch {
    return null;
  }
}

export default async function MitraJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/mitra/home");

  const { id } = await params;
  const job = await getJobDetail(id, session.uid);
  if (!job) notFound();

  return <JobDetailClient job={job} />;
}
