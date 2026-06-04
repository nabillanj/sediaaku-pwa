import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getAddress } from "@/lib/actions/addresses";
import AddressForm from "../../new/AddressForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditAddressPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { id } = await params;
  const addr = await getAddress(id);
  if (!addr) notFound();

  return (
    <AddressForm
      addressId={id}
      initialData={{
        label: addr.label,
        address: addr.address,
        kabupaten: addr.kabupaten,
        latitude: addr.latitude,
        longitude: addr.longitude,
        streetName: addr.street_name,
        isDefault: addr.is_default,
      }}
    />
  );
}
