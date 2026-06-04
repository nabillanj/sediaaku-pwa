"use client";

import { useState } from "react";
import { AppBar } from "@/components/AppBar";

type ServiceState = {
  categoryId: string;
  name: string;
  description: string;
  emoji: string;
  rate: number;
  skills: string[];
  active: boolean;
};

interface Props {
  initialServices: ServiceState[];
}

async function saveTarif(data: {
  services: { categoryId: string; rate: number; skills: string[]; active: boolean }[];
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/mitra/tarif", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

function SkillInput({ skills, onAdd }: { skills: string[]; onAdd: (s: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) {
            onAdd(val.trim());
            setVal("");
          }
        }}
        placeholder="Tambah keahlian..."
        style={{
          flex: 1, border: "1.5px solid var(--border)", borderRadius: 10,
          padding: "7px 12px", fontSize: 13, fontFamily: "inherit",
          color: "var(--text-1)", background: "var(--surface)", outline: "none",
        }}
      />
      <button
        onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(""); } }}
        style={{
          padding: "7px 14px", borderRadius: 10, border: "none",
          background: "var(--primary-50)", color: "var(--primary)",
          fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
        }}
      >
        + Tambah
      </button>
    </div>
  );
}

export default function AturTarifForm({ initialServices }: Props) {
  const [services, setServices] = useState<ServiceState[]>(initialServices);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateService(id: string, patch: Partial<ServiceState>) {
    setServices((prev) => prev.map((s) => s.categoryId === id ? { ...s, ...patch } : s));
  }

  function addSkill(catId: string, skill: string) {
    setServices((prev) => prev.map((s) =>
      s.categoryId === catId && !s.skills.includes(skill)
        ? { ...s, skills: [...s.skills, skill] }
        : s
    ));
  }

  function removeSkill(catId: string, skill: string) {
    setServices((prev) => prev.map((s) =>
      s.categoryId === catId ? { ...s, skills: s.skills.filter((sk) => sk !== skill) } : s
    ));
  }

  async function handleSave() {
    setSaving(true);
    const res = await saveTarif({
      services: services.map((s) => ({
        categoryId: s.categoryId,
        rate: s.rate,
        skills: s.skills,
        active: s.active,
      })),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const activeServices = services.filter((s) => s.active);
  const inactiveServices = services.filter((s) => !s.active);

  return (
    <div className="pwa-shell">
      <AppBar title="Atur layanan & tarif" />

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 100 }}>
        {/* Subtitle */}
        <div style={{ padding: "0 16px 16px" }}>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
            Perubahan tarif berlaku untuk pesanan baru. Pesanan yang sudah masuk tetap pakai tarif lama.
          </p>
        </div>

        {/* Layanan aktif */}
        <div style={{ padding: "0 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10 }}>
            Layanan aktif ({activeServices.length})
          </div>

          {activeServices.length === 0 ? (
            <div style={{
              borderRadius: 16, padding: "24px 20px", textAlign: "center",
              background: "var(--surface)", border: "1px dashed var(--border)",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📋</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>Belum ada layanan aktif</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {activeServices.map((svc) => (
                <div key={svc.categoryId} className="card" style={{ padding: 16 }}>
                  {/* Header layanan */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: "var(--primary-50)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20,
                    }}>
                      {svc.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{svc.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{svc.description}</div>
                    </div>
                    <button
                      onClick={() => updateService(svc.categoryId, { active: false })}
                      style={{
                        fontSize: 11, fontWeight: 600, padding: "5px 10px",
                        borderRadius: 999, border: "1px solid var(--border)",
                        background: "var(--surface-2)", color: "var(--text-2)",
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Nonaktifkan
                    </button>
                  </div>

                  {/* Tarif */}
                  <div style={{ marginBottom: 14 }}>
                    <div className="input-label">Tarif per jam</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", flexShrink: 0 }}>Rp</span>
                      <input
                        type="number"
                        value={svc.rate}
                        min={0}
                        onChange={(e) => updateService(svc.categoryId, { rate: Number(e.target.value) })}
                        className="input-field"
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", flexShrink: 0 }}>/&nbsp;jam</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="input-label">Keahlian ({svc.skills.length})</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {svc.skills.map((sk) => (
                        <span key={sk} className="tag tag-primary" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {sk}
                          <button
                            onClick={() => removeSkill(svc.categoryId, sk)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              padding: 0, lineHeight: 1, color: "var(--primary-700)",
                              fontSize: 14, marginLeft: 2,
                            }}
                          >×</button>
                        </span>
                      ))}
                    </div>
                    <SkillInput skills={svc.skills} onAdd={(s) => addSkill(svc.categoryId, s)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Layanan belum aktif */}
        {inactiveServices.length > 0 && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10 }}>
              Belum aktif
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
              {inactiveServices.map((svc, i) => (
                <div key={svc.categoryId} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  borderBottom: i < inactiveServices.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: "var(--surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>
                    {svc.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{svc.name}</div>
                    <div style={{
                      fontSize: 12, color: "var(--text-3)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{svc.description}</div>
                  </div>
                  <button
                    onClick={() => updateService(svc.categoryId, { active: true, rate: svc.rate || 50000 })}
                    style={{
                      fontSize: 12, fontWeight: 700, padding: "7px 14px",
                      borderRadius: 999, border: "none", flexShrink: 0,
                      background: "var(--primary-50)", color: "var(--primary)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Aktifkan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>

      {/* Save button */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "12px 16px",
        background: "var(--surface)",
        borderTop: "1px solid var(--border-soft)",
      }}>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? "✓ Tersimpan" : saving ? "Menyimpan..." : "Simpan perubahan"}
        </button>
      </div>
    </div>
  );
}
