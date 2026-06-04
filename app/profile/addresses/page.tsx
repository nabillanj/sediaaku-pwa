import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { listAddresses, deleteAddress, setDefaultAddress } from "@/lib/actions/addresses";
import Link from "next/link";

export const dynamic = "force-dynamic";

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PinIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      {!filled && <circle cx="12" cy="9" r="2.5" />}
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

export default async function AddressesPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const addresses = await listAddresses();

  return (
    <div className="pwa-shell">
      {/* AppBar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px", flexShrink: 0,
        borderBottom: "1px solid var(--border-soft)",
        background: "var(--surface)",
      }}>
        <Link href="/profile" style={{ textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, background: "var(--surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
        </Link>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", flex: 1 }}>
          Alamat tersimpan
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 32px" }}>
        {addresses.length === 0 ? (
          /* Empty state */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 12, paddingTop: 80, textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 999,
              background: "var(--primary-50)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--primary)",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
                Belum ada alamat tersimpan
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                Tambahkan alamat untuk mempercepat proses booking
              </div>
            </div>
            <Link href="/profile/addresses/new" style={{ textDecoration: "none", marginTop: 8 }}>
              <div style={{
                padding: "12px 24px", borderRadius: 14,
                background: "var(--primary)", color: "#fff",
                fontSize: 14, fontWeight: 700,
              }}>
                Tambah alamat
              </div>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {addresses.map((addr) => (
              <div key={addr.id} className="card" style={{ padding: "14px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {/* Pin icon */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: addr.is_default ? "var(--primary)" : "var(--primary-50)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: addr.is_default ? "#fff" : "var(--primary)",
                    marginTop: 1,
                  }}>
                    <PinIcon filled={addr.is_default} />
                  </div>

                  {/* Text content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                        {addr.label}
                      </span>
                      {addr.is_default && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "var(--primary)",
                          background: "var(--primary-50)", borderRadius: 999,
                          padding: "2px 8px",
                        }}>
                          Utama
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.45, marginBottom: 2 }}>
                      {addr.address}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>{addr.kabupaten}</div>
                    {addr.street_name && (
                      <div style={{
                        fontSize: 11, color: "var(--primary)", marginTop: 4,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                          <circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none"/>
                        </svg>
                        {addr.street_name}
                      </div>
                    )}

                    {/* Jadikan utama — hanya kalau bukan default */}
                    {!addr.is_default && (
                      <form action={async () => {
                        "use server";
                        await setDefaultAddress(addr.id);
                      }} style={{ marginTop: 10 }}>
                        <button type="submit" style={{
                          background: "none", border: "1px solid var(--primary)",
                          borderRadius: 8, padding: "5px 12px",
                          fontSize: 11, fontWeight: 600, color: "var(--primary)",
                          fontFamily: "inherit", cursor: "pointer",
                        }}>
                          Jadikan utama
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Edit + Trash icons — top right */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <Link href={`/profile/addresses/${addr.id}/edit`} style={{ textDecoration: "none" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: "var(--surface-2)", border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--text-2)", cursor: "pointer",
                      }}>
                        <EditIcon />
                      </div>
                    </Link>
                    <form action={async () => {
                      "use server";
                      await deleteAddress(addr.id);
                    }}>
                      <button type="submit" style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: "var(--danger-bg)", border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--danger)", cursor: "pointer",
                      }}>
                        <TrashIcon />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}

            {/* Tambah alamat baru */}
            <Link href="/profile/addresses/new" style={{ textDecoration: "none" }}>
              <div style={{
                padding: "14px", borderRadius: 18,
                border: "1.5px dashed var(--primary-200)",
                background: "var(--primary-50)",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, color: "var(--primary)", fontWeight: 600, fontSize: 14,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Tambah alamat baru
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
