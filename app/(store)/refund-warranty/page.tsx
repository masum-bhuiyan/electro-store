import type { Metadata } from "next";
import InfoPage from "@/components/store/infoPage";
import { en } from "@/lib/messages";

const t = en.pages.refund;

export const metadata: Metadata = {
  title: `${t.title} | ${en.shopName}`,
  description: t.metaDescription,
};

export default function RefundWarrantyPage() {
  return <InfoPage title={t.title} intro={t.intro} sections={t.sections} />;
}