"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";

function rp(n: number) { return "Rp " + Number(n).toLocaleString("id-ID"); }

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatDate(str: string) {
  return new Date(str + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function elapsedSeconds(fromISO: string, nowISO: string) {
  return Math.floor((new Date(nowISO).getTime() - new Date(fromISO).getTime()) / 1000);
}

function formatElapsed(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

interface Job {
  id: string;
  order_status: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  address: string;
  address_lat: number | null;
  address_lng: number | null;
  landmark: string | null;
  user_note: string | null;
  service_note: string | null;
  partner_earning: number;
  service_amount: number;
  app_fee: number;
  accepted_at: string | null;
  on_the_way_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  user_name: string;
  user_phone: string;
  user_total_orders: number;
  user_uid: string;
  conv_id: string | null;
  proof_photos: string[];
  category_name: string;
  category_emoji: string;
}

export default function JobDetailClient({ job: initialJob }: { job: Job }) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(() =>
    initialJob.started_at ? Math.floor((Date.now() - new Date(initialJob.started_at).getTime()) / 1000) : 0
  );

  // live timer saat in_progress
  useEffect(() => {
    if (job.order_status !== "in_progress" || !job.started_at) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [job.order_status, job.started_at]);

  const callApi = useCallback(async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mitra/job/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.newStatus) {
        setJob(j => ({
          ...j,
          order_status: data.newStatus,
          accepted_at: data.newStatus === "accepted" ? new Date().toISOString() : j.accepted_at,
          on_the_way_at: data.newStatus === "on_the_way" ? new Date().toISOString() : j.on_the_way_at,
          arrived_at: data.newStatus === "arrived" ? new Date().toISOString() : j.arrived_at,
          started_at: data.newStatus === "in_progress" ? new Date().toISOString() : j.started_at,
        }));
        if (data.newStatus === "in_progress") setElapsed(0);
      }
      if (action === "reject") router.replace("/mitra/job");
    } catch {
      alert("Gagal memperbarui status. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [job.id, router]);

  const status = job.order_status;
  const isConfirmed = status === "confirmed";
  const isAccepted = status === "accepted";
  const isOnTheWay = status === "on_the_way";
  const isArrived = status === "arrived";
  const isInProgress = status === "in_progress";
  const isCompleted = status === "completed";
  const isActive = isOnTheWay || isArrived || isInProgress;

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = job.scheduled_date === todayStr;

  const totalDurationSecs = job.duration_hours * 3600;
  const progressPct = isInProgress ? Math.min((elapsed / totalDurationSecs) * 100, 100) : 0;

  const firstName = job.user_name.split(" ")[0];

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 100 }}>

        {/* AppBar — selalu putih */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", position: "sticky", top: 0, zIndex: 10,
          background: "var(--bg)", borderBottom: "1px solid var(--border-soft)",
        }}>
          <BackButton fallback="/mitra/job" />
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
            {isConfirmed ? "Job Baru Masuk" : isAccepted ? "Job Diterima" : isInProgress ? "Sesi berlangsung" : isActive ? "Sesi Aktif" : isCompleted ? "Sesi Selesai" : "Detail Job"}
          </div>
          {isInProgress && (
            <div style={{
              background: "var(--primary-50)", borderRadius: 999,
              padding: "5px 12px", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary)", display: "block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>Live</span>
            </div>
          )}
        </div>

        {/* Timer card — hanya saat in_progress */}
        {isInProgress && (
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{
              background: "var(--grad-hero)", borderRadius: 20,
              padding: "20px 24px 18px", textAlign: "center",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", width: 200, height: 200, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 60%)",
                top: -80, right: -60, pointerEvents: "none",
              }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Berlangsung sejak {job.started_at ? new Date(job.started_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--"}
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: 2, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {formatElapsed(elapsed)}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
                dari {job.duration_hours} jam total
              </div>
              <div style={{ marginTop: 14, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }}>
                <div style={{
                  height: "100%", borderRadius: 2, background: "rgba(255,255,255,0.7)",
                  width: `${progressPct}%`, transition: "width 1s linear",
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Map header — saat confirmed atau aktif */}
        {(isConfirmed || isAccepted || isActive || isInProgress) && (
          <div style={{ padding: "16px 20px 0" }}>
            <a
              href={
                job.address_lat && job.address_lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${job.address_lat},${job.address_lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address + (job.landmark ? `, ${job.landmark}` : ""))}`
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", display: "block" }}
            >
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border-soft)",
                borderRadius: 16, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "var(--primary-100)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-7 8-13a8 8 0 10-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--primary-700)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Lokasi Pengguna</div>
                  <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.address}</div>
                  {job.landmark && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{job.landmark}</div>}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
            </a>
          </div>
        )}

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* User card */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 20, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
              {job.user_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{job.user_name}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                {job.user_total_orders === 0 ? "⭐ Pengguna baru" : `${job.user_total_orders} pesanan sebelumnya`}
              </div>
            </div>
            {(isActive || isInProgress) && (
              <div style={{ display: "flex", gap: 8 }}>
                {job.conv_id && (
                  <a href={`/mitra/chat/${job.conv_id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11,
                      background: "var(--primary-50)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 4v-4H6a2 2 0 01-2-2V6z"/>
                      </svg>
                    </div>
                  </a>
                )}
                <a href={`tel:${job.user_phone}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 4h3l2 5-3 1c1 2.5 3 4.5 5.5 5.5l1-3 5 2v3a2 2 0 01-2 2A14 14 0 013 6a2 2 0 012-2z"/>
                    </svg>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* Job info card */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 20, overflow: "hidden",
          }}>
            {[
              {
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                label: formatDate(job.scheduled_date),
                sub: `${job.start_time} – ${job.end_time} · ${job.duration_hours} jam`,
              },
              {
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-7 8-13a8 8 0 10-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg>,
                label: job.address,
                sub: job.landmark ?? undefined,
              },
              {
                icon: <span style={{ fontSize: 15 }}>{job.category_emoji}</span>,
                label: job.category_name,
                sub: job.service_note ?? undefined,
              },
            ].map((row, i, arr) => (
              <div key={i} style={{
                padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: "var(--primary-50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {row.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", lineHeight: 1.4 }}>{row.label}</div>
                  {row.sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{row.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* User note */}
          {job.user_note && (
            <div style={{
              background: "var(--primary-50)", border: "1px solid var(--primary-200)",
              borderRadius: 16, padding: "12px 14px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Pesan dari {firstName}
              </div>
              <div style={{ fontSize: 13, color: "var(--primary-700)", lineHeight: 1.6 }}>
                {job.user_note}
              </div>
            </div>
          )}

          {/* Status progress (on_the_way / arrived / in_progress) */}
          {isActive && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-soft)",
              borderRadius: 20, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>Status perjalanan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Menuju lokasi", done: !!job.on_the_way_at },
                  { label: "Tiba di lokasi", done: !!job.arrived_at },
                  { label: "Sesi dimulai", done: !!job.started_at },
                ].map((step, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          background: step.done ? "var(--primary)" : "var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
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
                            background: step.done ? "var(--primary-200)" : "var(--border)",
                            margin: "2px 0",
                          }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                        <div style={{
                          fontSize: 13,
                          fontWeight: step.done ? 600 : 400,
                          color: step.done ? "var(--text-1)" : "var(--text-3)",
                        }}>
                          {step.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Earning info */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 20, padding: "14px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 2 }}>Kamu terima</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)" }}>{rp(job.partner_earning)}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right" }}>
              <div>{rp(job.service_amount)} jasa</div>
              <div>− 8% biaya platform</div>
            </div>
          </div>

          {isCompleted && job.proof_photos.length > 0 && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-soft)",
              borderRadius: 20, overflow: "hidden",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                Foto bukti sesi
              </div>
              <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {job.proof_photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: "block", borderRadius: 12, overflow: "hidden", aspectRatio: "4/3" }}>
                    <img src={url} alt={`Bukti ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {isCompleted && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac",
              borderRadius: 16, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Sesi selesai</div>
                <div style={{ fontSize: 12, color: "#16a34a" }}>Saldo akan masuk maks 1 hari kerja</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTAs */}
      {isConfirmed && (
        <div style={{
          position: "sticky", bottom: 0, zIndex: 20,
          background: "var(--surface)", borderTop: "1px solid var(--border-soft)",
          padding: "14px 20px 28px", display: "flex", gap: 10,
          boxShadow: "0 -4px 20px rgba(15,31,29,0.07)",
        }}>
          <button
            onClick={() => callApi("reject")}
            disabled={loading}
            style={{
              flex: 1, padding: "14px", borderRadius: 14,
              border: "1.5px solid var(--border)", background: "var(--surface)",
              fontSize: 14, fontWeight: 700, color: "var(--text-2)",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Tolak
          </button>
          <button
            onClick={() => callApi("advance")}
            disabled={loading}
            style={{
              flex: 2, padding: "14px", borderRadius: 14,
              border: "none", background: "var(--primary)",
              fontSize: 14, fontWeight: 700, color: "#fff",
              cursor: "pointer", fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Memproses..." : "Terima job"}
          </button>
        </div>
      )}

      {isAccepted && (
        <div style={{
          position: "sticky", bottom: 0, zIndex: 20,
          background: "var(--surface)", borderTop: "1px solid var(--border-soft)",
          padding: "14px 20px 28px", display: "flex", gap: 10,
          boxShadow: "0 -4px 20px rgba(15,31,29,0.07)",
        }}>
          <button
            onClick={() => callApi("reject")}
            disabled={loading}
            style={{
              flex: 1, padding: "14px", borderRadius: 14,
              border: "1.5px solid var(--border)", background: "var(--surface)",
              fontSize: 14, fontWeight: 700, color: "var(--text-2)",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Batalkan
          </button>
          <button
            onClick={() => callApi("advance")}
            disabled={loading || !isToday}
            style={{
              flex: 2, padding: "14px", borderRadius: 14,
              border: "none", background: isToday ? "var(--primary)" : "var(--surface-2)",
              fontSize: 14, fontWeight: 700, color: isToday ? "#fff" : "var(--text-3)",
              cursor: isToday ? "pointer" : "not-allowed", fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Memproses..." : isToday ? "Mulai Berangkat" : `Berangkat tgl ${new Date(job.scheduled_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
          </button>
        </div>
      )}

      {isOnTheWay && (
        <div style={{
          position: "sticky", bottom: 0, zIndex: 20,
          background: "var(--surface)", borderTop: "1px solid var(--border-soft)",
          padding: "14px 20px 28px",
          boxShadow: "0 -4px 20px rgba(15,31,29,0.07)",
        }}>
          <button
            onClick={() => callApi("advance")}
            disabled={loading}
            className="btn-primary"
            style={{ fontSize: 15, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Memproses..." : "Konfirmasi tiba di lokasi"}
          </button>
        </div>
      )}

      {isArrived && (
        <div style={{
          position: "sticky", bottom: 0, zIndex: 20,
          background: "var(--surface)", borderTop: "1px solid var(--border-soft)",
          padding: "14px 20px 28px",
          boxShadow: "0 -4px 20px rgba(15,31,29,0.07)",
        }}>
          <button
            onClick={() => callApi("advance")}
            disabled={loading}
            className="btn-primary"
            style={{ fontSize: 15, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Memproses..." : "Mulai sesi"}
          </button>
        </div>
      )}

      {isInProgress && (
        <div style={{
          position: "sticky", bottom: 0, zIndex: 20,
          background: "var(--surface)", borderTop: "1px solid var(--border-soft)",
          padding: "14px 20px 28px",
          boxShadow: "0 -4px 20px rgba(15,31,29,0.07)",
        }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginBottom: 10 }}>
            Wajib upload foto kondisi terakhir saat menyelesaikan
          </div>
          <a href={`/mitra/job/${job.id}/selesai`} style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ fontSize: 15 }}>
              Selesaikan sesi
            </button>
          </a>
        </div>
      )}
    </div>
  );
}
