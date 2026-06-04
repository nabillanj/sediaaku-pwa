"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getUserChatList, getMitraChatList, getOrCreateSupportConversation, getOrCreateMitraSupportConversation } from "@/lib/actions/chat";
import type { ConversationItem } from "@/lib/actions/chat";

interface Props {
  initialConversations: ConversationItem[];
  currentUid: string;
  role: "user" | "partner";
}

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}j`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function ConvItem({
  conv,
  currentUid,
  role,
  onClick,
}: {
  conv: ConversationItem;
  currentUid: string;
  role: "user" | "partner";
  onClick: () => void;
}) {
  const isSupport = conv.partner_uid === null || conv.partner_uid === "sediaaku-support";
  const displayName = isSupport ? "Tim Sediaaku" : (role === "user" ? conv.partner_name : conv.user_name) ?? "—";
  const isOnline = isSupport ? true : conv.partner_is_online;

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        width: "100%", padding: "14px 20px",
        background: "var(--surface)",
        border: "none", borderBottom: "1px solid var(--border-soft)",
        cursor: "pointer", textAlign: "left",
      }}
    >
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {isSupport ? (
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "#e8f5f3",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <img
              src="/logo.png"
              alt="Tim Sediaaku"
              style={{ width: 36, height: 36, objectFit: "contain" }}
            />
          </div>
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--primary-100)",
            color: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700,
          }}>
            {initials(displayName)}
          </div>
        )}
        {isSupport ? (
          <span style={{
            position: "absolute", bottom: 0, right: 0,
            width: 18, height: 18, borderRadius: "50%",
            background: "var(--primary)", border: "2px solid var(--surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        ) : isOnline ? (
          <span style={{
            position: "absolute", bottom: 2, right: 2,
            width: 10, height: 10, borderRadius: "50%",
            background: "#22c55e", border: "2px solid var(--surface)",
          }} />
        ) : null}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>
            {displayName}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>
            {timeAgo(conv.last_message_at)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 13, color: "var(--text-2)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: conv.unread_count > 0 ? "80%" : "100%",
          }}>
            {conv.last_message ?? "Mulai percakapan"}
          </span>
          {conv.unread_count > 0 && (
            <span style={{
              minWidth: 20, height: 20, borderRadius: 10,
              background: "var(--primary)", color: "#fff",
              fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 6px", flexShrink: 0,
            }}>
              {conv.unread_count > 99 ? "99+" : conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ChatListClient({ initialConversations, currentUid, role }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Poll for updates every 5s
  useEffect(() => {
    const fn = role === "user" ? getUserChatList : getMitraChatList;
    const interval = setInterval(() => {
      startTransition(async () => {
        const fresh = await fn(currentUid);
        setConversations(fresh);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUid, role]);

  function handleConvClick(conv: ConversationItem) {
    const base = role === "user" ? "/chat" : "/mitra/chat";
    router.push(`${base}/${conv.id}`);
  }

  async function handleSupportClick() {
    if (role === "partner") {
      const id = await getOrCreateMitraSupportConversation(currentUid);
      router.push(`/mitra/chat/${id}`);
    } else {
      const id = await getOrCreateSupportConversation(currentUid);
      router.push(`/chat/${id}`);
    }
  }

  const hasSupport = conversations.some((c) =>
    role === "user" ? c.partner_uid === null : c.partner_uid === "sediaaku-support"
  );

  return (
    <div>
      {/* Tim Sediaaku entry (user dan mitra) */}
      {!hasSupport && (
        <button
          onClick={handleSupportClick}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", padding: "14px 20px",
            background: "var(--surface)",
            border: "none", borderBottom: "1px solid var(--border-soft)",
            cursor: "pointer", textAlign: "left",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#e8f5f3",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <img
                src="/logo.png"
                alt="Tim Sediaaku"
                style={{ width: 36, height: 36, objectFit: "contain" }}
              />
            </div>
            <span style={{
              position: "absolute", bottom: 0, right: 0,
              width: 18, height: 18, borderRadius: "50%",
              background: "var(--primary)", border: "2px solid var(--surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>Tim Sediaaku</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Butuh bantuan? Chat kami</div>
          </div>
        </button>
      )}

      {conversations.map((conv) => (
        <ConvItem
          key={conv.id}
          conv={conv}
          currentUid={currentUid}
          role={role}
          onClick={() => handleConvClick(conv)}
        />
      ))}

      {conversations.length === 0 && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>
            Chat dengan {role === "user" ? "mitra" : "pengguna"} akan muncul setelah pesanan dikonfirmasi
          </div>
        </div>
      )}
    </div>
  );
}
