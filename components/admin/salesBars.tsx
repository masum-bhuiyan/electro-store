import { formatPrice } from "@/lib/format";
import type { ChartDay } from "@/modules/admin/dashboard";

function compact(n: number): string {
  if (n >= 100000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(Math.round(n / 100) / 10).toString()}k`;
  return String(Math.round(n));
}

function dayLabel(day: string): string {
  return Number(day.slice(8)).toLocaleString("bn-BD");
}

export default function SalesBars({ days }: { days: ChartDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.total));
  const last = days.length - 1;

  return (
    <div>
            <div className="flex h-72 items-end gap-2 border-b border-gray-200 px-1 pt-6">
        {days.map((d, i) => {
          const h = d.total > 0 ? Math.max(3, (d.total / max) * 100) : 0;
          const color = i % 2 === 0 ? "bg-brand-orange" : "bg-brand-blue";
          const tipPos =
            i <= 2 ? "left-0" : i >= last - 2 ? "right-0" : "left-1/2 -translate-x-1/2";
          return (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 flex-col justify-end"
            >
              <div
                className={`relative mx-auto w-full max-w-9 rounded-t-md transition-opacity group-hover:opacity-80 ${color}`}
                style={{ height: `${h}%`, minHeight: d.total > 0 ? undefined : 2 }}
              >
                {d.total > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] text-gray-600">
                    {compact(d.total)}
                  </span>
                )}
              </div>
              {d.total === 0 && (
                <div className="mx-auto h-0.5 w-full max-w-9 bg-gray-200" />
              )}

              <div
                className={`pointer-events-none absolute bottom-full z-20 mb-10 hidden w-44 rounded-lg bg-admin-navy p-3 text-xs text-white shadow-lg group-hover:block ${tipPos}`}
              >
                <p className="mb-1 font-medium">{d.day}</p>
                <p className="flex justify-between">
                  <span>মোট</span>
                  <span>{formatPrice(d.total)}</span>
                </p>
                <p className="flex justify-between text-[#B9CCE0]">
                  <span>দোকান</span>
                  <span>{formatPrice(d.pos)}</span>
                </p>
                <p className="flex justify-between text-[#B9CCE0]">
                  <span>অনলাইন</span>
                  <span>{formatPrice(d.online)}</span>
                </p>
                {d.returns > 0 && (
                  <p className="flex justify-between text-[#B9CCE0]">
                    <span>ফেরত (বাদ)</span>
                    <span>− {formatPrice(d.returns)}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2 px-1">
        {days.map((d) => (
          <span key={d.day} className="flex-1 text-center text-[11px] text-gray-500">
            {dayLabel(d.day)}
          </span>
        ))}
      </div>
    </div>
  );
}