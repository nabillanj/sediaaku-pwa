import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getFullUserProfile, updateUserProfile, updatePartnerProfile } from "@/lib/actions/profile";
import Link from "next/link";
import { BANDUNG_AREAS } from "@/lib/constants/areas";
import { AvatarUpload } from "@/components/AvatarUpload";

export default async function EditProfilePage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const profile = await getFullUserProfile();
  if (!profile) redirect("/auth");

  const isPartner = profile.role === "partner";

  async function handleSubmit(formData: FormData) {
    "use server";
    if (isPartner) {
      const result = await updatePartnerProfile({
        name: formData.get("name") as string,
        city: formData.get("city") as string,
        domicileDetail: formData.get("domicileDetail") as string,
        bio: formData.get("bio") as string,
      });
      if (result.ok) redirect("/profile");
    } else {
      const result = await updateUserProfile({
        name: formData.get("name") as string,
        city: formData.get("city") as string,
        email: formData.get("email") as string,
      });
      if (result.ok) redirect("/profile");
    }
  }

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* AppBar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", flexShrink: 0 }}>
          <Link href="/profile" style={{ textDecoration: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: "var(--surface-2)",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
          </Link>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Edit Profil</div>
        </div>

        {/* Avatar section */}
        <div style={{ padding: "8px 22px 24px" }}>
          <AvatarUpload name={profile.name} initialPhotoUrl={profile.photo_url ?? ""} size={80} />
        </div>

        {/* Form */}
        <form action={handleSubmit} style={{ padding: "0 22px 32px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Nama */}
          <div>
            <div className="input-label">Nama lengkap</div>
            <input
              name="name"
              className="input-field"
              defaultValue={profile.name}
              placeholder="Nama lengkap"
              required
            />
          </div>

          {/* Nomor HP — readonly */}
          <div>
            <div className="input-label">Nomor HP</div>
            <input
              className="input-field"
              value={profile.phone}
              readOnly
              style={{ background: "var(--surface-2)", color: "var(--text-3)", cursor: "not-allowed" }}
            />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Nomor HP tidak dapat diubah</div>
          </div>

          {/* Kota */}
          <div>
            <div className="input-label">Kota / Kabupaten</div>
            <select
              name="city"
              className="input-field"
              defaultValue={profile.city}
              required
              style={{ appearance: "none", cursor: "pointer" }}
            >
              <option value="">Pilih kota / kabupaten...</option>
              {BANDUNG_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
              Saat ini Sediaaku tersedia di area Bandung Raya
            </div>
          </div>

          {isPartner ? (
            <>
              {/* Kelurahan/Kecamatan */}
              <div>
                <div className="input-label">Kelurahan / Kecamatan</div>
                <input
                  name="domicileDetail"
                  className="input-field"
                  defaultValue={profile.domicile_detail ?? ""}
                  placeholder="Contoh: Menteng, Jakarta Pusat"
                />
              </div>

              {/* Bio */}
              <div>
                <div className="input-label">Bio</div>
                <textarea
                  name="bio"
                  className="input-field"
                  defaultValue={profile.bio ?? ""}
                  placeholder="Ceritakan sedikit tentang dirimu..."
                  rows={4}
                  style={{ resize: "none", lineHeight: 1.6 }}
                />
              </div>

              {/* Info: gender & tanggal lahir readonly */}
              <div style={{
                background: "var(--info-bg)", borderRadius: 12, padding: "12px 14px",
                fontSize: 12, color: "var(--info)", lineHeight: 1.5,
              }}>
                Jenis kelamin dan tanggal lahir tidak dapat diubah sendiri. Hubungi admin jika ada kesalahan data.
              </div>
            </>
          ) : (
            /* Email — user only */
            <div>
              <div className="input-label">Email <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(opsional)</span></div>
              <input
                name="email"
                type="email"
                className="input-field"
                defaultValue={profile.email ?? ""}
                placeholder="email@contoh.com"
              />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
            Simpan perubahan
          </button>
        </form>
      </div>
    </div>
  );
}
