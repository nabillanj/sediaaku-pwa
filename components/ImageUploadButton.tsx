"use client";

import { useRef, useState } from "react";

type Props = {
  folder: string;
  onUploaded: (url: string) => void;
  label?: React.ReactNode;
  accept?: string;
  style?: React.CSSProperties;
};

export function ImageUploadButton({ folder, onUploaded, label = "Upload", accept = "image/*", style }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload gagal");
      onUploaded(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={handleChange} />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        style={style}
      >
        {uploading ? "Mengupload..." : label}
      </button>
      {error && <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 2 }}>{error}</div>}
    </>
  );
}
