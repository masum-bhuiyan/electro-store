import {
  SHOP_ADDRESS,
  SHOP_HOURS,
  SHOP_LEGAL_NAME,
  SHOP_PHONE,
  SHOP_PHONE_2,
  SHOP_WEBSITE,
} from "@/lib/site";

// সব ছাপা কাগজের (মেমো, রসিদ, খতিয়ান...) একই হেডার
export default function ShopHeader() {
  return (
    <header className="flex items-start gap-4 border-b-2 border-black pb-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt={SHOP_LEGAL_NAME}
        width={90}
        height={90}
        className="-mt-1 h-[90px] w-[90px] shrink-0 object-contain"
      />
      <div className="flex-1 text-center">
        <h1 className="text-2xl font-bold">{SHOP_LEGAL_NAME}</h1>
        <p className="mt-1">{SHOP_ADDRESS}</p>
        <p>
          মোবাইল: {SHOP_PHONE}, {SHOP_PHONE_2}
        </p>
        <p className="mt-1 text-base font-bold tracking-wide">
          Website: {SHOP_WEBSITE}
        </p>
        <p className="text-xs text-gray-600">{SHOP_HOURS}</p>
      </div>
      <div className="w-[90px] shrink-0" />
    </header>
  );
}