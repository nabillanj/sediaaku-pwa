import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUserChatList } from "@/lib/actions/chat";
import { TabBar } from "@/components/TabBar";
import ChatListClient from "./ChatListClient";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "user") redirect("/mitra/chat");

  let conversations;
  try {
    conversations = await getUserChatList(session.uid);
  } catch {
    conversations = [];
  }

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
          role="user"
        />
      </div>
      <TabBar active="chat" />
    </div>
  );
}
