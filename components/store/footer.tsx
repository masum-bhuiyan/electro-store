import Link from "next/link";
import Icon from "@/components/ui/icon";
import { en } from "@/lib/messages";
import {
  FACEBOOK_URL,
  SHOP_EMAIL,
  SHOP_NAME,
  SHOP_PHONE,
  SHOP_PHONE_2,
  YOUTUBE_URL,
  telHref,
} from "@/lib/site";

const linkClass =
  "inline-flex min-h-11 items-center text-sm hover:text-white";

export default function Footer() {
  const f = en.footer;

  return (
    <footer className="bg-brand-teal text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-heading text-xl font-semibold text-white">
            {en.shopName}
          </p>
          <p className="mt-1 text-sm font-semibold text-sky-300">{f.tagline}</p>

          <address className="mt-4 space-y-1 text-sm not-italic">
            <p className="flex gap-2">
              <Icon name="location" size={18} className="mt-0.5 shrink-0 text-sky-300" />
              <span>{f.address}</span>
            </p>
            <p className="flex flex-wrap items-center gap-x-4">
              <span className="flex items-center gap-2">
                <Icon name="phone" size={18} className="shrink-0 text-sky-300" />
                <a href={telHref(SHOP_PHONE)} className={linkClass}>
                  {SHOP_PHONE}
                </a>
              </span>
              <a href={telHref(SHOP_PHONE_2)} className={linkClass}>
                {SHOP_PHONE_2}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Icon name="mail" size={18} className="shrink-0 text-sky-300" />
              <a href={`mailto:${SHOP_EMAIL}`} className={linkClass}>
                {SHOP_EMAIL}
              </a>
            </p>
            <p className="flex items-center gap-2 py-2">
              <Icon name="clock" size={18} className="shrink-0 text-sky-300" />
              <span>{f.hours}</span>
            </p>
          </address>

          {(FACEBOOK_URL || YOUTUBE_URL) && (
            <div className="mt-2 flex gap-2">
              {FACEBOOK_URL && (
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={f.facebook}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10"
                >
                  <Icon name="facebook" size={20} />
                </a>
              )}
              {YOUTUBE_URL && (
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={f.youtube}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10"
                >
                  <Icon name="youtube" size={20} />
                </a>
              )}
            </div>
          )}
        </div>

        <nav aria-label={f.policies}>
          <p className="font-bold text-white">{f.policies}</p>
          <ul className="mt-2">
            <li>
              <Link href="/delivery-rules" className={linkClass}>
                {f.delivery}
              </Link>
            </li>
            <li>
              <Link href="/refund-warranty" className={linkClass}>
                {f.refund}
              </Link>
            </li>
            <li>
              <Link href="/complaint" className={linkClass}>
                {f.complaint}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={f.company}>
          <p className="font-bold text-white">{f.company}</p>
          <ul className="mt-2">
            <li>
              <Link href="/about" className={linkClass}>
                {f.about}
              </Link>
            </li>
            <li>
              <Link href="/founder" className={linkClass}>
                {f.founder}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={linkClass}>
                {f.contact}
              </Link>
            </li>
            <li>
              <Link href="/track" className={linkClass}>
                {en.nav.track}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-white/70">
          {f.rights(new Date().getFullYear(), SHOP_NAME)}
        </p>
      </div>
    </footer>
  );
}