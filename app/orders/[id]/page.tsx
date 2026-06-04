import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";

async function getOrderDetail(orderId: string, userUid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.order_status, o.payment_status, o.total_amount,
              o.service_amount, o.app_fee, o.discount_amount,
              o.scheduled_date, o.start_time, o.end_time, o.duration_hours,
              o.address, o.address_note, o.landmark, o.user_note,
              o.completion_note, o.cancel_reason, o.cancelled_by,
              o.payment_confirmed_at, o.accepted_at, o.on_the_way_at, o.arrived_at,
              o.started_at, o.completed_at, o.cancelled_at, o.created_at,
              p.name AS partner_name, p.phone AS partner_phone, p.photo_url AS partner_photo_url,
              c.name AS category_name, c.emoji AS category_emoji,
              rev.rating AS review_rating, rev.comment AS review_comment,
              conv.id AS conv_id
       FROM orders o
       JOIN partners p ON p.uid = o.partner_uid
       JOIN categories c ON c.id = o.category_id
       LEFT JOIN reviews rev ON rev.order_id = o.id
       LEFT JOIN conversations conv ON conv.user_uid = o.user_uid AND conv.partner_uid = o.partner_uid
       WHERE o.id = $1 AND o.user_uid = $2`,
      [orderId, userUid]
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

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatTime(ts: string | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function rp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function shortId(uuid: string) {
  return uuid.slice(-4).toUpperCase();
}

function Avatar({ name, photoUrl, size = 44 }: { name: string; photoUrl?: string; size?: number }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />;
  const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="18" height="18" viewBox="0 0 24 24" fill={s <= rating ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { id } = await params;
  const order = await getOrderDetail(id, session.uid);
  if (!order) notFound();

  const isActive = ["on_the_way", "arrived", "in_progress"].includes(order.order_status);
  const isCompleted = order.order_status === "completed";
  const isCancelled = order.order_status === "cancelled";
  const completedHoursAgo = order.completed_at
    ? (Date.now() - new Date(order.completed_at).getTime()) / 3600000
    : null;
  const canContact =
    isActive ||
    (isCompleted && completedHoursAgo !== null && completedHoursAgo <= 6);

  const STATUS_MAP: Record<string, { text: string; color: string; bg: string }> = {
    pending_payment: order.payment_status === "failed"
      ? { text: "Pembayaran Ditolak",            color: "var(--danger)",    bg: "var(--danger-bg)" }
      : { text: "Menunggu Verifikasi Pembayaran", color: "var(--warn)",     bg: "var(--warn-bg)" },
    confirmed:   { text: "Dikonfirmasi",       color: "var(--info)",       bg: "var(--info-bg)" },
    accepted:    { text: "Jadwal Dikonfirmasi", color: "var(--info)",       bg: "var(--info-bg)" },
    on_the_way:  { text: "Dalam Perjalanan",   color: "var(--primary)",    bg: "var(--primary-50)" },
    arrived:     { text: "Sudah Tiba",         color: "var(--primary)",    bg: "var(--primary-50)" },
    in_progress: { text: "Berlangsung",        color: "var(--primary-700)", bg: "var(--primary-100)" },
    completed:   { text: "Selesai",            color: "var(--text-2)",     bg: "var(--border-soft)" },
    cancelled:   { text: "Dibatalkan",         color: "var(--danger)",     bg: "var(--danger-bg)" },
  };
  const currentStatus = STATUS_MAP[order.order_status] ?? { text: order.order_status, color: "var(--text-2)", bg: "var(--border-soft)" };

  // Rank status so we can infer intermediate steps as done even if timestamps are null
  const STATUS_RANK: Record<string, number> = {
    pending_payment: 0, confirmed: 1, accepted: 2, on_the_way: 3, arrived: 4, in_progress: 5, completed: 6,
  };
  const rank = STATUS_RANK[order.order_status] ?? 0;
  const firstName = order.partner_name.split(" ")[0];

  const steps = [
    {
      label: "Menunggu verifikasi admin",
      time: formatTime(order.created_at),
      done: rank >= 1,
    },
    {
      label: "Pesanan dikonfirmasi",
      time: formatTime(order.payment_confirmed_at),
      done: !!order.payment_confirmed_at || rank >= 1,
    },
    ...(rank >= 2
      ? [
          {
            label: `${firstName} sudah menerima pesananmu`,
            time: formatTime(order.accepted_at),
            done: !!order.accepted_at || rank >= 2,
          },
        ]
      : [
          {
            label: `Menunggu konfirmasi TemanSedia: ${firstName}`,
            time: null as string | null,
            done: false,
          },
        ]
    ),
    ...(rank >= 3
      ? [
          {
            label: `${firstName} menuju lokasi`,
            time: formatTime(order.on_the_way_at),
            done: !!order.on_the_way_at || rank >= 3,
          },
          {
            label: `${firstName} sudah tiba`,
            time: formatTime(order.arrived_at),
            done: !!order.arrived_at || rank >= 4,
          },
        ]
      : []
    ),
    {
      label: "Sesi dimulai",
      time: formatTime(order.started_at),
      done: !!order.started_at || rank >= 5,
    },
    ...(isCancelled
      ? [{
          label: order.cancelled_by === "partner"
            ? `${firstName} menolak pesanan`
            : order.cancelled_by === "admin"
            ? "Pesanan dibatalkan oleh admin"
            : "Pesanan dibatalkan",
          time: formatTime(order.cancelled_at),
          done: true,
          danger: true,
        }]
      : [{
          label: "Sesi selesai",
          time: isCompleted ? formatTime(order.completed_at) : `Estimasi ${order.end_time?.slice(0, 5)}`,
          done: isCompleted,
        }]
    ),
  ];

  const currentStepIndex = steps.findLastIndex((s) => s.done);

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* AppBar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", position: "sticky", top: 0,
          background: "var(--bg)", zIndex: 10,
        }}>
          <Link href="/orders" style={{ textDecoration: "none" }}>
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
            Pesanan #{shortId(order.id)}
          </div>
        </div>

        {/* Location / status banner */}
        <div style={{
          margin: "0 16px 14px",
          borderRadius: 18,
          background: isCompleted
            ? "linear-gradient(135deg, #085E55 0%, #0E7C71 100%)"
            : isCancelled
            ? "linear-gradient(135deg, #7A3B35 0%, #B85148 100%)"
            : "var(--grad-hero)",
          padding: "18px 18px 16px",
          position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{
            position: "absolute", width: 180, height: 180, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 60%)",
            top: -60, right: -40, pointerEvents: "none",
          }} />
          {/* Status badge */}
          <div style={{
            display: "inline-flex", alignSelf: "flex-start",
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
            borderRadius: 999, padding: "4px 10px",
            fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 0.3,
          }}>
            {currentStatus.text}
          </div>
          {/* Address */}
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 3 }}>Lokasi layanan</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M12 22s8-7 8-13a8 8 0 10-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/>
              </svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
                  {order.address}
                </div>
                {order.landmark && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                    📍 {order.landmark}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Partner card */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={order.partner_name} photoUrl={order.partner_photo_url} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{order.partner_name}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {isActive ? "Sedang bertugas" : isCompleted ? "Layanan selesai" : isCancelled ? "Pesanan dibatalkan" : "Menunggu konfirmasi"}
                  {" · "}
                  {order.category_emoji} {order.category_name}
                </div>
              </div>
              {/* Contact icons — chat dulu, baru call */}
              <div style={{ display: "flex", gap: 8 }}>
                {canContact && order.conv_id ? (
                  <a href={`/chat/${order.conv_id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: "var(--primary-50)",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 4v-4H6a2 2 0 01-2-2V6z"/>
                      </svg>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: "var(--surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 4v-4H6a2 2 0 01-2-2V6z"/>
                    </svg>
                  </div>
                )}
                {canContact ? (
                  <a href={`tel:${order.partner_phone}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 4h3l2 5-3 1c1 2.5 3 4.5 5.5 5.5l1-3 5 2v3a2 2 0 01-2 2A14 14 0 013 6a2 2 0 012-2z"/>
                      </svg>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: "var(--surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 4h3l2 5-3 1c1 2.5 3 4.5 5.5 5.5l1-3 5 2v3a2 2 0 01-2 2A14 14 0 013 6a2 2 0 012-2z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline / progress */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                {isCompleted ? "Sesi selesai" : isCancelled ? "Pesanan dibatalkan" : "Status pesanan"}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, borderRadius: 999,
                padding: "3px 10px",
                background: currentStatus.bg,
                color: currentStatus.color,
              }}>
                {currentStatus.text}
              </span>
            </div>

            {/* Progress info (active only) */}
            {isActive && (
              <div style={{
                background: "var(--primary-50)", borderRadius: 12,
                padding: "12px 14px", marginBottom: 14,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 2 }}>Jadwal sesi</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                    {formatDate(order.scheduled_date)} · {order.start_time?.slice(0,5)}–{order.end_time?.slice(0,5)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 2 }}>Durasi</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{order.duration_hours} jam</div>
                </div>
              </div>
            )}

            {/* Completed summary */}
            {isCompleted && (
              <div style={{
                background: "var(--primary-50)", borderRadius: 12,
                padding: "12px 14px", marginBottom: 14,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 2 }}>Tanggal sesi</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                    {formatDate(order.scheduled_date)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 2 }}>Waktu</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                    {order.start_time?.slice(0,5)}–{order.end_time?.slice(0,5)} ({order.duration_hours} jam)
                  </div>
                </div>
              </div>
            )}

            {/* Timeline steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const isCurrent = i === currentStepIndex && !isCompleted && !isCancelled;
                const isDanger = "danger" in step && step.danger;
                return (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    {/* Line + dot */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: step.done
                          ? isDanger ? "var(--danger)" : "var(--primary)"
                          : "var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: isCurrent ? "2px solid var(--primary)" : "none",
                      }}>
                        {step.done && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l5 5 9-11"/>
                          </svg>
                        )}
                      </div>
                      {!isLast && (
                        <div style={{
                          width: 1.5, flex: 1, minHeight: 20,
                          background: step.done ? (isDanger ? "var(--danger-bg)" : "var(--primary-200)") : "var(--border)",
                          margin: "2px 0",
                        }} />
                      )}
                    </div>
                    {/* Text */}
                    <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                      <div style={{
                        fontSize: 13, fontWeight: step.done || isCurrent ? 600 : 400,
                        color: step.done
                          ? isDanger ? "var(--danger)" : "var(--text-1)"
                          : "var(--text-3)",
                      }}>
                        {step.label}
                      </div>
                      {step.time && (
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{step.time}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alamat */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Lokasi</div>
            <div style={{ display: "flex", gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 22s8-7 8-13a8 8 0 10-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/>
              </svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.4 }}>{order.address}</div>
                {order.landmark && (
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>Patokan: {order.landmark}</div>
                )}
                {order.address_note && (
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{order.address_note}</div>
                )}
              </div>
            </div>
          </div>

          {/* Catatan user (if any) */}
          {order.user_note && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Catatan</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{order.user_note}</div>
            </div>
          )}

          {/* Completed: foto bukti */}
          {isCompleted && order.proof_photos?.length > 0 && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Foto Bukti Sesi</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {order.proof_photos.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: "block", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3" }}>
                    <img src={url} alt={`Bukti ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Completed: catatan penyelesaian mitra */}
          {isCompleted && order.completion_note && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Catatan Penyelesaian</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{order.completion_note}</div>
            </div>
          )}

          {/* Cancelled: alasan */}
          {isCancelled && order.cancel_reason && (
            <div className="card" style={{ padding: 14, background: "var(--danger-bg)", border: "none" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Alasan Pembatalan</div>
              <div style={{ fontSize: 13, color: "var(--danger)", lineHeight: 1.6 }}>{order.cancel_reason}</div>
            </div>
          )}

          {/* Payment breakdown (completed) */}
          {(isCompleted || isCancelled) && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Rincian Pembayaran</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>Biaya layanan ({order.duration_hours} jam)</span>
                  <span style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>{rp(order.service_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>Diskon voucher</span>
                    <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 500 }}>−{rp(order.discount_amount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>Biaya aplikasi</span>
                  <span style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>{rp(order.app_fee)}</span>
                </div>
                <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Total</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>{rp(order.total_amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Review section (completed, no review yet) */}
          {isCompleted && !order.review_rating && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Beri Ulasan</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>
                    Bagaimana layanan {firstName}?
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    Ulasanmu membantu Teman Sedia berkembang
                  </div>
                </div>
                <Link href={`/orders/${order.id}/review`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <div style={{
                    background: "var(--primary)", color: "#fff", borderRadius: 10,
                    padding: "9px 16px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                  }}>
                    Tulis ulasan
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Review already given */}
          {isCompleted && order.review_rating && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Ulasanmu</div>
              <Stars rating={order.review_rating} />
              {order.review_comment && (
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, lineHeight: 1.6 }}>{order.review_comment}</div>
              )}
            </div>
          )}

          {/* Bottom actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 24 }}>
            {isCompleted && (
              <Link href="/home" style={{ textDecoration: "none" }}>
                <div className="btn-primary" style={{ textAlign: "center", padding: "14px", borderRadius: 14, fontSize: 15 }}>
                  Pesan lagi
                </div>
              </Link>
            )}
            {!isCancelled && (
              <Link href="/help" style={{ textDecoration: "none" }}>
                <div style={{
                  textAlign: "center", padding: "13px", borderRadius: 14,
                  background: "var(--surface)", border: "1.5px solid var(--border)",
                  color: "var(--text-2)", fontSize: 14, fontWeight: 600,
                }}>
                  Pusat bantuan
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
