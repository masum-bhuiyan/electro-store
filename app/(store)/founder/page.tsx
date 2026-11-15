/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import ContactCards from "@/components/store/contactCards";
import InfoPage from "@/components/store/infoPage";
import { buttonClass } from "@/components/ui/button";
import { en } from "@/lib/messages";
import { YOUTUBE_URL } from "@/lib/site";

const t = en.pages.founder;

export const metadata: Metadata = {
  title: `${t.title} | ${en.shopName}`,
  description: t.metaDescription,
};

export default function FounderPage() {
  return (
    <InfoPage
      title={t.title}
      intro={t.intro}
      sections={t.sections}
      top={
        <div>
          <img
            src="/founder.jpg"
            alt={t.photoAlt}
            width={1024}
            height={1024}
            className="mx-auto h-auto w-full max-w-md rounded-xl"
          />
          <blockquote className="mt-6 border-l-4 border-brand-orange pl-4 font-heading text-lg text-brand-teal">
            {t.quote}
          </blockquote>
        </div>
      }
    >
      <h2 className="mb-4 font-heading text-xl font-semibold text-brand-teal">
        {t.contactTitle}
      </h2>
      <ContactCards />
      {YOUTUBE_URL && (
        <a
          href={YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass("secondary", "md")} mt-4`}
        >
          {t.watch}
        </a>
      )}
    </InfoPage>
  );
}