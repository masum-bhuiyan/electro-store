"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  createProductAction,
  updateProductAction,
} from "@/app/(admin)/admin/(panel)/products/actions";
import type {
  AdminProductDetail,
  CatalogOptions,
} from "@/modules/products/admin";

type FormState = {
  name: string;
  slug: string;
  description: string;
  model: string;
  categoryId: string;
  brandId: string;
  warrantyMonths: string;
  isActive: boolean;
  isFeatured: boolean;
  imagesText: string;
};

type VariantRow = {
  key: string;
  id: string | null;
  sku: string;
  color: string;
  storage: string;
  price: string;
  comparePrice: string;
  costPrice: string;
  stock: string;
  currentStock: number | null;
};

type VariantTextField =
  | "sku"
  | "color"
  | "storage"
  | "price"
  | "comparePrice"
  | "costPrice"
  | "stock";

type SpecRow = { key: string; name: string; value: string };

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function emptyVariant(key: string): VariantRow {
  return {
    key,
    id: null,
    sku: "",
    color: "",
    storage: "",
    price: "",
    comparePrice: "",
    costPrice: "",
    stock: "0",
    currentStock: null,
  };
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      )}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

type Props = {
  mode: "create" | "edit";
  options: CatalogOptions;
  initial?: AdminProductDetail;
};

