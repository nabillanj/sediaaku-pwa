import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getOrCreateSupportConversation } from "@/lib/actions/chat";
import Link from "next/link";
import HelpAccordion from "./HelpAccordion";

const FAQ = [
  {
    category: "Pemesanan",
    emoji: "📋",
    items: [
      {
        q: "Bagaimana cara memesan Teman Sedia?",
        a: "Pilih kategori layanan di beranda, pilih Teman Sedia yang sesuai, lalu klik 'Pesan Sekarang'. Isi detail jadwal, alamat, dan catatan jika ada.",
      },
      {
        q: "Berapa lama minimum pemesanan?",
        a: "Minimum pemesanan tergantung kebijakan masing-masing Teman Sedia, umumnya 2 jam. Kamu bisa cek di halaman profil mereka.",
      },
      {
        q: "Bisakah saya membatalkan pesanan?",
        a: "Ya, pesanan bisa dibatalkan sebelum Teman Sedia berangkat. Setelah mereka dalam perjalanan, pembatalan mungkin dikenakan biaya.",
      },
    ],
  },
  {
    category: "Pembayaran",
    emoji: "💳",
    items: [
      {
        q: "Metode pembayaran apa yang tersedia?",
        a: "Saat ini Sediaaku menerima transfer bank dan dompet digital (GoPay, OVO, Dana). Pembayaran dilakukan setelah pesanan dikonfirmasi.",
      },
      {
        q: "Kapan saya harus membayar?",
        a: "Pembayaran dilakukan setelah pesanan dibuat dan sebelum Teman Sedia berangkat ke lokasi kamu.",
      },
      {
        q: "Bagaimana cara menggunakan voucher diskon?",
        a: "Masukkan kode voucher di halaman pembayaran saat checkout. Diskon akan otomatis terpotong dari total tagihan.",
      },
    ],
  },
  {
    category: "Teman Sedia",
    emoji: "🤝",
    items: [
      {
        q: "Apakah Teman Sedia sudah terverifikasi?",
        a: "Ya, semua Teman Sedia yang aktif sudah melalui proses verifikasi identitas (KTP + foto selfie) dan seleksi oleh tim Sediaaku.",
      },
      {
        q: "Bagaimana jika saya tidak puas dengan layanan?",
        a: "Kamu bisa memberi ulasan atau melaporkan masalah melalui halaman detail pesanan. Tim kami akan menindaklanjuti dalam 1×24 jam.",
      },
    ],
  },
  {
    category: "Akun",
    emoji: "👤",
    items: [
      {
        q: "Bagaimana cara mengubah data profil saya?",
        a: "Masuk ke tab Profil, lalu ketuk 'Edit profil'. Kamu bisa mengubah nama, kota, dan email. Nomor HP tidak dapat diubah.",
      },
      {
        q: "Bagaimana cara mendaftar sebagai Teman Sedia?",
        a: "Di halaman login, pilih 'Saya Teman Sedia' dan ikuti langkah pendaftaran. Kamu perlu mengupload KTP dan foto selfie untuk verifikasi.",
      },
    ],
  },
];

async function openLiveChat(uid: string) {
  "use server";
  const id = await getOrCreateSupportConversation(uid);
  redirect(`/chat/${id}`);
}

export default async function HelpPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <div style={{
          background: "var(--grad-hero)", padding: "52px 22px 28px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.13), transparent 60%)",
            top: -60, right: -60, pointerEvents: "none",
          }} />
          <Link href={session.role === "partner" ? "/mitra/profil" : "/profile"} style={{ textDecoration: "none", display: "inline-flex", marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </div>
          </Link>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Pusat Bantuan</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Ada yang bisa kami bantu?</div>
        </div>

        {/* Quick contact */}
        <div style={{ padding: "16px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Live Chat */}
          <form action={openLiveChat.bind(null, session.uid)}>
            <button type="submit" style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
              <div className="card" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: "var(--primary-50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 4v-4H6a2 2 0 01-2-2V6z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Live Chat</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>Respon &lt; 5 menit</div>
                </div>
              </div>
            </button>
          </form>

          {/* Telepon */}
          <Link href="tel:+6289887483830" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: "var(--primary-50)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h3l2 5-3 1c1 2.5 3 4.5 5.5 5.5l1-3 5 2v3a2 2 0 01-2 2A14 14 0 013 6a2 2 0 012-2z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Telepon</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>08:00–22:00 WIB</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Report issue */}
        <div style={{ padding: "12px 16px 0" }}>
          <Link href="/help/report" style={{ textDecoration: "none" }}>
            <div className="card" style={{
              padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
              background: "var(--danger-bg)", border: "none", cursor: "pointer",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: "rgba(184,81,72,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.3 3.3L2 20h20L13.7 3.3a2 2 0 00-3.4 0z"/><path d="M12 9v4"/><circle cx="12" cy="17" r=".5" fill="currentColor"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)" }}>Laporkan masalah</div>
                <div style={{ fontSize: 12, color: "var(--danger)", opacity: 0.75, marginTop: 1 }}>Ada kendala dengan pesananmu?</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </Link>
        </div>

        {/* FAQ */}
        <div style={{ padding: "20px 16px 32px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 14 }}>Pertanyaan Umum</div>
          <HelpAccordion faq={FAQ} />
        </div>
      </div>
    </div>
  );
}
