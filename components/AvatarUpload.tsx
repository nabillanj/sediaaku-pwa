"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePhotoUrl } from "@/lib/actions/profile";

type Props = {
  name: string;
  initialPhotoUrl?: string;
  size?: number;
};

export function AvatarUpload({ name, initialPhotoUrl, size = 80 }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "sediaaku/avatar");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotoUrl(data.url);
      await updatePhotoUrl(data.url);
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} />
      <div
        style={{ position: "relative", cursor: "pointer" }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {/* Foto / inisial */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
            {initials}
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        )}

        {/* Tombol kamera (selalu ukuran tetap) */}
        {!uploading && (
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 26, height: 26, borderRadius: 999,
            background: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)", pointerEvents: "none",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
        {uploading ? "Mengupload..." : "Ubah foto profil"}
      </div>
    </div>
  );
}
