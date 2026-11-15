import type { Metadata } from "next";
import InfoPage from "@/components/store/infoPage";
import { formatPrice } from "@/lib/format";
import { en } from "@/lib/messages";
import { getZoneFee } from "@/lib/shipping";

const t = en.pages.delivery;

export const metadata: Metadata = {
  title: `${t.title} | ${en.shopName}`,
  description: t.metaDescription,
};

export default function DeliveryRulesPage() {
  const inside = formatPrice(getZoneFee("dhaka"));
  const outside = formatPrice(getZoneFee("outside"));

  return (
    <InfoPage
      title={t.title}
      intro={t.intro}
      sections={t.sections(inside, outside)}
    />
  );
}