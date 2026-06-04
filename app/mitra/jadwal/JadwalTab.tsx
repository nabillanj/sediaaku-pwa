"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const MONTH_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAY_SHORT = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

type Job = {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  order_status: string;
  user_name: string;
  category_name: string;
  category_emoji: string;
  partner_earning: number;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:   { label: "Butuh Konfirmasi", color: "var(--warn)", bg: "var(--warn-bg)" },
  accepted:    { label: "Diterima",         color: "var(--info)", bg: "var(--info-bg)" },
  on_the_way:  { label: "Perjalanan",   color: "var(--warn)",    bg: "var(--warn-bg)" },
  arrived:     { label: "Tiba",         color: "var(--warn)",    bg: "var(--warn-bg)" },
  in_progress: { label: "Berjalan",     color: "var(--primary)", bg: "var(--primary-50)" },
  completed:   { label: "Selesai",      color: "#16a34a",        bg: "#f0fdf4" },
};

function rp(n: number) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default function JadwalTab({ jobs }: { jobs: Job[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(today + "T00:00:00");

  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  const jobsByDate = useMemo(() => {
    const m: Record<string, Job[]> = {};
    for (const j of jobs) {
      if (!m[j.scheduled_date]) m[j.scheduled_date] = [];
      m[j.scheduled_date].push(j);
    }
    return m;
  }, [jobs]);

  const selectedJobs = jobsByDate[selectedDate] ?? [];

  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startOffset = (firstDay + 6) % 7;
    const cells: (number | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function cellDate(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  const isPast = (d: string) => d < today;
  const isUpcoming = (d: string) => d > today;

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 90 }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)" }}>Jadwal</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              {todayDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <Link href="/mitra/jadwal/atur" style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 12,
              background: "var(--primary-50)", color: "var(--primary)",
              fontSize: 13, fontWeight: 700,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Atur jadwal
            </div>
          </Link>
        </div>

        {/* Calendar */}
        <div style={{ padding: "16px 16px 0" }}>
          <div className="card" style={{ padding: "16px" }}>

            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                {MONTH_ID[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
              {DAY_SHORT.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-3)", paddingBottom: 6 }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
              {calDays.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const iso = cellDate(day);
                const hasJobs = (jobsByDate[iso]?.length ?? 0) > 0;
                const isSelected = iso === selectedDate;
                const isToday = iso === today;
                const past = isPast(iso);
                return (
                  <button key={idx} onClick={() => setSelectedDate(iso)}
                    style={{
                      width: "100%", aspectRatio: "1", borderRadius: "50%", border: "none",
                      cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 2,
                      background: isSelected ? "var(--primary)" : "transparent",
                    }}
                  >
                    <span style={{
                      fontSize: 13,
                      fontWeight: isToday || isSelected ? 800 : 400,
                      color: isSelected ? "#fff" : past ? "var(--text-3)" : "var(--text-1)",
                      lineHeight: 1,
                    }}>
                      {day}
                    </span>
                    {hasJobs && (
                      <div style={{
                        width: 4, height: 4, borderRadius: "50%",
                        background: isSelected ? "rgba(255,255,255,0.75)" : "var(--primary)",
                      }} />
                    )}
                    {isToday && !isSelected && !hasJobs && (
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--primary-200)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Job panel for selected date */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
              {selectedDate === today
                ? "Hari ini"
                : new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            {isPast(selectedDate) && selectedDate !== today && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 999 }}>Riwayat</span>
            )}
            {isUpcoming(selectedDate) && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--primary)", background: "var(--primary-50)", padding: "2px 8px", borderRadius: 999 }}>Upcoming</span>
            )}
          </div>

          {selectedJobs.length === 0 ? (
            <div style={{
              padding: "24px 16px", textAlign: "center", borderRadius: 16,
              background: "var(--surface)", border: "1px dashed var(--border)",
            }}>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                {isPast(selectedDate) && selectedDate !== today
                  ? "Tidak ada job di tanggal ini"
                  : "Belum ada job terjadwal"}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedJobs.map(job => {
                const status = STATUS_MAP[job.order_status] ?? { label: job.order_status, color: "var(--text-2)", bg: "var(--surface-2)" };
                return (
                  <Link key={job.id} href={`/mitra/job/${job.id}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{job.user_name}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, color: status.color, background: status.bg, flexShrink: 0 }}>
                              {status.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{job.start_time} – {job.end_time}</span>
                            <span style={{ color: "var(--text-3)" }}>·</span>
                            <span>{job.category_emoji} {job.category_name}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                          {rp(job.partner_earning)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ height: 8 }} />
      </div>

      {/* Tab bar */}
      <nav className="tabbar">
        {[
          { href: "/mitra/home", label: "Job", active: false, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg> },
          { href: "/mitra/jadwal", label: "Jadwal", active: true, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
          { href: "/mitra/chat", label: "Chat", active: false, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
          { href: "/mitra/profil", label: "Profil", active: false, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
        ].map(t => (
          <Link key={t.label} href={t.href}
            className={`tabbar-item${t.active ? " active" : ""}`}
            style={{ textDecoration: "none", color: t.active ? "var(--primary)" : "var(--text-3)" }}>
            {t.icon}
            <span className="tabbar-label">{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
