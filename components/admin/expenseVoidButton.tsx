"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { voidExpenseAction } from "@/app/(admin)/admin/(panel)/expenses/actions";

export default function ExpenseVoidButton({ id }: { id: string }) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (lock.current) return;
    const reason = window.prompt("কেন বাতিল করছেন? (কারণ লিখুন, এটা পরে বদলানো যাবে না)");
    if (reason === null) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await voidExpenseAction(id, reason);
      if (result.ok) router.refresh();
      else window.alert(result.message);
    } catch {
      window.alert("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="text-xs text-red-600 hover:underline disabled:text-gray-400"
    >
      {busy ? "..." : "বাতিল"}
    </button>
  );
}