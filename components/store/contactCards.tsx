import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import { en } from "@/lib/messages";
import {
  FACEBOOK_URL,
  SHOP_EMAIL,
  SHOP_PHONE,
  SHOP_PHONE_2,
  YOUTUBE_URL,
  telHref,
} from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

const linkClass =
  "flex min-h-11 items-center font-medium text-brand-blue hover:underline";

function Card({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-brand-teal">
        <Icon name={icon} size={22} className="text-brand-blue" />
        <h3 className="font-heading font-semibold">{title}</h3>
      </div>
      <div className="mt-2 text-sm text-gray-700">{children}</div>
    </div>
  );
}

export default function ContactCards() {
  const c = en.pages.contact.cards;
  const f = en.footer;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card icon="phone" title={c.call}>
        <a href={telHref(SHOP_PHONE)} className={linkClass}>
          {SHOP_PHONE}
        </a>
        <a href={telHref(SHOP_PHONE_2)} className={linkClass}>
          {SHOP_PHONE_2}
        </a>
      </Card>

      <Card icon="chat" title={c.whatsapp}>
        <a
          href={whatsappLink(en.pages.contact.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {c.whatsappText}
        </a>
      </Card>

      <Card icon="mail" title={c.email}>
        <a href={`mailto:${SHOP_EMAIL}`} className={`${linkClass} break-all`}>
          {SHOP_EMAIL}
        </a>
      </Card>

      <Card icon="location" title={c.visit}>
        <p>{f.address}</p>
        <p className="mt-1 text-gray-600">{f.hours}</p>
      </Card>

      {(FACEBOOK_URL || YOUTUBE_URL) && (
        <Card icon="youtube" title={c.follow}>
          {FACEBOOK_URL && (
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {f.facebook}
            </a>
          )}
          {YOUTUBE_URL && (
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {f.youtube}
            </a>
          )}
        </Card>
      )}
    </div>
  );
}