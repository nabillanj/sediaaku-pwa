"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { createPartner } from "@/lib/actions/partner";
import { ImageUploadButton } from "@/components/ImageUploadButton";

type DocState = "empty" | "done" | "opt";
type DocUrls = { ktp: string; selfie: string; domisili: string };

function UploadCard({
  title, desc, state, icon, folder, onUploaded,
}: {
  title: string;
  desc: string;
  state: DocState;
  icon: React.ReactNode;
  folder: string;
  onUploaded: (url: string) => void;
}) {
  const isOpt = state === "opt";
  const isDone = state === "done";
  return (
    <div style={{
      marginBottom: 10, padding: 14, borderRadius: 14,
      background: isDone ? "var(--primary-50)" : isOpt ? "var(--surface)" : "var(--surface-2)",
      border: `1.5px ${state === "empty" ? "dashed" : "solid"} ${isDone ? "var(--primary)" : "var(--border)"}`,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: isDone ? "var(--primary)" : "var(--text-3)",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{title}</div>
          {isOpt && <span className="tag" style={{ fontSize: 9, padding: "1px 6px" }}>Opsional</span>}
        </div>
        <div style={{ fontSize: 12, color: isDone ? "var(--primary)" : "var(--text-2)", marginTop: 2 }}>
          {isDone ? "✓ Foto terupload" : desc}
        </div>
      </div>
      {isDone ? (
        <div style={{ width: 26, height: 26, borderRadius: 999, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
      ) : (
        <ImageUploadButton
          folder={folder}
          onUploaded={onUploaded}
          label={isOpt ? "Unggah" : "Ambil"}
          style={{
            background: isOpt ? "var(--surface-2)" : "var(--primary)",
            color: isOpt ? "var(--text-1)" : "#fff",
            border: "none", borderRadius: 10, padding: "8px 14px",
            fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", flexShrink: 0,
          }}
        />
      )}
    </div>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
      {[1, 2, 3].map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 999,
            background: "var(--primary)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700,
          }}>
            {s < current
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              : s}
          </div>
          {i < 2 && <div style={{ width: 60, height: 2, background: "var(--primary)", borderRadius: 1 }} />}
        </div>
      ))}
    </div>
  );
}

const ID_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2" />
    <path d="M14 9h4M14 12h4M14 15h2" />
  </svg>
);
const CAMERA_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

function DokumenForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [ktp, setKtp] = useState<DocState>("empty");
  const [selfie, setSelfie] = useState<DocState>("empty");
  const [domisili, setDomisili] = useState<DocState>("opt");
  const [urls, setUrls] = useState<DocUrls>({ ktp: "", selfie: "", domisili: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function handleUploaded(key: keyof DocUrls, url: string) {
    setUrls(prev => ({ ...prev, [key]: url }));
    if (key === "ktp") { setKtp("done"); setErrors(p => ({ ...p, ktp: "" })); }
    if (key === "selfie") { setSelfie("done"); setErrors(p => ({ ...p, selfie: "" })); }
    if (key === "domisili") setDomisili("done");
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    if (ktp !== "done") errs.ktp = "Foto KTP wajib diupload";
    if (selfie !== "done") errs.selfie = "Selfie dengan KTP wajib diupload";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const services = JSON.parse(params.get("services") ?? "[]");

    const res = await createPartner({
      phone: params.get("phone") ?? "",
      name: params.get("name") ?? "",
      city: params.get("city") ?? "",
      domicileDetail: params.get("domicileDetail") ?? undefined,
      gender: params.get("gender") ?? "Perempuan",
      birthDate: params.get("birthDate") ?? "",
      bio: params.get("bio") ?? undefined,
      serviceRadiusKm: Number(params.get("serviceRadiusKm") ?? "10"),
      ktpUrl: urls.ktp,
      selfieUrl: urls.selfie,
      domisiliDocUrl: domisili === "done" ? urls.domisili : undefined,
      services,
    });

    setLoading(false);
    if (!res.ok) { setErrors({ general: res.error ?? "Terjadi kesalahan" }); return; }
    router.push("/mitra/daftar/pending");
  }

  return (
    <div className="pwa-shell">
      <AppBar title="Daftar Teman Sedia" />
      <div style={{ flex: 1, padding: "0 20px", overflow: "auto" }}>
        <StepDots current={3} />
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
          Langkah 3 dari 3 · Wajib
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "var(--text-1)" }}>Verifikasi identitas</h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 18 }}>
          Upload KTP & selfie untuk keamanan & kepercayaan pengguna.
        </p>

        {errors.general && (
          <div style={{ marginBottom: 12, padding: 12, background: "var(--danger-bg)", borderRadius: 12, fontSize: 13, color: "var(--danger)" }}>
            ⚠ {errors.general}
          </div>
        )}

        <UploadCard
          title="Foto KTP *"
          desc="Pastikan terbaca jelas & semua data terlihat"
          state={ktp}
          icon={ID_ICON}
          folder="sediaaku/ktp"
          onUploaded={(url) => handleUploaded("ktp", url)}
        />
        {errors.ktp && <div className="input-error" style={{ marginBottom: 8 }}>⚠ {errors.ktp}</div>}

        <UploadCard
          title="Selfie dengan KTP *"
          desc="Wajah dan KTP harus terlihat dalam satu foto"
          state={selfie}
          icon={CAMERA_ICON}
          folder="sediaaku/selfie"
          onUploaded={(url) => handleUploaded("selfie", url)}
        />
        {errors.selfie && <div className="input-error" style={{ marginBottom: 8 }}>⚠ {errors.selfie}</div>}

        <UploadCard
          title="Surat keterangan domisili"
          desc="Opsional · meningkatkan kepercayaan pengguna"
          state={domisili}
          icon={ID_ICON}
          folder="sediaaku/domisili"
          onUploaded={(url) => handleUploaded("domisili", url)}
        />

        <div style={{ marginTop: 4, padding: 14, background: "var(--warn-bg)", borderRadius: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--warn)", marginBottom: 2 }}>Direview 1×24 jam</div>
            <div style={{ fontSize: 12, color: "var(--warn)", lineHeight: 1.5 }}>
              Dokumen kamu akan diverifikasi tim Sediaaku. Kamu belum bisa terima job sampai disetujui.
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 20px 32px" }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Mengirim..." : "Kirim untuk verifikasi"}
        </button>
      </div>
    </div>
  );
}

export default function DokumenPage() {
  return <Suspense><DokumenForm /></Suspense>;
}
