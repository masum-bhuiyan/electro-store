import type { Metadata } from "next";
import TrackView from "@/components/store/trackView";
import { en } from "@/lib/messages";
import { normalizeOrderNumber } from "@/modules/orders/validation";

export const metadata: Metadata = {
  title: `${en.track.metaTitle} | ${en.shopName}`,
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrackPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.order) ? sp.order[0] : sp.order;

  // ঠিকানা থেকে আসা নম্বর ফরম্যাট ঠিক থাকলেই ফর্মে বসাই
  const defaultOrderNumber = normalizeOrderNumber(raw) ?? "";

  return (
    <div>
      <h1 className="text-center font-heading text-2xl font-bold text-brand-teal">
        {en.track.title}
      </h1>
      <p className="mx-auto mb-6 mt-2 max-w-md text-center text-sm text-gray-600">
        {en.track.intro}
      </p>
      <TrackView defaultOrderNumber={defaultOrderNumber} />
    </div>
  );
}