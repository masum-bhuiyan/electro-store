import Link from "next/link";
import { SHOP_NAME, SHOP_PHONE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-gray-500">
        {SHOP_PHONE && (
          <p className="mb-2 text-gray-700">
            অর্ডার বা অন্য প্রয়োজনে ফোন করুন:{" "}
            <a href={`tel:${SHOP_PHONE}`} className="font-medium text-blue-600 underline">
              {SHOP_PHONE}
            </a>
          </p>
        )}
        <p className="mb-2">
          <Link href="/track" className="underline hover:text-blue-600">
            অর্ডার ট্র্যাক করুন
          </Link>
        </p>
        <p>
          © {new Date().getFullYear()} {SHOP_NAME}। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>
    </footer>
  );
}