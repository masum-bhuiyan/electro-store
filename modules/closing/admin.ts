import { prisma } from "@/lib/prisma";
import type { ClosingLine } from "./mutations";

export type ClosingRow = {
  id: string;
  closingNumber: string;
  date: string; // YYYY-MM-DD
  lines: ClosingLine[];
  totalDiff: number;
  staffName: string;
  createdAt: string;
  voided: boolean;
  voidedBy: string | null;
};

type Raw = Awaited<ReturnType<typeof prisma.dayClosing.findMany>>[number];

function toRow(c: Raw): ClosingRow {
  return {
    id: c.id,
    closingNumber: c.closingNumber,
    date: c.closingDate.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }),
    lines: (Array.isArray(c.lines) ? c.lines : []) as unknown as ClosingLine[],
    totalDiff: Math.round(Number(c.totalDiff) * 100) / 100,
    staffName: c.staffName,
    createdAt: c.createdAt.toISOString(),
    voided: c.voidedAt !== null,
    voidedBy: c.voidedBy,
  };
}

export async function getActiveClosing(date: string): Promise<ClosingRow | null> {
  const c = await prisma.dayClosing.findFirst({
    where: { closingDate: new Date(`${date}T00:00:00+06:00`), voidedAt: null },
  });
  return c ? toRow(c) : null;
}

export async function getClosingHistory(limit = 30): Promise<ClosingRow[]> {
  const rows = await prisma.dayClosing.findMany({
    orderBy: [{ closingDate: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(toRow);
}