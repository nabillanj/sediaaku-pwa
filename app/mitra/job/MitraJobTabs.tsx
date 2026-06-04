"use client";

import { useState } from "react";
import Link from "next/link";
import { AppBar } from "@/components/AppBar";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:    { label: "Butuh Konfirmasi", color: "var(--warn)",     bg: "var(--warn-bg)" },
  accepted:     { label: "Diterima",         color: "var(--info)",     bg: "var(--info-bg)" },
  on_the_way:   { label: "Dalam perjalanan", color: "var(--warn)",    bg: "var(--warn-bg)" },
  arrived:      { label: "Tiba",             color: "var(--warn)",    bg: "var(--warn-bg)" },
  in_progress:  { label: "Berlangsung",      color: "var(--primary)", bg: "var(--primary-50)" },
  completed:    { label: "Selesai",          color: "#16a34a",        bg: "#f0fdf4" },
  cancelled:    { label: "Dibatalkan",       color: "var(--danger)",  bg: "var(--danger-bg)" },
};

function rp(n: number) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function formatDate(str: string) {
  const d = new Date(str + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.getTime() === today.getTime()) return "Hari ini";
  if (d.getTime() === tomorrow.getTime()) return "Besok";
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

type Job = {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  order_status: string;
  partner_earning: number;
  address: string;
  user_name: string;
  category_name: string;
  category_emoji: string;
};

function JobCard({ job }: { job: Job }) {
  const status = STATUS_LABEL[job.order_status] ?? { label: job.order_status, color: "var(--text-2)", bg: "var(--surface-2)" };
  const isActive = ["on_the_way","arrived","in_progress"].includes(job.order_status);

  return (
    <Link href={`/mitra/job/${job.id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <div className="avatar" style={{ width: 44, height: 44, fontSize: 16, flexShrink: 0 }}>
            {job.user_name.split(" ").slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{job.user_name}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                color: status.color, background: status.bg, flexShrink: 0,
              }}>
                {status.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>{job.start_time} – {job.end_time}</span>
              <span style={{ color: "var(--text-3)" }}>·</span>
              <span>{job.category_emoji} {job.category_name}</span>
            </div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 6,
          padding: "8px 10px", borderRadius: 10,
          background: "var(--surface-2)", marginBottom: 10,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.4 }}>{job.address}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: job.order_status === "cancelled" ? "var(--text-3)" : "var(--primary)" }}>
            {job.order_status === "cancelled" ? "—" : rp(job.partner_earning)}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: isActive ? "#fff" : "var(--primary)",
            background: isActive ? "var(--primary)" : "var(--primary-50)",
            padding: "6px 14px", borderRadius: 999,
          }}>
            {isActive ? "Lanjutkan" : "Lihat detail"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ tab }: { tab: "upcoming" | "history" }) {
  return (
    <div style={{ padding: "48px 32px", textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: "var(--primary-50)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--primary)", margin: "0 auto 16px",
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 }}>
        {tab === "upcoming" ? "Tidak ada job upcoming" : "Belum ada riwayat job"}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>
        {tab === "upcoming"
          ? "Job baru akan muncul di sini setelah pengguna booking."
          : "Job yang sudah selesai atau dibatalkan akan muncul di sini."}
      </div>
    </div>
  );
}

export default function MitraJobTabs({
  upcoming,
  history,
}: {
  upcoming: Job[];
  history: Job[];
}) {
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const jobs = tab === "upcoming" ? upcoming : history;

  // group upcoming by date, history flat
  const grouped: Record<string, Job[]> = {};
  const today = new Date().toISOString().slice(0, 10);

  if (tab === "upcoming") {
    for (const job of jobs) {
      if (!grouped[job.scheduled_date]) grouped[job.scheduled_date] = [];
      grouped[job.scheduled_date].push(job);
    }
  }

  return (
    <div className="pwa-shell">
      <AppBar title="Job" />

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, padding: "0 16px 12px",
        borderBottom: "1px solid var(--border-soft)",
        flexShrink: 0,
      }}>
        {(["upcoming", "history"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px", borderRadius: 999, border: "none",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: tab === t ? "var(--primary)" : "transparent",
              color: tab === t ? "#fff" : "var(--text-3)",
            }}
          >
            {t === "upcoming" ? `Upcoming${upcoming.length ? ` (${upcoming.length})` : ""}` : "Riwayat"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 24 }}>
        {jobs.length === 0 ? (
          <EmptyState tab={tab} />
        ) : tab === "upcoming" ? (
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(grouped).map(([date, dateJobs]) => (
              <div key={date}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: date === today ? "var(--primary)" : "var(--text-2)",
                  }}>
                    {formatDate(date)}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {new Date(date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--border-soft)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dateJobs.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </div>
  );
}
