import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";
import ReportForm from "./ReportForm";

async function getOrder(orderId: string, userUid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.order_status, o.scheduled_date, o.start_time,
              p.name AS partner_name,
              c.name AS category_name, c.emoji AS category_emoji
       FROM orders o
       JOIN partners p ON p.uid = o.partner_uid
       JOIN categories c ON c.id = o.category_id
       WHERE o.id = $1 AND o.user_uid = $2`,
      [orderId, userUid]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function shortId(uuid: string) {
  return uuid.slice(-4).toUpperCase();
}

export default async function ReportFormPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { orderId } = await params;
  const order = await getOrder(orderId, session.uid);
  if (!order) notFound();

  return (
    <div className="pwa-shell">
      {/* AppBar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px", background: "var(--bg)", zIndex: 10,
        borderBottom: "1px solid var(--border-soft)",
        flexShrink: 0,
      }}>
        <Link href="/help/report" style={{ textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, background: "var(--surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
        </Link>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
          Laporkan masalah
        </div>
      </div>

      <ReportForm
        orderId={order.id}
        orderShortId={shortId(order.id)}
        partnerFirstName={order.partner_name.split(" ")[0]}
        categoryEmoji={order.category_emoji}
        categoryName={order.category_name}
        scheduledDate={formatDate(order.scheduled_date)}
      />
    </div>
  );
}
