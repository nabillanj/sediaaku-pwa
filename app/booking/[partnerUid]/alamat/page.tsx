import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { listAddresses } from "@/lib/actions/addresses";
import BookingAlamatClient from "./BookingAlamatClient";

export default async function BookingAlamatPage({
  params,
}: {
  params: Promise<{ partnerUid: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { partnerUid } = await params;
  const addresses = await listAddresses();

  return <BookingAlamatClient partnerUid={partnerUid} savedAddresses={addresses} />;
}
