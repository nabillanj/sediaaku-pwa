"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createAddress, updateAddress } from "@/lib/actions/addresses";
import { BANDUNG_AREAS } from "@/lib/constants/areas";

const BANDUNG_CENTER: [number, number] = [-6.9175, 107.6191];

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 260, borderRadius: 16, background: "var(--surface-2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-3)", fontSize: 13,
    }}>
      Memuat peta...
    </div>
  ),
});

const LABEL_PRESETS = ["Rumah", "Kantor", "Kost", "Lainnya"];

type InitialData = {
  label: string;
  address: string;
  kabupaten: string;
  latitude: number | null;
  longitude: number | null;
  streetName: string | null;
  isDefault: boolean;
};

type Props = {
  addressId?: string;
  initialData?: InitialData;
};

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "id" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const road = data.address?.road ?? data.address?.pedestrian ?? data.address?.path ?? null;
    const suburb = data.address?.suburb ?? data.address?.city_district ?? null;
    if (road && suburb) return `${road}, ${suburb}`;
    if (road) return road;
    if (suburb) return suburb;
    return null;
  } catch {
    return null;
  }
}

export default function AddressForm({ addressId, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!addressId;

  const initPreset = initialData?.label && !LABEL_PRESETS.slice(0, -1).includes(initialData.label)
    ? "Lainnya"
    : (initialData?.label ?? "Rumah");

  const [label, setLabel] = useState(initPreset);
  const [customLabel, setCustomLabel] = useState(
    initPreset === "Lainnya" ? (initialData?.label ?? "") : ""
  );
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [kabupaten, setKabupaten] = useState(initialData?.kabupaten ?? "");
  const [isDefault, setIsDefault] = useState(initialData?.isDefault ?? false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialData?.latitude != null && initialData?.longitude != null
      ? { lat: initialData.latitude, lng: initialData.longitude }
      : null
  );
  const [streetName, setStreetName] = useState<string | null>(initialData?.streetName ?? null);
  const [geocoding, setGeocoding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reverse geocode whenever coords change
  useEffect(() => {
    if (!coords) { setStreetName(null); return; }
    setGeocoding(true);
    reverseGeocode(coords.lat, coords.lng).then((name) => {
      setStreetName(name);
      setGeocoding(false);
    });
  }, [coords]);

  const finalLabel = label === "Lainnya" ? customLabel : label;
  const mapCenter: [number, number] = coords
    ? [coords.lat, coords.lng]
    : BANDUNG_CENTER;

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!finalLabel.trim()) errs.label = "Label alamat wajib diisi";
    if (!address.trim()) errs.address = "Alamat lengkap wajib diisi";
    if (!kabupaten) errs.kabupaten = "Kota / kabupaten wajib dipilih";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const payload = {
      label: finalLabel.trim(),
      address: address.trim(),
      kabupaten,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      streetName: streetName ?? null,
      isDefault,
    };

    const res = isEdit
      ? await updateAddress(addressId, payload)
      : await createAddress(payload);

    setLoading(false);
    if (!res.ok) { setErrors({ general: res.error ?? "Terjadi kesalahan" }); return; }
    router.push("/profile/addresses");
  }

  return (
    <div className="pwa-shell">
      {/* AppBar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px", flexShrink: 0,
        borderBottom: "1px solid var(--border-soft)",
        background: "var(--surface)",
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: 11, background: "var(--surface-2)",
          border: "none", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
          {isEdit ? "Edit alamat" : "Tambah alamat"}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Map picker */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>
            Tandai lokasi di peta
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-3)", marginLeft: 6 }}>
              (opsional, untuk pencarian mitra terdekat)
            </span>
          </div>
          <MapPicker center={mapCenter} coords={coords} onChange={setCoords} />

          {/* Koordinat + nama jalan */}
          {coords && (
            <div style={{
              marginTop: 8, padding: "10px 12px", borderRadius: 10,
              background: "var(--primary-50)",
              display: "flex", flexDirection: "column", gap: 3,
            }}>
              <div style={{ fontSize: 12, color: "var(--primary-700)", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
              <div style={{ fontSize: 12, color: "var(--primary-700)", fontWeight: 600, paddingLeft: 19 }}>
                {geocoding
                  ? <span style={{ color: "var(--text-3)", fontWeight: 400 }}>Mencari nama jalan...</span>
                  : streetName
                    ? `📍 ${streetName}`
                    : <span style={{ color: "var(--text-3)", fontWeight: 400 }}>Nama jalan tidak ditemukan</span>
                }
              </div>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Label chips */}
          <div>
            <div className="input-label">Label alamat *</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: label === "Lainnya" ? 10 : 0 }}>
              {LABEL_PRESETS.map((l) => (
                <button key={l} type="button"
                  onClick={() => { setLabel(l); setErrors(p => ({ ...p, label: "" })); }}
                  style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    background: label === l ? "var(--primary)" : "var(--surface)",
                    color: label === l ? "#fff" : "var(--text-2)",
                    border: label === l ? "none" : "1.5px solid var(--border)",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            {label === "Lainnya" && (
              <input
                className={`input-field${errors.label ? " error" : ""}`}
                placeholder="Nama label alamat..."
                value={customLabel}
                onChange={(e) => { setCustomLabel(e.target.value); setErrors(p => ({ ...p, label: "" })); }}
                maxLength={40}
                autoFocus
              />
            )}
            {errors.label && <div className="input-error">⚠ {errors.label}</div>}
          </div>

          {/* Kota / Kabupaten */}
          <div>
            <div className="input-label">Kota / Kabupaten *</div>
            <select
              className={`input-field${errors.kabupaten ? " error" : ""}`}
              style={{ appearance: "none", cursor: "pointer" }}
              value={kabupaten}
              onChange={(e) => { setKabupaten(e.target.value); setErrors(p => ({ ...p, kabupaten: "" })); }}
            >
              <option value="">Pilih kota / kabupaten...</option>
              {BANDUNG_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            {errors.kabupaten && <div className="input-error">⚠ {errors.kabupaten}</div>}
          </div>

          {/* Alamat lengkap */}
          <div>
            <div className="input-label">Alamat lengkap *</div>
            <textarea
              className={`input-field${errors.address ? " error" : ""}`}
              placeholder="Nama jalan, nomor, RT/RW, kelurahan, kecamatan..."
              value={address}
              onChange={(e) => { setAddress(e.target.value); setErrors(p => ({ ...p, address: "" })); }}
              rows={3}
              style={{ resize: "none", lineHeight: 1.5 }}
            />
            {errors.address && <div className="input-error">⚠ {errors.address}</div>}
          </div>

          {/* Alamat utama toggle */}
          <div
            onClick={() => setIsDefault((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px", borderRadius: 14, cursor: "pointer",
              background: isDefault ? "var(--primary-50)" : "var(--surface)",
              border: isDefault ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: isDefault ? "var(--primary)" : "transparent",
              border: isDefault ? "none" : "2px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isDefault && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Jadikan alamat utama</div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>Akan dipilih otomatis saat booking</div>
            </div>
          </div>

          {errors.general && (
            <div style={{
              padding: "12px 14px", borderRadius: 12,
              background: "var(--danger-bg)", fontSize: 13, color: "var(--danger)",
            }}>
              ⚠ {errors.general}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 16px 32px", borderTop: "1px solid var(--border-soft)", background: "var(--surface)" }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Simpan alamat"}
        </button>
      </div>
    </div>
  );
}
