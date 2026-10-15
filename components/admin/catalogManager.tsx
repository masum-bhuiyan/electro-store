"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createCatalogItemAction,
  deleteCatalogItemAction,
} from "@/app/(admin)/admin/(panel)/catalog/actions";
import type { CatalogItem, CatalogKind } from "@/modules/catalog/admin";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function Section({
  title,
  kind,
  items,
}: {
  title: string;
  kind: CatalogKind;
  items: CatalogItem[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    // নাম থেকে slug নিজে বসবে, হাতে বদলালে আর বসবে না
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrors({});
    setError(null);
    setMessage(null);

    try {
      const result = await createCatalogItemAction(kind, { name, slug });
      if (result.ok) {
        setMessage("✅ যোগ হয়েছে।");
        setName("");
        setSlug("");
        setSlugTouched(false);
        router.refresh();
        return;
      }
      setError(result.message);
      if (result.errors) setErrors(result.errors);
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CatalogItem) {
    if (busyId) return;
    if (!window.confirm(`"${item.name}" মুছে ফেলবেন? এটা ফেরানো যায় না।`)) return;

    setBusyId(item.id);
    setError(null);
    setMessage(null);

    try {
      const result = await deleteCatalogItemAction(kind, item.id);
      if (result.ok) {
        setMessage("✅ মুছে ফেলা হয়েছে।");
      } else {
        setError(result.message);
      }
      router.refresh();
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-bold">
        {title} ({items.length})
      </h2>

      <form onSubmit={handleCreate} className="mb-5 grid gap-3 sm:grid-cols-5">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-gray-600">নাম</span>
          <input
            type="text"
            value={name}
            maxLength={60}
            onChange={(e) => handleNameChange(e.target.value)}
            className={inputClass}
          />
          {errors.name && (
            <span className="mt-1 block text-xs text-red-600">{errors.name}</span>
          )}
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            slug (ইংরেজি)
          </span>
          <input
            type="text"
            value={slug}
            maxLength={60}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={`${inputClass} font-mono`}
          />
          {errors.slug && (
            <span className="mt-1 block text-xs text-red-600">{errors.slug}</span>
          )}
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          >
            {saving ? "..." : "+ যোগ করুন"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">এখনো কিছু নেই।</p>
      ) : (
        <ul className="divide-y divide-gray-200 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="font-medium">{item.name}</span>
                <span className="ml-2 font-mono text-xs text-gray-500">{item.slug}</span>
              </span>
              <span className="flex items-center gap-4">
                <span className="text-gray-600">{item.productCount}টি প্রোডাক্ট</span>
                {item.productCount === 0 ? (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item)}
                    className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                  >
                    মুছুন
                  </button>
                ) : (
                  <span className="w-10" />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CatalogManager({
  categories,
  brands,
}: {
  categories: CatalogItem[];
  brands: CatalogItem[];
}) {
  return (
    <div className="space-y-6">
      <Section title="ক্যাটাগরি" kind="category" items={categories} />
      <Section title="ব্র্যান্ড" kind="brand" items={brands} />
    </div>
  );
}