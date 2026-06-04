"use client";

import { useState } from "react";
import { AppBar } from "@/components/AppBar";

const DAYS = [
  { key: "monday",    label: "Senin" },
  { key: "tuesday",  label: "Selasa" },
  { key: "wednesday",label: "Rabu" },
  { key: "thursday", label: "Kamis" },
  { key: "friday",   label: "Jumat" },
  { key: "saturday", label: "Sabtu" },
  { key: "sunday",   label: "Minggu" },
];

type DaySchedule = { active: boolean; start: string; end: string };

interface Props {
  initialDays: Record<string, DaySchedule>;
  initialRules: { workStart: string; workEnd: string; minDuration: number; maxRadius: number; minLeadHours: number };
  isCutiAktif: boolean;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 44, height: 26, borderRadius: 999, border: "none", cursor: "pointer",
      background: on ? "var(--primary)" : "var(--border)",
      position: "relative", flexShrink: 0, transition: "background 0.2s",
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

export default function AturJadwalForm({ initialDays, initialRules, isCutiAktif }: Props) {
  const [days, setDays] = useState<Record<string, DaySchedule>>(initialDays);
  const [workStart, setWorkStart] = useState(initialRules.workStart);
  const [workEnd, setWorkEnd] = useState(initialRules.workEnd);
  const [minDuration, setMinDuration] = useState(initialRules.minDuration ?? 2);
  const [cutiAktif, setCutiAktif] = useState(isCutiAktif);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleDay(key: string) {
    setDays(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        active: !prev[key].active,
        start: prev[key].active ? prev[key].start : workStart,
        end: prev[key].active ? prev[key].end : workEnd,
      },
    }));
  }

  function setDayTime(key: string, field: "start" | "end", val: string) {
    setDays(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/mitra/jadwal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        days, workStart, workEnd, cutiAktif,
        minDuration,
        maxRadius: initialRules.maxRadius,
        minLeadHours: initialRules.minLeadHours,
      }),
    });
    setSaving(false);
    if ((await res.json()).ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="pwa-shell">
      <AppBar title="Atur jadwal" />

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 100 }}>
        <div style={{ padding: "0 16px 16px" }}>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
            Atur hari &amp; jam kamu available. Bisa diubah kapan saja.
          </p>
        </div>

        {/* Day list */}
        <div style={{ padding: "0 16px" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {DAYS.map((day, i) => {
              const d = days[day.key];
              return (
                <div key={day.key} style={{
                  padding: "13px 16px",
                  borderBottom: i < DAYS.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Toggle on={d.active} onToggle={() => toggleDay(day.key)} />
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                      {day.label}
                    </div>
                    {d.active ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="time" value={d.start}
                          onChange={e => setDayTime(day.key, "start", e.target.value)}
                          style={{ border: "1.5px solid var(--border)", borderRadius: 10, padding: "5px 8px", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: "var(--text-1)", background: "var(--surface)", outline: "none" }}
                        />
                        <span style={{ fontSize: 13, color: "var(--text-3)" }}>–</span>
                        <input type="time" value={d.end}
                          onChange={e => setDayTime(day.key, "end", e.target.value)}
                          style={{ border: "1.5px solid var(--border)", borderRadius: 10, padding: "5px 8px", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: "var(--text-1)", background: "var(--surface)", outline: "none" }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>Off</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jam standar */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10 }}>
            Jam standar
          </div>
          <div className="card" style={{ padding: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div className="input-label">Mulai</div>
                <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)}
                  className="input-field" style={{ textAlign: "center" }} />
              </div>
              <div>
                <div className="input-label">Selesai</div>
                <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)}
                  className="input-field" style={{ textAlign: "center" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Minimum jam kerja */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10 }}>
            Minimum jam kerja
          </div>
          <div className="card" style={{ padding: "16px" }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.5 }}>
              Durasi minimum yang bisa dipesan pengguna dalam sekali booking.
            </div>
            <select
              value={minDuration}
              onChange={e => setMinDuration(Number(e.target.value))}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 12,
                border: "1.5px solid var(--border-soft)", background: "var(--surface)",
                fontSize: 14, fontWeight: 600, color: "var(--text-1)",
                fontFamily: "inherit", outline: "none", appearance: "none", cursor: "pointer",
              }}
            >
              {Array.from({ length: 8 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>{h} jam</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cuti mendadak */}
        <div style={{ padding: "16px 16px 0" }}>
          <div className="card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Cuti / off mendadak</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  Nonaktifkan semua booking masuk sementara
                </div>
              </div>
              <Toggle on={cutiAktif} onToggle={() => setCutiAktif(v => !v)} />
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "12px 16px", background: "var(--surface)",
        borderTop: "1px solid var(--border-soft)",
      }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saved ? "✓ Tersimpan" : saving ? "Menyimpan..." : "Simpan jadwal"}
        </button>
      </div>
    </div>
  );
}
