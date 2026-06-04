import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import AddressForm from "./AddressForm";

export default async function NewAddressPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  return <AddressForm />;
}
