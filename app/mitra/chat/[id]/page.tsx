import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getConversation, getMessages, getRelatedOrder } from "@/lib/actions/chat";
import ChatDetailClient from "@/app/chat/[id]/ChatDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MitraChatDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "partner") redirect("/chat");

  const [conv, messages] = await Promise.all([
    getConversation(id),
    getMessages(id, session.uid),
  ]);

  if (!conv) notFound();

  const isSupportConv = conv.partner_uid === "sediaaku-support";

  // Support conv: user_uid stores mitra uid; regular conv: partner_uid = mitra uid
  if (isSupportConv) {
    if (conv.user_uid !== session.uid) redirect("/mitra/chat");
  } else {
    if (conv.partner_uid !== session.uid) redirect("/mitra/chat");
  }

  const relatedOrder = isSupportConv
    ? null
    : await getRelatedOrder(conv.user_uid, conv.partner_uid!);

  const displayName = isSupportConv ? "Tim Sediaaku" : (conv.user_name ?? "—");

  return (
    <ChatDetailClient
      conversationId={id}
      initialMessages={messages}
      currentUid={session.uid}
      currentRole="partner"
      displayName={displayName}
      isOnline={isSupportConv ? true : false}
      isSupport={isSupportConv}
      relatedOrder={relatedOrder}
      backHref="/mitra/chat"
    />
  );
}
