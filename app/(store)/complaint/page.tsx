import type { Metadata } from "next";
import ContactCards from "@/components/store/contactCards";
import InfoPage from "@/components/store/infoPage";
import { en } from "@/lib/messages";

const t = en.pages.complaint;

export const metadata: Metadata = {
  title: `${t.title} | ${en.shopName}`,
  description: t.metaDescription,
};

export default function ComplaintPage() {
  return (
    <InfoPage title={t.title} intro={t.intro} sections={t.sections}>
      <h2 className="mb-4 font-heading text-xl font-semibold text-brand-teal">
        {t.contactTitle}
      </h2>
      <ContactCards />
    </InfoPage>
  );
}