import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getMitraChatList } from "@/lib/actions/chat";
import Link from "next/link";
import ChatListClient from "@/app/chat/ChatListClient";

export default async function MitraChatPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "partner") redirect("/chat");

  const conversations = await getMitraChatList(session.uid);

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
        {/* Header */}
        <div style={{
          padding: "14px 22px 14px", flexShrink: 0,
          position: "sticky", top: 0, zIndex: 10, background: "var(--bg)",
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)" }}>Chat</div>
        </div>

        <ChatListClient
          initialConversations={conversations}
          currentUid={session.uid}
          role="partner"
        />
      </div>

      {/* Tab bar */}
      <nav className="tabbar">
        {[
          { href: "/mitra/home", label: "Job", active: false, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg> },
          { href: "/mitra/jadwal", label: "Jadwal", active: false, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
          { href: "/mitra/chat", label: "Chat", active: true, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
          { href: "/mitra/profil", label: "Profil", active: false, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
        ].map((t) => (
          <Link key={t.label} href={t.href}
            className={`tabbar-item${t.active ? " active" : ""}`}
            style={{ textDecoration: "none", color: t.active ? "var(--primary)" : "var(--text-3)" }}>
            {t.icon}
            <span className="tabbar-label">{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
