import { AUTHORIZED_BRANDS } from "@/lib/brands";
import { en } from "@/lib/messages";

export default function BrandStrip() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <h2 className="mb-5 font-heading text-2xl font-semibold text-brand-teal md:mb-7 md:text-3xl">
          {en.brands.title}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {AUTHORIZED_BRANDS.map((name) => (
            <li
              key={name}
              className="flex h-14 items-center justify-center rounded-xl border border-gray-200 px-2 text-center text-sm font-bold uppercase tracking-wider text-gray-700 last:col-span-2 sm:last:col-span-1"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}