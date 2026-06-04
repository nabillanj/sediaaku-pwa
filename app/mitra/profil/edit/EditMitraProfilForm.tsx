"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import {
  updateMitraProfile,
  updateMitraServices,
  updateMitraDokumen,
  type Category,
} from "@/lib/actions/partner";
import { BANDUNG_AREAS } from "@/lib/constants/areas";
import { ImageUploadButton } from "@/components/ImageUploadButton";
import { AvatarUpload } from "@/components/AvatarUpload";

const SKILLS_BY_CAT: Record<string, string[]> = {
  jagain:  ["Anak balita", "Anak SD", "Lansia", "Hewan peliharaan", "Anak berkebutuhan khusus"],
  asuhin:  ["Pendampingan lansia", "Pendampingan anak", "Pertolongan pertama", "Memasak ringan"],
  bantuin: ["Antre", "Beres-beres", "Angkat barang", "Acara kecil"],
  anterin: ["Dokumen", "Belanjaan", "Barang pribadi"],
  temenin: ["Rumah sakit", "Belanja", "Acara", "Aktivitas"],
};

type ServiceData = { categoryId: string; ratePerHour: number; skills: string[] };

type Props = {
  initialData: {
    name: string; city: string; domicileDetail: string;
    gender: string; birthDate: string; bio: string;
    ktpUrl: string; selfieUrl: string; domisiliDocUrl: string;
    verifyStatus: string; photoUrl: string;
  };
  initialServices: ServiceData[];
  categories: Category[];
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{label}</label>
      {hint && <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: -4 }}>{hint}</span>}
      {children}
    </div>
  );
}

function SaveBtn({ pending, label = "Simpan" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "13px", borderRadius: 14, border: "none",
        background: pending ? "var(--primary-200, #a5d6d9)" : "var(--primary)",
        color: "#fff", fontSize: 14, fontWeight: 700,
        fontFamily: "inherit", cursor: pending ? "not-allowed" : "pointer",
        width: "100%",
      }}
    >
      {pending ? "Menyimpan..." : label}
    </button>
  );
}

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 10, fontSize: 13,
      background: type === "ok" ? "var(--success-bg, #d1fae5)" : "var(--danger-bg)",
      color: type === "ok" ? "var(--success, #065f46)" : "var(--danger)",
    }}>
      {type === "ok" ? "✓ " : "⚠ "}{msg}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 12,
  border: "1.5px solid var(--border-soft)", background: "var(--surface)",
  fontSize: 14, color: "var(--text-1)", fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
};

