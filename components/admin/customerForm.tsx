"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/app/(admin)/admin/(panel)/customers/actions";
import {
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_LABELS,
  nameLabel,
  type CustomerTypeKey,
} from "@/lib/customer-type";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

type Initial = {
  id: string;
  type: CustomerTypeKey;
  name: string;
  contactName: string | null;
  phone: string;
  address: string | null;
  note: string | null;
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export default function CustomerForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Initial;
}) {
  const router = useRouter();
  const submitLock = useRef(false);

  // নতুন ক্রেতায় খুচরা আগে থেকে বাছা থাকে
  const [type, setType] = useState<CustomerTypeKey>(initial?.type ?? "RETAIL");
  const [name, setName] = useState(initial?.name ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;

    submitLock.current = true;
    setSaving(true);
    setErrors({});
    setFormError(null);

    const payload = { type, name, contactName, phone, address, note };

    let navigated = false;
    try {
      const result =
        mode === "create"
          ? await createCustomerAction(payload)
          : await updateCustomerAction(initial?.id, payload);

      if (result.ok) {
        // সফল হলে তালা খুলি না, যাতে পেজ বদলানোর ফাঁকে দ্বিতীয়বার সেভ না হয়
        navigated = true;
        router.push("/admin/customers?saved=1");
        return;
      }
      setFormError(result.message);
      if (result.errors) setErrors(result.errors);
    } catch {
      setFormError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      if (!navigated) {
        submitLock.current = false;
        setSaving(false);
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
    >
      <Field label="ক্রেতার ধরন">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CustomerTypeKey)}
          className={inputClass}
        >
          {CUSTOMER_TYPES.map((t) => (
            <option key={t} value={t}>
              {CUSTOMER_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field label={nameLabel(type)} error={errors.name}>
        <input
          type="text"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>

      {type === "WHOLESALE" && (
        <Field
          label="মালিক বা যোগাযোগের নাম (ঐচ্ছিক)"
          error={errors.contactName}
        >
          <input
            type="text"
            value={contactName}
            maxLength={80}
            onChange={(e) => setContactName(e.target.value)}
            className={inputClass}
          />
        </Field>
      )}

      <Field label="মোবাইল নম্বর" error={errors.phone}>
        <input
          type="text"
          inputMode="tel"
          value={phone}
          maxLength={20}
          placeholder="01XXXXXXXXX"
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="ঠিকানা (ঐচ্ছিক)" error={errors.address}>
        <input
          type="text"
          value={address}
          maxLength={250}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="নোট (ঐচ্ছিক)" error={errors.note}>
        <textarea
          value={note}
          rows={3}
          maxLength={300}
          placeholder="যেমন: মাল না থাকলে আমাদের থেকে নেয়"
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </Field>

      {formError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
        >
          {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
        </button>
        <Link href="/admin/customers" className="text-sm text-gray-500 underline">
          বাতিল
        </Link>
      </div>
    </form>
  );
}