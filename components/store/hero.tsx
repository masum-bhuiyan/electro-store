/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Icon from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";
import TrustStrip from "@/components/store/trustStrip";
import { en } from "@/lib/messages";

// WhatsApp নম্বর (দেশের কোডসহ, + ছাড়া)। নম্বরটা ঠিক কি না যাচাই করুন; পরে lib/site.ts-এ সরাব।
const WHATSAPP_NUMBER = "8801840016930";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-teal text-white">
      <picture>
        <source media="(min-width: 768px)" srcSet="/hero-desktop.webp" />
        <img
          src="/hero-mobile.webp"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_center] md:object-[72%_center]"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(17,44,45,.92)_0%,rgba(17,44,45,.55)_45%,rgba(17,44,45,.94)_100%)] md:bg-[linear-gradient(90deg,rgba(17,44,45,.96)_0%,rgba(17,44,45,.86)_42%,rgba(17,44,45,.3)_100%)]" />

      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 md:pb-12 md:pt-24">
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-widest text-sky-300 md:text-sm">
            {en.hero.eyebrow}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-tight md:text-6xl">
            {en.hero.title1}
            <br />
            {en.hero.title2}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/85 md:text-lg">
            {en.hero.text}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className={buttonClass("primary", "lg")}>
              {en.hero.shop}
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("light", "lg")}
            >
              <Icon name="chat" size={20} />
              {en.hero.whatsapp}
            </a>
          </div>
        </div>
      </div>

      <div className="pt-24 md:pt-32">
        <TrustStrip />
      </div>
    </section>
  );
}