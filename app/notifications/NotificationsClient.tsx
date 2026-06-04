"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllAsRead } from "@/lib/actions/announcements";
import type { AnnouncementItem } from "@/lib/actions/announcements";

type NotifItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  order_id: string | null;
  url: string | null;
  is_read: boolean;
  created_at: string;
  source: "announcement" | "notification";
  target_type?: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const wib = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${wib.getDate()} ${MONTHS[wib.getMonth()]} ${wib.getFullYear()}, ${pad(wib.getHours())}.${pad(wib.getMinutes())}`;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  order: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  chat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  payment: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  reminder: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  announcement: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  general: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
};

export default function NotificationsClient({
  announcements,
  notifications,
  uid,
}: {
  announcements: AnnouncementItem[];
  notifications: Omit<NotifItem, "source" | "target_type">[];
  uid: string;
}) {
  const router = useRouter();

  const allItems: NotifItem[] = [
    ...notifications.map((n) => ({ ...n, source: "notification" as const })),
    ...announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      type: "announcement",
      order_id: null,
      url: null,
      is_read: a.is_read,
      created_at: a.created_at,
      source: "announcement" as const,
      target_type: a.target_type,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const [reads, setReads] = useState<Set<string>>(
    new Set(allItems.filter((i) => i.is_read).map((i) => i.id))
  );
  const [pending, startTransition] = useTransition();

  const unreadIds = allItems.filter((i) => !reads.has(i.id));
  const annUnreadIds = unreadIds.filter((i) => i.source === "announcement").map((i) => i.id);
  const notifUnreadIds = unreadIds.filter((i) => i.source === "notification").map((i) => i.id);
  const hasUnread = unreadIds.length > 0;

  function handleMarkAll() {
    setReads(new Set(allItems.map((i) => i.id)));
    startTransition(async () => {
      await Promise.all([
        annUnreadIds.length > 0 ? markAllAsRead(uid, annUnreadIds) : Promise.resolve(),
        notifUnreadIds.length > 0
          ? fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
          : Promise.resolve(),
      ]);
    });
  }

  async function handleClick(item: NotifItem) {
    if (!reads.has(item.id)) {
      setReads((prev) => new Set([...prev, item.id]));
      if (item.source === "notification") {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
      }
    }
    if (item.url) router.push(item.url);
  }

  if (allItems.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 24px", color: "var(--text-3)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--primary-50)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", marginBottom: 16 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>Belum ada notifikasi</div>
        <div style={{ fontSize: 13 }}>Update pesanan & pesan dari Sediaaku muncul di sini</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "auto", paddingBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 4px" }}>
        <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>
          {hasUnread ? `${unreadIds.length} belum dibaca` : "Semua sudah dibaca"}
        </span>
        {hasUnread && (
          <button
            onClick={handleMarkAll}
            disabled={pending}
            style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, opacity: pending ? 0.5 : 1 }}
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {allItems.map((item) => {
          const read = reads.has(item.id);
          const isClickable = !!item.url;

          return (
            <div
              key={`${item.source}-${item.id}`}
              onClick={() => handleClick(item)}
              style={{
                background: read ? "var(--surface)" : "var(--primary-50)",
                border: `1px solid ${read ? "var(--border-soft)" : "var(--primary-200)"}`,
                borderRadius: 16, padding: "13px 14px",
                display: "flex", gap: 12, alignItems: "flex-start",
                cursor: isClickable ? "pointer" : "default",
                opacity: read ? 0.7 : 1,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: read ? "var(--surface-2)" : "var(--primary-100)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: read ? "var(--text-3)" : "var(--primary-700)",
              }}>
                {TYPE_ICON[item.type] ?? TYPE_ICON.general}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  {!read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />}
                  <span style={{ fontSize: 14, fontWeight: read ? 500 : 700, color: "var(--text-1)", lineHeight: 1.3 }}>
                    {item.title}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 6 }}>
                  {item.body}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>
                  {formatDate(item.created_at)}
                </div>
              </div>
              {isClickable && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
