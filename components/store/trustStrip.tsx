import Icon from "@/components/ui/icon";
import { en } from "@/lib/messages";

export default function TrustStrip() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 md:pb-12">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {en.trust.map((item) => (
          <li
            key={item.title}
            className="rounded-2xl border border-white/20 bg-brand-teal/75 p-4 md:p-6"
          >
            <Icon name={item.icon} size={26} className="mb-2 text-brand-orange" />
            <p className="text-sm font-bold md:text-base">{item.title}</p>
            <p className="mt-0.5 text-xs text-white/75 md:text-sm">{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