export default function ProductForm({ mode, options, initial }: Props) {
  const router = useRouter();
  const keyCounter = useRef(1000);
  const submitLock = useRef(false);

  function nextKey(): string {
    keyCounter.current += 1;
    return `n${keyCounter.current}`;
  }

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    model: initial?.model ?? "",
    categoryId: initial?.categoryId ?? "",
    brandId: initial?.brandId ?? "",
    warrantyMonths: String(initial?.warrantyMonths ?? 0),
    isActive: initial?.isActive ?? true,
    isFeatured: initial?.isFeatured ?? false,
    imagesText: (initial?.images ?? []).join("\n"),
  });

  // নতুন প্রোডাক্টে নাম থেকে slug নিজে বসবে, হাতে বদলালে আর বসবে না
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const [variants, setVariants] = useState<VariantRow[]>(() =>
    initial
      ? initial.variants.map((v) => ({
          key: v.id,
          id: v.id,
          sku: v.sku,
          color: v.color ?? "",
          storage: v.storage ?? "",
          price: String(v.price),
          comparePrice: v.comparePrice === null ? "" : String(v.comparePrice),
          costPrice: v.costPrice === null ? "" : String(v.costPrice),
          stock: "0",
          currentStock: v.stock,
        }))
      : [emptyVariant("n1")]
  );

  const [specs, setSpecs] = useState<SpecRow[]>(() =>
    (initial?.specs ?? []).map((s, i) => ({
      key: `s${i}`,
      name: s.key,
      value: s.value,
    }))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  function setVariantField(key: string, field: VariantTextField, value: string) {
    setVariants((prev) =>
      prev.map((v) => (v.key === key ? { ...v, [field]: value } : v))
    );
  }

  function addVariant() {
    setVariants((prev) =>
      prev.length >= 30 ? prev : [...prev, emptyVariant(nextKey())]
    );
  }

  // শুধু নতুন (এখনো সেভ না হওয়া) সারি মুছা যায়
  function removeVariant(key: string) {
    setVariants((prev) =>
      prev.length <= 1 ? prev : prev.filter((v) => v.key !== key || v.id !== null)
    );
  }

  function setSpecField(key: string, field: "name" | "value", value: string) {
    setSpecs((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: value } : s))
    );
  }

  function addSpec() {
    setSpecs((prev) =>
      prev.length >= 30 ? prev : [...prev, { key: nextKey(), name: "", value: "" }]
    );
  }

  function removeSpec(key: string) {
    setSpecs((prev) => prev.filter((s) => s.key !== key));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;

    submitLock.current = true;
    setSaving(true);
    setFormError(null);
    setErrors({});

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      model: form.model,
      categoryId: form.categoryId,
      brandId: form.brandId,
      warrantyMonths: form.warrantyMonths,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      images: form.imagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      specs: specs.map((s) => ({ key: s.name, value: s.value })),
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        color: v.color,
        storage: v.storage,
        price: v.price,
        comparePrice: v.comparePrice,
        costPrice: v.costPrice,
        stock: v.stock,
      })),
    };

    let navigated = false;
    try {
      const result =
        mode === "create"
          ? await createProductAction(payload)
          : await updateProductAction(initial?.id, payload);

      if (result.ok) {
        // সফল হলে তালা খুলি না, যাতে পেজ বদলানোর ফাঁকে দ্বিতীয়বার সেভ না হয়
        navigated = true;
        router.push("/admin/products?saved=1");
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold">মূল তথ্য</h2>

        <Field label="প্রোডাক্টের নাম" error={errors.name}>
          <input
            type="text"
            value={form.name}
            maxLength={150}
            onChange={(e) => handleNameChange(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="slug (ঠিকানার অংশ)"
          error={errors.slug}
          hint={
            mode === "edit"
              ? "সাবধান: slug বদলালে পুরোনো লিংক আর কাজ করবে না।"
              : "যেমন: samsung-galaxy-a55 (শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও -)"
          }
        >
          <input
            type="text"
            value={form.slug}
            maxLength={100}
            onChange={(e) => {
              setSlugTouched(true);
              setField("slug", e.target.value);
            }}
            className={`${inputClass} font-mono`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ক্যাটাগরি" error={errors.categoryId}>
            <select
              value={form.categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              className={inputClass}
            >
              <option value="">বাছাই করুন</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="ব্র্যান্ড" error={errors.brandId}>
            <select
              value={form.brandId}
              onChange={(e) => setField("brandId", e.target.value)}
              className={inputClass}
            >
              <option value="">বাছাই করুন</option>
              {options.brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="মডেল (ঐচ্ছিক)" error={errors.model}>
            <input
              type="text"
              value={form.model}
              maxLength={80}
              onChange={(e) => setField("model", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="ওয়ারেন্টি (মাস)" error={errors.warrantyMonths}>
            <input
              type="text"
              inputMode="numeric"
              value={form.warrantyMonths}
              maxLength={3}
              onChange={(e) => setField("warrantyMonths", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="বিবরণ" error={errors.description}>
          <textarea
            value={form.description}
            maxLength={5000}
            rows={5}
            onChange={(e) => setField("description", e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
            />
            সাইটে চালু (ক্রেতারা দেখতে ও কিনতে পারবে)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setField("isFeatured", e.target.checked)}
            />
            বিশেষ প্রোডাক্ট (featured)
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-bold">ভ্যারিয়ান্ট (রঙ, স্টোরেজ, দাম)</h2>
          {errors.variants && (
            <p className="mt-1 text-sm text-red-600">{errors.variants}</p>
          )}
        </div>

        {variants.map((v, i) => (
          <div
            key={v.key}
            className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">ভ্যারিয়ান্ট {i + 1}</p>
              {v.id === null && variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(v.key)}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  মুছুন
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="SKU" error={errors[`variants.${i}.sku`]}>
                <input
                  type="text"
                  value={v.sku}
                  maxLength={40}
                  onChange={(e) => setVariantField(v.key, "sku", e.target.value)}
                  className={`${inputClass} font-mono uppercase`}
                />
              </Field>
              <Field label="রঙ (ঐচ্ছিক)" error={errors[`variants.${i}.color`]}>
                <input
                  type="text"
                  value={v.color}
                  maxLength={30}
                  onChange={(e) => setVariantField(v.key, "color", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="স্টোরেজ (ঐচ্ছিক)" error={errors[`variants.${i}.storage`]}>
                <input
                  type="text"
                  value={v.storage}
                  maxLength={30}
                  placeholder="8GB/128GB"
                  onChange={(e) => setVariantField(v.key, "storage", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="দাম (৳)" error={errors[`variants.${i}.price`]}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={v.price}
                  maxLength={11}
                  onChange={(e) => setVariantField(v.key, "price", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field
                label="কাটা দাম (ঐচ্ছিক)"
                error={errors[`variants.${i}.comparePrice`]}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={v.comparePrice}
                  maxLength={11}
                  onChange={(e) =>
                    setVariantField(v.key, "comparePrice", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field
                label="ক্রয় মূল্য (ঐচ্ছিক)"
                error={errors[`variants.${i}.costPrice`]}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={v.costPrice}
                  maxLength={11}
                  onChange={(e) =>
                    setVariantField(v.key, "costPrice", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              {v.id === null ? (
                <Field label="শুরুর স্টক" error={errors[`variants.${i}.stock`]}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={v.stock}
                    maxLength={7}
                    onChange={(e) => setVariantField(v.key, "stock", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              ) : (
                <div>
                  <span className="mb-1 block text-sm font-medium text-gray-700">
                    বর্তমান স্টক
                  </span>
                  <p className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                    {v.currentStock}
                  </p>
                  <span className="mt-1 block text-xs text-gray-500">
                    স্টক বদলানো দিন ১১-তে আসছে
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addVariant}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          + ভ্যারিয়ান্ট যোগ করুন
        </button>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-bold">স্পেসিফিকেশন (ঐচ্ছিক)</h2>
          {errors.specs && <p className="mt-1 text-sm text-red-600">{errors.specs}</p>}
        </div>

        {specs.map((s) => (
          <div key={s.key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={s.name}
              maxLength={40}
              placeholder="নাম (যেমন battery)"
              onChange={(e) => setSpecField(s.key, "name", e.target.value)}
              className={`${inputClass} sm:w-1/3`}
            />
            <input
              type="text"
              value={s.value}
              maxLength={120}
              placeholder="মান (যেমন 5000mAh)"
              onChange={(e) => setSpecField(s.key, "value", e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeSpec(s.key)}
              className="shrink-0 text-sm text-gray-500 hover:text-red-600"
            >
              মুছুন
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addSpec}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          + সারি যোগ করুন
        </button>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold">ছবির লিংক (ঐচ্ছিক)</h2>
        <Field
          label="প্রতি লাইনে একটা https:// লিংক (সর্বোচ্চ ৮টা)"
          error={errors.images}
          hint="এখন শুধু সংরক্ষণ হবে, সাইটে ছবি দেখানো দিন ১৩-তে আসছে।"
        >
          <textarea
            value={form.imagesText}
            rows={3}
            onChange={(e) => setField("imagesText", e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </Field>
      </section>

      {formError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
        >
          {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
        </button>
        <Link href="/admin/products" className="text-sm text-gray-500 underline">
          বাতিল
        </Link>
        {mode === "edit" && initial && (
          <a
            href={`/products/${initial.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 underline"
          >
            সাইটে দেখুন
          </a>
        )}
      </div>
    </form>
  );
}