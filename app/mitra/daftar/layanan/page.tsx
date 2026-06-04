"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { listCategories, type Category } from "@/lib/actions/partner";

const SKILLS_BY_CAT: Record<string, string[]> = {
  jagain:  ["Anak balita", "Anak SD", "Lansia", "Hewan peliharaan", "Anak berkebutuhan khusus"],
  asuhin:  ["Pendampingan lansia", "Pendampingan anak", "Pertolongan pertama", "Memasak ringan"],
  bantuin: ["Antre", "Beres-beres", "Angkat barang", "Acara kecil"],
  anterin: ["Dokumen", "Belanjaan", "Barang pribadi"],
  temenin: ["Rumah sakit", "Belanja", "Acara", "Aktivitas"],
};

function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
      {[1, 2, 3].map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 999,
            background: s <= current ? "var(--primary)" : "var(--surface-2)",
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

function LayananForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rates, setRates] = useState<Record<string, string>>({});
  const [skills, setSkills] = useState<Record<string, Set<string>>>({});
  const [customSkill, setCustomSkill] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateErrors, setRateErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    listCategories().then(setCategories);
  }, []);

  function toggleCategory(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    setErrors(p => ({ ...p, categories: "" }));
  }

  function toggleSkill(catId: string, skill: string) {
    setSkills(prev => {
      const catSkills = new Set(prev[catId] ?? []);
      if (catSkills.has(skill)) catSkills.delete(skill); else catSkills.add(skill);
      return { ...prev, [catId]: catSkills };
    });
  }

  function addCustomSkill(catId: string) {
    const s = (customSkill[catId] ?? "").trim();
    if (!s) return;
    setSkills(prev => {
      const catSkills = new Set(prev[catId] ?? []);
      catSkills.add(s);
      return { ...prev, [catId]: catSkills };
    });
    setCustomSkill(p => ({ ...p, [catId]: "" }));
  }

  function handleNext() {
    const errs: Record<string, string> = {};
    const rErrs: Record<string, string> = {};
    if (selected.size === 0) errs.categories = "Pilih minimal 1 layanan";

    for (const id of selected) {
      const v = Number((rates[id] ?? "").replace(/\D/g, ""));
      if (!rates[id] || v < 15000) rErrs[id] = "Tarif minimal Rp 15.000/jam";
      if (v > 500000) rErrs[id] = "Tarif maksimal Rp 500.000/jam";
    }

    if (Object.keys(errs).length > 0 || Object.keys(rErrs).length > 0) {
      setErrors(errs);
      setRateErrors(rErrs);
      return;
    }

    const services = Array.from(selected).map(id => ({
      categoryId: id,
      ratePerHour: Number((rates[id] ?? "").replace(/\D/g, "")),
      skills: Array.from(skills[id] ?? []),
    }));

    const sp = new URLSearchParams(Object.fromEntries(params.entries()));
    sp.set("services", JSON.stringify(services));
    router.push(`/mitra/daftar/dokumen?${sp.toString()}`);
  }

  return (
    <div className="pwa-shell">
      <AppBar title="Daftar Teman Sedia" />
      <div style={{ flex: 1, padding: "0 20px", overflow: "auto" }}>
        <StepDots current={2} />
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Langkah 2 dari 3</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "var(--text-1)" }}>Apa yang bisa kamu bantu?</h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>Pilih layanan yang ditawarkan & tarif per jam.</p>

        {errors.categories && <div className="input-error" style={{ marginBottom: 12 }}>⚠ {errors.categories}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {categories.map(cat => {
            const isSelected = selected.has(cat.id);
            return (
              <div key={cat.id} className="card" style={{
                padding: 14,
                border: isSelected ? "1.5px solid var(--primary)" : "1px solid var(--border-soft)",
                background: isSelected ? "var(--primary-50)" : "var(--surface)",
              }}>
                <button onClick={() => toggleCategory(cat.id)} style={{
                  width: "100%", background: "none", border: "none",
                  cursor: "pointer", fontFamily: "inherit", padding: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: isSelected ? "var(--primary-100)" : "var(--surface-2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20,
                    }}>
                      {cat.emoji}
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{cat.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)" }}>{cat.description}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: isSelected ? 6 : 999,
                      background: isSelected ? "var(--primary)" : "transparent",
                      border: isSelected ? "none" : "1.5px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>

                {isSelected && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--primary-200)" }}>
                    {/* Rate input */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-700)", marginBottom: 6 }}>Tarif per jam *</div>
                    <div style={{
                      background: "#fff", border: rateErrors[cat.id] ? "1.5px solid var(--danger)" : "1.5px solid var(--primary)",
                      borderRadius: 10, padding: "10px 12px",
                      display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>Rp</span>
                      <input
                        style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontWeight: 700, color: "var(--primary)", fontFamily: "inherit", background: "transparent" }}
                        type="text" inputMode="numeric" placeholder="0"
                        value={rates[cat.id] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setRates(p => ({ ...p, [cat.id]: val }));
                          setRateErrors(p => ({ ...p, [cat.id]: "" }));
                        }}
                      />
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>/ jam</span>
                    </div>
                    {rateErrors[cat.id] && <div className="input-error" style={{ marginBottom: 8 }}>⚠ {rateErrors[cat.id]}</div>}

                    {/* Skills */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-700)", marginBottom: 6 }}>
                      Keahlian <span style={{ fontWeight: 500, color: "var(--text-3)" }}>(opsional)</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                      {(SKILLS_BY_CAT[cat.id] ?? []).map(sk => {
                        const on = skills[cat.id]?.has(sk);
                        return (
                          <button key={sk} onClick={() => toggleSkill(cat.id, sk)}
                            style={{
                              padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                              background: on ? "var(--primary)" : "#fff",
                              color: on ? "#fff" : "var(--text-2)",
                              border: on ? "none" : "1px solid var(--primary-200)",
                            }}>
                            {on ? "✓ " : "+ "}{sk}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom skill */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        style={{ flex: 1, border: "1.5px solid var(--primary)", borderRadius: 10, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none" }}
                        placeholder="Tambah keahlian lain..."
                        maxLength={40}
                        value={customSkill[cat.id] ?? ""}
                        onChange={(e) => setCustomSkill(p => ({ ...p, [cat.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addCustomSkill(cat.id)}
                      />
                      <button onClick={() => addCustomSkill(cat.id)} style={{
                        background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10,
                        padding: "8px 12px", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                      }}>+</button>
                    </div>

                    {/* Added custom skills */}
                    {Array.from(skills[cat.id] ?? []).filter(s => !(SKILLS_BY_CAT[cat.id] ?? []).includes(s)).map(s => (
                      <div key={s} style={{ display: "inline-flex", alignItems: "center", gap: 4, margin: "4px 4px 0 0" }}>
                        <span className="tag-active tag" style={{ background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" }}>{s}</span>
                        <button onClick={() => toggleSkill(cat.id, s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--danger)", fontFamily: "inherit" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, marginBottom: 4, padding: 12, background: "var(--primary-50)", borderRadius: 12, display: "flex", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <p style={{ fontSize: 12, color: "var(--primary-700)", flex: 1 }}>
            Tarif & keahlian bisa diubah kapan saja di <strong>Profil → Pengaturan layanan</strong>.
          </p>
        </div>
      </div>

      <div style={{ padding: "14px 20px 32px" }}>
        <button className="btn-primary" onClick={handleNext}>Lanjut</button>
      </div>
    </div>
  );
}

export default function LayananPage() {
  return <Suspense><LayananForm /></Suspense>;
}
