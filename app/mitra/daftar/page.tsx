"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { BANDUNG_AREAS } from "@/lib/constants/areas";

function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
      {[1, 2, 3].map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < 2 ? "unset" : undefined }}>
          <div style={{
            width: 26, height: 26, borderRadius: 999,
            background: s < current ? "var(--primary)" : s === current ? "var(--primary)" : "var(--surface-2)",
            color: s <= current ? "#fff" : "var(--text-3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700,
          }}>
            {s < current
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              : s}
          </div>
          {i < 2 && <div style={{ width: 60, height: 2, background: s < current ? "var(--primary)" : "var(--border)", borderRadius: 1 }} />}
        </div>
      ))}
    </div>
  );
}

function MitraDaftarForm() {
  const router = useRouter();
  const params = useSearchParams();

  const phone = params.get("phone") ?? "";
  const name0 = params.get("name") ?? "";
  const city0 = params.get("city") ?? "";

  const [name, setName] = useState(name0);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Perempuan" | "Laki-laki">("Perempuan");
  const [city, setCity] = useState(city0 && (BANDUNG_AREAS as readonly string[]).includes(city0) ? city0 : "");
  const [domicileDetail, setDomicileDetail] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(10);
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nama lengkap wajib diisi";
    if (!birthDate) e.birthDate = "Tanggal lahir wajib diisi";
    else {
      const age = (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 17) e.birthDate = "Minimal berusia 17 tahun";
    }
    if (!city) e.city = "Kota / Kabupaten wajib dipilih";
    return e;
  }

  function handleNext() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const sp = new URLSearchParams({
      phone, name: name.trim(), birthDate, gender,
      city, domicileDetail: domicileDetail.trim(),
      serviceRadiusKm: String(serviceRadiusKm),
      bio: bio.trim(),
    });
    router.push(`/mitra/daftar/layanan?${sp.toString()}`);
  }

  return (
    <div className="pwa-shell">
      <AppBar title="Daftar Teman Sedia" />
      <div style={{ flex: 1, padding: "0 20px", overflow: "auto" }}>
        <StepDots current={1} />
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Langkah 1 dari 3</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "var(--text-1)" }}>Data diri kamu</h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}>Sesuai dengan KTP yang akan diupload nanti.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nama */}
          <div>
            <div className="input-label">Nama lengkap (sesuai KTP) *</div>
            <input className={`input-field${errors.name ? " error" : ""}`} type="text" placeholder="Nama sesuai KTP" value={name}
              onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }} />
            {errors.name && <div className="input-error">⚠ {errors.name}</div>}
          </div>

          {/* Tanggal lahir */}
          <div>
            <div className="input-label">Tanggal lahir *</div>
            <input className={`input-field${errors.birthDate ? " error" : ""}`} type="date" value={birthDate}
              onChange={(e) => { setBirthDate(e.target.value); setErrors(p => ({ ...p, birthDate: "" })); }}
              max={new Date().toISOString().split("T")[0]} />
            {errors.birthDate && <div className="input-error">⚠ {errors.birthDate}</div>}
          </div>

          {/* Jenis kelamin */}
          <div>
            <div className="input-label">Jenis kelamin *</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["Perempuan", "Laki-laki"] as const).map((g) => (
                <button key={g} onClick={() => setGender(g)} style={{
                  padding: 12, borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                  background: gender === g ? "var(--primary-50)" : "var(--surface)",
                  border: gender === g ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                  color: gender === g ? "var(--primary-700)" : "var(--text-2)",
                  fontSize: 13, fontWeight: gender === g ? 700 : 500,
                }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Domisili */}
          <div>
            <div className="input-label">Kota / Kabupaten *</div>
            <select
              className={`input-field${errors.city ? " error" : ""}`}
              style={{ appearance: "none", cursor: "pointer" }}
              value={city}
              onChange={(e) => { setCity(e.target.value); setErrors(p => ({ ...p, city: "" })); }}
            >
              <option value="">Pilih kota / kabupaten...</option>
              {BANDUNG_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
              Saat ini Sediaaku tersedia di area Bandung Raya
            </div>
            {errors.city && <div className="input-error">⚠ {errors.city}</div>}
          </div>

          {/* Kecamatan home base */}
          <div>
            <div className="input-label">Kecamatan / area rumah <span style={{ color: "var(--text-3)", fontWeight: 500 }}>(opsional)</span></div>
            <input className="input-field" type="text" placeholder="cth: Antapani, Buahbatu, Cicendo..." value={domicileDetail}
              onChange={(e) => setDomicileDetail(e.target.value)} />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Area tempat tinggalmu sekarang</div>
          </div>

          {/* Radius layanan */}
          <div>
            <div className="input-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Jangkauan layanan *</span>
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>{serviceRadiusKm} km</span>
            </div>
            <input
              type="range"
              min={3} max={30} step={1}
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              <span>3 km</span>
              <span>Seberapa jauh kamu mau jangkau pelanggan</span>
              <span>30 km</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="input-label">Bio singkat <span style={{ color: "var(--text-3)", fontWeight: 500 }}>(opsional)</span></div>
            <textarea
              className="input-field"
              style={{ minHeight: 80, resize: "none", lineHeight: 1.5 }}
              placeholder="Ceritakan sedikit tentang dirimu & pengalamanmu..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
            />
            <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right", marginTop: 4 }}>{bio.length}/200</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 20px 32px" }}>
        <button className="btn-primary" onClick={handleNext}>Lanjut</button>
      </div>
    </div>
  );
}

export default function MitraDaftarPage() {
  return <Suspense><MitraDaftarForm /></Suspense>;
}
