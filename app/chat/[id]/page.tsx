import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getConversation, getMessages, getRelatedOrder } from "@/lib/actions/chat";
import ChatDetailClient from "./ChatDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/");

  const [conv, messages] = await Promise.all([
    getConversation(id),
    getMessages(id, session.uid),
  ]);

  if (!conv) notFound();

  // Auth check: user must be participant
  if (session.role === "user" && conv.user_uid !== session.uid) redirect("/chat");
  if (session.role === "partner" && conv.partner_uid !== session.uid) redirect("/mitra/chat");

  const relatedOrder = conv.partner_uid
    ? await getRelatedOrder(conv.user_uid, conv.partner_uid)
    : null;

  const backHref = session.role === "partner" ? "/mitra/chat" : "/chat";

  const isSupport = conv.partner_uid === null;
  const displayName = isSupport
    ? "Tim Sediaaku"
    : session.role === "user"
    ? conv.partner_name
    : conv.user_name;
  const isOnline = isSupport ? true : conv.partner_is_online;

  return (
    <ChatDetailClient
      conversationId={id}
      initialMessages={messages}
      currentUid={session.uid}
      currentRole={session.role}
      displayName={displayName ?? "—"}
      isOnline={isOnline}
      isSupport={isSupport}
      relatedOrder={relatedOrder}
      backHref={backHref}
    />
  );
}
