"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";

const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const DAY_LABELS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function rp(n: number) { return "Rp " + n.toLocaleString("id-ID"); }
function pad(n: number) { return String(n).padStart(2, "0"); }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

interface Service {
  categoryId: string;
  categoryName: string;
  emoji: string;
  ratePerHour: number;
}

interface Partner {
  uid: string;
  name: string;
  photoUrl?: string;
  rating?: number;
  totalJobs: number;
}

interface Availability {
  workStart: string;
  workEnd: string;
  minDurationHours: number;
  minBookingLeadHours: number;
  activeDays: Record<string, { start: string; end: string }>;
  blockedDates: string[];
  bookedSlots: Record<string, string[]>;
}

export default function BookingScheduleClient({
  partner,
  services,
  availability,
  todayWIB,
  hourWIB,
  minuteWIB,
}: {
  partner: Partner;
  services: Service[];
  availability: Availability;
  todayWIB: string;
  hourWIB: number;
  minuteWIB: number;
}) {
  const router = useRouter();
  const todayStr = todayWIB;
  const today = new Date(todayWIB + "T00:00:00");
  // jam minimal yang bisa dipesan hari ini (jam sekarang WIB + lead hours, dibulatkan ke atas)
  const minBookableHourToday = hourWIB + availability.minBookingLeadHours + (minuteWIB > 0 ? 1 : 0);

  const [selectedService, setSelectedService] = useState<Service | null>(
    services.length === 1 ? services[0] : null
  );
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(availability.minDurationHours);

  const blockedSet = useMemo(() => new Set(availability.blockedDates), [availability.blockedDates]);

  const calDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  function getDayStatus(day: number): "available" | "full" | "unavailable" | "past" {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    const date = new Date(viewYear, viewMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (date < todayStart) return "past";
    const dayKey = DAY_NAMES[date.getDay()];
    if (!availability.activeDays[dayKey]) return "unavailable";
    if (blockedSet.has(dateStr)) return "unavailable";
    const dayAvail = availability.activeDays[dayKey];
    let startH = parseInt(dayAvail.start.split(":")[0]);
    const endH = parseInt(dayAvail.end.split(":")[0]);
    // untuk hari ini, geser startH ke minimum bookable
    if (dateStr === todayStr) startH = Math.max(startH, minBookableHourToday);
    const booked = availability.bookedSlots[dateStr] ?? [];
    const bookedHours = new Set<number>();
    for (const slot of booked) {
      const [s, e] = slot.split("-").map((t) => parseInt(t.split(":")[0]));
      for (let h = s; h < e; h++) bookedHours.add(h);
    }
    // cek apakah ada slot mulai yang valid (cukup durasi min tanpa bentrok)
    for (let h = startH; h <= endH - availability.minDurationHours; h++) {
      let ok = true;
      for (let i = h; i < h + availability.minDurationHours; i++) {
        if (bookedHours.has(i)) { ok = false; break; }
      }
      if (ok) return "available";
    }
    return "full";
  }

  const availableHours = useMemo(() => {
    if (!selectedDate) return [];
    const date = new Date(selectedDate);
    const dayKey = DAY_NAMES[date.getDay()];
    const dayAvail = availability.activeDays[dayKey];
    if (!dayAvail) return [];
    let startH = parseInt(dayAvail.start.split(":")[0]);
    const endH = parseInt(dayAvail.end.split(":")[0]);
    // hari ini: filter jam yang sudah lewat + lead time
    if (selectedDate === todayStr) startH = Math.max(startH, minBookableHourToday);
    const bookedRanges = availability.bookedSlots[selectedDate] ?? [];
    const bookedHours = new Set<number>();
    for (const slot of bookedRanges) {
      const [s, e] = slot.split("-").map((t) => parseInt(t.split(":")[0]));
      for (let h = s; h < e; h++) bookedHours.add(h);
    }
    const slots: number[] = [];
    for (let h = startH; h <= endH - availability.minDurationHours; h++) {
      let canStart = true;
      for (let i = h; i < h + availability.minDurationHours; i++) {
        if (bookedHours.has(i)) { canStart = false; break; }
      }
      if (canStart) slots.push(h);
    }
    return slots;
  }, [selectedDate, availability]);

  const maxDuration = useMemo(() => {
    if (!selectedDate || startHour === null) return availability.minDurationHours;
    const date = new Date(selectedDate);
    const dayKey = DAY_NAMES[date.getDay()];
    const dayAvail = availability.activeDays[dayKey];
    if (!dayAvail) return availability.minDurationHours;
    const endH = parseInt(dayAvail.end.split(":")[0]);
    const bookedRanges = availability.bookedSlots[selectedDate] ?? [];
    const bookedHours = new Set<number>();
    for (const slot of bookedRanges) {
      const [s, e] = slot.split("-").map((t) => parseInt(t.split(":")[0]));
      for (let h = s; h < e; h++) bookedHours.add(h);
    }
    let max = 0;
    for (let h = startHour; h < endH; h++) {
      if (bookedHours.has(h)) break;
      max++;
    }
    return Math.max(max, availability.minDurationHours);
  }, [selectedDate, startHour, availability]);

  const endHour = startHour !== null ? startHour + duration : null;
  const totalAmount = selectedService ? duration * selectedService.ratePerHour : 0;
  const canContinue = selectedService && selectedDate && startHour !== null;

  function handleContinue() {
    if (!canContinue || !selectedService || startHour === null) return;
    const booking = {
      partnerUid: partner.uid,
      partnerName: partner.name,
      partnerPhoto: partner.photoUrl,
      categoryId: selectedService.categoryId,
      categoryName: selectedService.categoryName,
      ratePerHour: selectedService.ratePerHour,
      scheduledDate: selectedDate,
      startTime: `${pad(startHour)}:00`,
      endTime: `${pad(endHour!)}:00`,
      durationHours: duration,
      serviceAmount: totalAmount,
    };
    sessionStorage.setItem("bookingDraft", JSON.stringify(booking));
    router.push(`/booking/${partner.uid}/alamat`);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null); setStartHour(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null); setStartHour(null);
  }

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: canContinue ? 96 : 24 }}>

        {/* AppBar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", position: "sticky", top: 0,
          background: "var(--bg)", zIndex: 10,
          borderBottom: "1px solid var(--border-soft)",
        }}>
          <BackButton fallback={`/partner/${partner.uid}`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Pilih Jadwal</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>1 dari 3</div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Partner chip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 16, padding: "12px 14px",
          }}>
            {partner.photoUrl ? (
              <img src={partner.photoUrl} alt={partner.name}
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div className="avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                {partner.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{partner.name}</div>
              {selectedService ? (
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {selectedService.emoji} {selectedService.categoryName} · {rp(selectedService.ratePerHour)}/jam
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Pilih layanan di bawah</div>
              )}
            </div>
            {partner.rating && (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>
                ★ {partner.rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Service picker — tampil kalau lebih dari 1 layanan */}
          {services.length > 1 && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-soft)",
              borderRadius: 20, padding: "16px",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>
                Pilih layanan
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {services.map((svc) => {
                  const active = selectedService?.categoryId === svc.categoryId;
                  return (
                    <button
                      key={svc.categoryId}
                      onClick={() => {
                        setSelectedService(svc);
                        setSelectedDate(null);
                        setStartHour(null);
                        setDuration(availability.minDurationHours);
                      }}
                      style={{
                        textAlign: "left", padding: "12px 14px", borderRadius: 14,
                        border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                        background: active ? "var(--primary-50)" : "var(--surface-2)",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: active ? "var(--primary)" : "var(--surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20,
                      }}>
                        {svc.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                          {svc.categoryName}
                        </div>
                        <div style={{ fontSize: 12, color: active ? "var(--primary-700)" : "var(--text-3)" }}>
                          {rp(svc.ratePerHour)}/jam
                        </div>
                      </div>
                      <div style={{
                        width: 22, height: 22, borderRadius: active ? 6 : 999, flexShrink: 0,
                        background: active ? "var(--primary)" : "transparent",
                        border: active ? "none" : "1.5px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {active && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calendar — tampil setelah pilih layanan */}
          {selectedService && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-soft)",
              borderRadius: 20, padding: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <button onClick={prevMonth} style={{
                  width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border)",
                  background: "var(--surface-2)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </div>
                <button onClick={nextMonth} style={{
                  width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border)",
                  background: "var(--surface-2)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
                {DAY_LABELS.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-3)", paddingBottom: 4 }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {calDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const dateStr = toDateStr(viewYear, viewMonth, day);
                  const status = getDayStatus(day);
                  const isSelected = selectedDate === dateStr;
                  const isAvail = status === "available";
                  const isFull = status === "full";
                  const isPast = status === "past";

                  return (
                    <button
                      key={dateStr}
                      disabled={!isAvail}
                      onClick={() => { setSelectedDate(dateStr); setStartHour(null); setDuration(availability.minDurationHours); }}
                      style={{
                        height: 40, borderRadius: 10, border: "none",
                        cursor: isAvail ? "pointer" : "default",
                        fontWeight: isSelected ? 800 : 600, fontSize: 13,
                        background: isSelected ? "var(--primary)" : isAvail ? "var(--primary-50)" : "transparent",
                        color: isSelected ? "#fff"
                          : isPast || status === "unavailable" ? "var(--text-4,#CBD5E1)"
                          : isFull ? "var(--text-3)"
                          : "var(--primary-700)",
                        position: "relative",
                      }}
                    >
                      {day}
                      {isFull && !isSelected && (
                        <span style={{
                          position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
                          width: 4, height: 4, borderRadius: "50%", background: "var(--danger)", display: "block",
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 14, marginTop: 12, justifyContent: "center" }}>
                {[
                  { color: "var(--primary-50)", label: "Tersedia" },
                  { color: "var(--danger)", label: "Penuh", dot: true },
                  { color: "transparent", label: "Tdk tersedia" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: 3,
                      background: l.dot ? "transparent" : l.color,
                      border: l.dot ? "none" : "1px solid var(--border-soft)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {l.dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: l.color, display: "block" }} />}
                    </span>
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time + duration — muncul setelah pilih tanggal */}
          {selectedDate && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border-soft)",
              borderRadius: 20, padding: "16px",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>
                Jam mulai
              </div>
              {availableHours.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "12px 0" }}>
                  Tidak ada slot tersedia
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {availableHours.map(h => (
                    <button
                      key={h}
                      onClick={() => { setStartHour(h); setDuration(availability.minDurationHours); }}
                      style={{
                        padding: "8px 16px", borderRadius: 10,
                        border: `1px solid ${startHour === h ? "var(--primary)" : "var(--border)"}`,
                        background: startHour === h ? "var(--primary)" : "var(--surface-2)",
                        color: startHour === h ? "#fff" : "var(--text-1)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      {pad(h)}.00
                    </button>
                  ))}
                </div>
              )}

              {startHour !== null && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>
                    Durasi
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                      onClick={() => setDuration(d => Math.max(availability.minDurationHours, d - 1))}
                      disabled={duration <= availability.minDurationHours}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
                        background: "var(--surface-2)", cursor: "pointer", fontSize: 20, fontWeight: 700,
                        color: "var(--text-1)", display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: duration <= availability.minDurationHours ? 0.4 : 1,
                      }}
                    >−</button>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", minWidth: 60, textAlign: "center" }}>
                      {duration} jam
                    </div>
                    <button
                      onClick={() => setDuration(d => Math.min(maxDuration, d + 1))}
                      disabled={duration >= maxDuration}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
                        background: "var(--surface-2)", cursor: "pointer", fontSize: 20, fontWeight: 700,
                        color: "var(--text-1)", display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: duration >= maxDuration ? 0.4 : 1,
                      }}
                    >+</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary strip */}
          {canContinue && startHour !== null && selectedService && (
            <div style={{
              background: "var(--primary-50)", border: "1px solid var(--primary-200)",
              borderRadius: 16, padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-700)" }}>
                {new Date(selectedDate!).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}{pad(startHour)}.00 – {pad(endHour!)}.00
              </div>
              <div style={{ fontSize: 12, color: "var(--primary-700)" }}>
                {duration} jam × {rp(selectedService.ratePerHour)} = <strong>{rp(totalAmount)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      {canContinue && startHour !== null && (
        <div style={{
          position: "sticky", bottom: 0, zIndex: 20,
          background: "var(--surface)", borderTop: "1px solid var(--border-soft)",
          padding: "14px 20px 28px",
          boxShadow: "0 -4px 20px rgba(15,31,29,0.07)",
        }}>
          <button className="btn-primary" onClick={handleContinue} style={{ fontSize: 15 }}>
            Lanjut isi detail
          </button>
        </div>
      )}
    </div>
  );
}
