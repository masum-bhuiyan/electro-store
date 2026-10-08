import Link from "next/link";

type Option = { name: string; slug: string };

type Props = {
  categories: Option[];
  brands: Option[];
  q?: string;
  category?: string;
  brand?: string;
};

export default function ProductFilters({
  categories,
  brands,
  q,
  category,
  brand,
}: Props) {
  const hasFilter = Boolean(q || category || brand);

  return (
    <form
      action="/products"
      method="get"
      className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-4"
    >
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="প্রোডাক্টের নাম লিখুন"
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <select
        name="category"
        defaultValue={category ?? ""}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">সব ক্যাটাগরি</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        name="brand"
        defaultValue={brand ?? ""}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">সব ব্র্যান্ড</option>
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          খুঁজুন
        </button>
        {hasFilter && (
          <Link href="/products" className="text-sm text-gray-500 hover:text-red-600">
            মুছে ফেলুন
          </Link>
        )}
      </div>
    </form>
  );
}