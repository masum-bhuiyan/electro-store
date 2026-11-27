export type Cell = string | number | null;

// Excel-এ সূত্র হিসেবে চলে যাওয়া ঠেকাতে = + - @ দিয়ে শুরু লেখার আগে ' বসে
function cell(v: Cell): string {
  if (v === null) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Cell[][]): string {
  // শুরুর BOM: Excel বাংলা অক্ষর ঠিকমতো পড়ে
  return "\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export function csvResponse(body: string, fileName: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}