import type { Metadata } from "next";
import ContactCards from "@/components/store/contactCards";
import InfoPage from "@/components/store/infoPage";
import { en } from "@/lib/messages";

const t = en.pages.contact;

export const metadata: Metadata = {
  title: `${t.title} | ${en.shopName}`,
  description: t.metaDescription,
};

export default function ContactPage() {
  return (
    <InfoPage title={t.title} intro={t.intro}>
      <ContactCards />
    </InfoPage>
  );
}