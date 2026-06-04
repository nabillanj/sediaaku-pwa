import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import BookingBayarClient from "./BookingBayarClient";

async function getWalletBalance(uid: string): Promise<number> {
  try {
    const { rows } = await pool.query(
      `SELECT wallet_balance FROM users WHERE uid = $1`,
      [uid]
    );
    return Number(rows[0]?.wallet_balance ?? 0);
  } catch {
    return 0;
  }
}

export default async function BookingBayarPage({
  params,
}: {
  params: Promise<{ partnerUid: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { partnerUid } = await params;
  const walletBalance = await getWalletBalance(session.uid);

  return <BookingBayarClient partnerUid={partnerUid} walletBalance={walletBalance} />;
}
