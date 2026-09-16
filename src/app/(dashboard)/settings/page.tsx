import type { Metadata } from "next";
import { requireBusiness } from "@/lib/permissions";
import { BusinessSettingsForm } from "./business-settings-form";

export const metadata: Metadata = { title: "Business settings" };

export default async function BusinessSettingsPage() {
  const { business, role } = await requireBusiness();

  return (
    <BusinessSettingsForm
      readOnly={role === "staff"}
      initial={{
        name: business.name,
        description: business.description ?? "",
        logo: business.logo ?? "",
        phone: business.phone ?? "",
        whatsapp: business.whatsapp ?? "",
        email: business.email ?? "",
        address: business.address ?? "",
        city: business.city ?? "",
        district: business.district ?? "",
        deliveryFee: String(business.deliveryFee ?? 0),
        freeDeliveryOver: String(business.freeDeliveryOver ?? 0),
        facebook: business.social?.facebook ?? "",
        instagram: business.social?.instagram ?? "",
        tiktok: business.social?.tiktok ?? "",
        youtube: business.social?.youtube ?? "",
      }}
    />
  );
}