// ── Section 1: Data diri ─────────────────────────────────────
function DataDiriSection({ initial }: { initial: Props["initialData"] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const [form, setForm] = useState({
    name: initial.name, city: initial.city,
    domicileDetail: initial.domicileDetail,
    gender: initial.gender, birthDate: initial.birthDate, bio: initial.bio,
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await updateMitraProfile(form);
      if (!res.ok) { setMsg({ text: res.error ?? "Gagal menyimpan", type: "err" }); return; }
      setMsg({ text: "Data diri berhasil disimpan", type: "ok" });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Nama lengkap (sesuai KTP) *">
        <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Nama sesuai KTP" />
      </Field>
      <Field label="Tanggal lahir *">
        <input style={inputStyle} type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} required max={new Date().toISOString().split("T")[0]} />
      </Field>
      <Field label="Jenis kelamin *">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {(["female", "male"] as const).map((g) => (
            <button key={g} type="button" onClick={() => set("gender", g)} style={{
              padding: "11px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
              background: form.gender === g ? "var(--primary-50)" : "var(--surface)",
              border: form.gender === g ? "1.5px solid var(--primary)" : "1.5px solid var(--border-soft)",
              color: form.gender === g ? "var(--primary-700)" : "var(--text-2)",
              fontSize: 13, fontWeight: form.gender === g ? 700 : 500,
            }}>
              {g === "female" ? "Perempuan" : "Laki-laki"}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Kota / Kabupaten *">
        <select
          style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          required
        >
          <option value="">Pilih kota / kabupaten...</option>
          {BANDUNG_AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>Saat ini Sediaaku tersedia di area Bandung Raya</span>
      </Field>
      <Field label="Kecamatan / area rumah" hint="Area tempat tinggalmu (opsional, cth: Antapani, Buahbatu)">
        <input style={inputStyle} value={form.domicileDetail} onChange={(e) => set("domicileDetail", e.target.value)} placeholder="cth: Antapani, Buahbatu..." />
      </Field>
      <Field label="Bio singkat" hint="Cerita singkat tentang pengalaman / keahlianmu (opsional, maks 200 karakter)">
        <textarea
          style={{ ...inputStyle, resize: "none" } as React.CSSProperties}
          value={form.bio} onChange={(e) => set("bio", e.target.value)}
          rows={4} maxLength={200}
          placeholder="cth: Berpengalaman 3 tahun merawat lansia dan anak..."
        />
        <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right", marginTop: -2 }}>{form.bio.length}/200</div>
      </Field>
      {msg && <Toast msg={msg.text} type={msg.type} />}
      <SaveBtn pending={isPending} />
    </form>
  );
}

// ── Section 2: Layanan & keahlian ────────────────────────────
function LayananSection({ initialServices, categories }: { initialServices: ServiceData[]; categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const initSelected = new Set(initialServices.map((s) => s.categoryId));
  const initRates: Record<string, string> = {};
  const initSkills: Record<string, Set<string>> = {};
  for (const s of initialServices) {
    initRates[s.categoryId] = String(s.ratePerHour);
    initSkills[s.categoryId] = new Set(s.skills);
  }

  const [selected, setSelected] = useState<Set<string>>(initSelected);
  const [rates, setRates] = useState<Record<string, string>>(initRates);
  const [skills, setSkills] = useState<Record<string, Set<string>>>(initSkills);
  const [customSkill, setCustomSkill] = useState<Record<string, string>>({});
  const [rateErrors, setRateErrors] = useState<Record<string, string>>({});

  function toggleCategory(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSkill(catId: string, skill: string) {
    setSkills((prev) => {
      const s = new Set(prev[catId] ?? []);
      s.has(skill) ? s.delete(skill) : s.add(skill);
      return { ...prev, [catId]: s };
    });
  }
  function addCustomSkill(catId: string) {
    const s = (customSkill[catId] ?? "").trim();
    if (!s) return;
    setSkills((prev) => { const c = new Set(prev[catId] ?? []); c.add(s); return { ...prev, [catId]: c }; });
    setCustomSkill((p) => ({ ...p, [catId]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const rErrs: Record<string, string> = {};
    for (const id of selected) {
      const v = Number((rates[id] ?? "").replace(/\D/g, ""));
      if (!rates[id] || v < 15000) rErrs[id] = "Tarif minimal Rp 15.000/jam";
      if (v > 500000) rErrs[id] = "Tarif maksimal Rp 500.000/jam";
    }
    if (Object.keys(rErrs).length > 0) { setRateErrors(rErrs); return; }
    setRateErrors({});

    const services = Array.from(selected).map((id) => ({
      categoryId: id,
      ratePerHour: Number((rates[id] ?? "").replace(/\D/g, "")),
      skills: Array.from(skills[id] ?? []),
    }));

    startTransition(async () => {
      const res = await updateMitraServices(services);
      if (!res.ok) { setMsg({ text: res.error ?? "Gagal menyimpan", type: "err" }); return; }
      setMsg({ text: "Layanan berhasil disimpan", type: "ok" });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {selected.size === 0 && (
        <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 4 }}>⚠ Pilih minimal 1 layanan</div>
      )}
      {categories.map((cat) => {
        const isSelected = selected.has(cat.id);
        return (
          <div key={cat.id} className="card" style={{
            padding: 14,
            border: isSelected ? "1.5px solid var(--primary)" : "1px solid var(--border-soft)",
            background: isSelected ? "var(--primary-50)" : "var(--surface)",
          }}>
            <button type="button" onClick={() => toggleCategory(cat.id)} style={{
              width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, fontSize: 20,
                  background: isSelected ? "var(--primary-100)" : "var(--surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{cat.emoji}</div>
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
                  {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </div>
            </button>

            {isSelected && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--primary-200)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-700)", marginBottom: 6 }}>Tarif per jam *</div>
                <div style={{
                  background: "#fff",
                  border: rateErrors[cat.id] ? "1.5px solid var(--danger)" : "1.5px solid var(--primary)",
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
                      setRates((p) => ({ ...p, [cat.id]: val }));
                      setRateErrors((p) => ({ ...p, [cat.id]: "" }));
                    }}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>/ jam</span>
                </div>
                {rateErrors[cat.id] && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>⚠ {rateErrors[cat.id]}</div>}

                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-700)", marginBottom: 6 }}>
                  Keahlian <span style={{ fontWeight: 500, color: "var(--text-3)" }}>(opsional)</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {(SKILLS_BY_CAT[cat.id] ?? []).map((sk) => {
                    const on = skills[cat.id]?.has(sk);
                    return (
                      <button key={sk} type="button" onClick={() => toggleSkill(cat.id, sk)} style={{
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
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    style={{ flex: 1, border: "1.5px solid var(--primary)", borderRadius: 10, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none" }}
                    placeholder="Tambah keahlian lain..."
                    maxLength={40}
                    value={customSkill[cat.id] ?? ""}
                    onChange={(e) => setCustomSkill((p) => ({ ...p, [cat.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill(cat.id))}
                  />
                  <button type="button" onClick={() => addCustomSkill(cat.id)} style={{
                    background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10,
                    padding: "8px 12px", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                  }}>+</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {Array.from(skills[cat.id] ?? []).filter((s) => !(SKILLS_BY_CAT[cat.id] ?? []).includes(s)).map((s) => (
                    <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--primary)", color: "#fff", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 600 }}>
                      {s}
                      <button type="button" onClick={() => toggleSkill(cat.id, s)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", padding: 0, fontFamily: "inherit", fontSize: 12 }}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {msg && <Toast msg={msg.text} type={msg.type} />}
      <SaveBtn pending={isPending} />
    </form>
  );
}

// ── Section 3: Dokumen ───────────────────────────────────────
function DokumenSection({ initial }: { initial: Pick<Props["initialData"], "ktpUrl" | "selfieUrl" | "domisiliDocUrl" | "verifyStatus"> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const isVerified = initial.verifyStatus === "verified" || initial.verifyStatus === "approved";

  type DocState = "existing" | "new" | "empty" | "none";
  const [ktp, setKtp] = useState<DocState>(initial.ktpUrl ? "existing" : "empty");
  const [selfie, setSelfie] = useState<DocState>(initial.selfieUrl ? "existing" : "empty");
  const [domisili, setDomisili] = useState<DocState>(initial.domisiliDocUrl ? "existing" : "none");
  const [newUrls, setNewUrls] = useState({ ktp: "", selfie: "", domisili: "" });

  function handleUploaded(key: "ktp" | "selfie" | "domisili", url: string) {
    setNewUrls(prev => ({ ...prev, [key]: url }));
    if (key === "ktp") setKtp("new");
    if (key === "selfie") setSelfie("new");
    if (key === "domisili") setDomisili("new");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (ktp === "empty") { setMsg({ text: "Foto KTP wajib ada", type: "err" }); return; }
    if (selfie === "empty") { setMsg({ text: "Selfie dengan KTP wajib ada", type: "err" }); return; }

    startTransition(async () => {
      const res = await updateMitraDokumen({
        ktpUrl: ktp === "new" ? newUrls.ktp : undefined,
        selfieUrl: selfie === "new" ? newUrls.selfie : undefined,
        domisiliDocUrl: domisili === "new" ? newUrls.domisili : domisili === "none" ? "" : undefined,
      });
      if (!res.ok) { setMsg({ text: res.error ?? "Gagal menyimpan", type: "err" }); return; }
      if (ktp === "new") setKtp("existing");
      if (selfie === "new") setSelfie("existing");
      if (domisili === "new") setDomisili("existing");
      setMsg({ text: "Dokumen berhasil diperbarui", type: "ok" });
      router.refresh();
    });
  }

  function DocCard({ title, desc, required, docKey, state, locked, onRemove }: {
    title: string; desc: string; required?: boolean;
    docKey: "ktp" | "selfie" | "domisili";
    state: DocState; locked?: boolean; onRemove?: () => void;
  }) {
    const isDone = state === "existing" || state === "new";
    return (
      <div style={{
        padding: 14, borderRadius: 14,
        background: isDone ? "var(--primary-50)" : "var(--surface-2)",
        border: `1.5px ${isDone ? "solid" : "dashed"} ${isDone ? "var(--primary)" : "var(--border)"}`,
        display: "flex", alignItems: "center", gap: 12,
        opacity: locked ? 0.6 : 1,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>
            {title} {required && <span style={{ color: "var(--danger)" }}>*</span>}
            {!required && <span style={{ fontSize: 10, background: "var(--surface-2)", borderRadius: 999, padding: "1px 6px", marginLeft: 4, color: "var(--text-3)", fontWeight: 500 }}>Opsional</span>}
          </div>
          <div style={{ fontSize: 12, color: isDone ? "var(--primary)" : "var(--text-2)" }}>
            {state === "existing" ? "Sudah terupload" : state === "new" ? "Baru diupload ✓" : desc}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {locked ? (
            <div style={{
              background: "var(--surface-2)", color: "var(--text-3)", border: "none",
              borderRadius: 10, padding: "8px 12px", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Terkunci
            </div>
          ) : (
            <>
              <ImageUploadButton
                folder={`sediaaku/${docKey}`}
                onUploaded={(url) => handleUploaded(docKey, url)}
                label={isDone ? "Ganti" : "Upload"}
                style={{
                  background: "var(--primary)", color: "#fff", border: "none",
                  borderRadius: 10, padding: "8px 12px", fontSize: 11, fontWeight: 700,
                  fontFamily: "inherit", cursor: "pointer",
                }}
              />
              {isDone && onRemove && (
                <button type="button" onClick={onRemove} style={{
                  background: "var(--danger-bg)", color: "var(--danger)", border: "none",
                  borderRadius: 10, padding: "8px 10px", fontSize: 11, fontWeight: 700,
                  fontFamily: "inherit", cursor: "pointer",
                }}>✕</button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4, lineHeight: 1.5 }}>
        Dokumen digunakan untuk verifikasi identitas. Pastikan foto jelas dan terbaca.
      </div>
      {isVerified && (
        <div style={{ padding: "10px 14px", background: "var(--success-bg, #d1fae5)", borderRadius: 12, fontSize: 12, color: "var(--success, #065f46)", lineHeight: 1.5 }}>
          ✓ Identitasmu sudah terverifikasi. Foto KTP dan selfie tidak dapat diubah.
        </div>
      )}
      <DocCard title="Foto KTP" desc="Pastikan terbaca jelas & semua data terlihat" required docKey="ktp" state={ktp} locked={isVerified} />
      <DocCard title="Selfie dengan KTP" desc="Wajah dan KTP harus terlihat dalam satu foto" required docKey="selfie" state={selfie} locked={isVerified} />
      <DocCard
        title="Surat keterangan domisili" desc="Meningkatkan kepercayaan pengguna"
        docKey="domisili" state={domisili}
        onRemove={domisili !== "none" ? () => setDomisili("none") : undefined}
      />
      {!isVerified && (
      <div style={{ padding: "12px 14px", background: "var(--warn-bg)", borderRadius: 12, fontSize: 12, color: "var(--warn)", lineHeight: 1.5 }}>
        ⚠ Jika dokumen diperbarui, profil kamu akan direview ulang oleh tim Sediaaku.
      </div>
      )}
      {msg && <Toast msg={msg.text} type={msg.type} />}
      <SaveBtn pending={isPending} label="Simpan dokumen" />
    </form>
  );
}

// ── Main component ───────────────────────────────────────────
type Tab = "data" | "layanan" | "dokumen";

export default function EditMitraProfilForm({ initialData, initialServices, categories }: Props) {
  const [tab, setTab] = useState<Tab>("data");

  const tabs: { id: Tab; label: string }[] = [
    { id: "data", label: "Data diri" },
    { id: "layanan", label: "Layanan" },
    { id: "dokumen", label: "Dokumen" },
  ];

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto" }}>
        <AppBar title="Edit profil" />

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid var(--border-soft)",
          background: "var(--surface)",
          position: "sticky", top: 56, zIndex: 9,
        }}>
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
              background: "none", fontFamily: "inherit",
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? "var(--primary)" : "var(--text-3)",
              borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 16px 8px", display: "flex", justifyContent: "center" }}>
          <AvatarUpload name={initialData.name} initialPhotoUrl={initialData.photoUrl} size={80} />
        </div>

        <div style={{ padding: "8px 16px 40px" }}>
          {tab === "data" && <DataDiriSection initial={initialData} />}
          {tab === "layanan" && <LayananSection initialServices={initialServices} categories={categories} />}
          {tab === "dokumen" && <DokumenSection initial={initialData} />}
        </div>
      </div>
    </div>
  );
}
