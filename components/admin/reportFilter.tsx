import Link from "next/link";
import { addDays } from "@/modules/cash/book";

type Props = {
  basePath: string;
  from: string;
  to: string;
  type: string;
  showType: boolean;
  today: string;
};

const TYPES = [
  { value: "ALL", label: "সব" },
  { value: "RETAIL", label: "খুচরা" },
  { value: "WHOLESALE", label: "পাইকারি" },
];

export default function ReportFilter({
  basePath,
  from,
  to,
  type,
  showType,
  today,
}: Props) {
  const yesterday = addDays(today, -1);
  const monthStart = today.slice(0, 8) + "01";
  const lastMonthEnd = addDays(monthStart, -1);
  const lastMonthStart = lastMonthEnd.slice(0, 8) + "01";

  const href = (f: string, t: string, ty = type) =>
    `${basePath}?from=${f}&to=${t}${showType ? `&type=${ty}` : ""}`;

  const quick = [
    { label: "আজ", from: today, to: today },
    { label: "গতকাল", from: yesterday, to: yesterday },
    { label: "এই মাস", from: monthStart, to: today },
    { label: "গত মাস", from: lastMonthStart, to: lastMonthEnd },
  ];

  return (
    <section className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <Link
            key={q.label}
            href={href(q.from, q.to)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {q.label}
          </Link>
        ))}
      </div>

      {showType && (
        <div className="flex flex-wrap gap-2">
          {TYPES.map((x) => (
            <Link
              key={x.value}
              href={href(from, to, x.value)}
              className={
                type === x.value
                  ? "rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              }
            >
              {x.label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-6">
        <form method="get" action={basePath} className="flex flex-wrap items-end gap-2">
          {showType && <input type="hidden" name="type" value={type} />}
          <label className="block text-xs text-gray-600">
            শুরু
            <input
              type="date"
              name="from"
              defaultValue={from}
              max={today}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-gray-600">
            শেষ
            <input
              type="date"
              name="to"
              defaultValue={to}
              max={today}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            দেখুন
          </button>
        </form>

        <form method="get" action={basePath} className="flex flex-wrap items-end gap-2">
          {showType && <input type="hidden" name="type" value={type} />}
          <label className="block text-xs text-gray-600">
            মাস বেছে নিন
            <input
              type="month"
              name="month"
              defaultValue={from.slice(0, 7)}
              max={today.slice(0, 7)}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            মাস দেখুন
          </button>
        </form>
      </div>
    </section>
  );
}