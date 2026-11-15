"use client";

import { usePathname } from "next/navigation";
import Icon from "@/components/ui/icon";
import { en } from "@/lib/messages";
import { whatsappLink } from "@/lib/whatsapp";

export default function WhatsAppFloat() {
  const pathname = usePathname();

  // প্রোডাক্ট পেজে মোবাইলে নিচে Buy Now বার আসে, তাই বাটন একটু উপরে রাখি
  const isProductPage = pathname?.startsWith("/products/") ?? false;

  return (
    <a
      href={whatsappLink(en.floatWhatsapp.message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={en.floatWhatsapp.label}
      className={`fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg hover:brightness-95 ${
        isProductPage ? "bottom-24 md:bottom-6" : "bottom-6"
      }`}
    >
      <Icon name="chat" size={26} />
    </a>
  );
}