"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  confirmDraftAction,
  deleteDraftAction,
} from "@/app/(admin)/admin/(panel)/sales/actions";

export default function DraftActions({
  saleId,
  showConfirm,
  afterDelete,
}: {
  saleId: string;
  showConfirm: boolean;
  // "list" = তালিকায় ফিরে যাও, "refresh" = এখানেই রিফ্রেশ
  afterDelete: "list" | "refresh";
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "confirm" | "delete") {
    if (lock.current) return;
    if (
      kind === "delete" &&
      !window.confirm("এই ড্রাফট মুছে ফেলবেন? পণ্যগুলোর স্টক ফেরত আসবে।")
    ) {
      return;
    }
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const result =
        kind === "confirm"
          ? await confirmDraftAction(saleId)
          : await deleteDraftAction(saleId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (kind === "delete" && afterDelete === "list") {
        router.push("/admin/sales?status=DRAFT");
      }
      router.refresh();
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {showConfirm && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run("confirm")}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-300"
        >
          কনফার্ম করুন
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => run("delete")}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:text-gray-400"
      >
        ডিলিট
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}