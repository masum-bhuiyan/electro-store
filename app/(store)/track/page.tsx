import type { Metadata } from "next";
import TrackView from "@/components/store/trackView";
import { normalizeOrderNumber } from "@/modules/orders/validation";

export const metadata: Metadata = {
  title: "অর্ডার ট্র্যাক করুন | Electro Store",
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
      <h1 className="mb-6 text-center text-2xl font-bold">অর্ডার ট্র্যাক করুন</h1>
      <TrackView defaultOrderNumber={defaultOrderNumber} />
    </div>
  );
}