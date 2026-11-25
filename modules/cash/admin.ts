import { CASH_KIND_LABELS, type CashKindKey } from "@/lib/cash-kind";
import { prisma } from "@/lib/prisma";
import {
  SALE_PAY_LABELS,
  SALE_PAY_METHODS,
  type SalePayMethodKey,
} from "@/modules/sales/validation";

export const CASH_PAGE_SIZE = 20;

export type OpeningStatus = {
  method: SalePayMethodKey;
  label: string;
  amount: number | null;
  date: string | null;
};

export async function getOpeningStatuses(): Promise<OpeningStatus[]> {
  const rows = await prisma.cashEntry.findMany({
    where: { kind: "OPENING", voidedAt: null },
    select: { method: true, amount: true, entryDate: true },
  });
  const map = new Map(rows.map((r) => [r.method, r]));
  return SALE_PAY_METHODS.map((m) => {
    const r = map.get(m);
    return {
      method: m,
      label: SALE_PAY_LABELS[m],
      amount: r ? Number(r.amount) : null,
      date: r ? r.entryDate.toISOString() : null,
    };
  });
}

export type CashEntryRow = {
  id: string;
  entryNumber: string;
  kind: CashKindKey;
  kindLabel: string;
  methodLabel: string;
  amount: number;
  entryDate: string;
  note: string | null;
  staffName: string;
  voided: boolean;
  voidedBy: string | null;
  voidReason: string | null;
};

export type CashEntryList = {
  items: CashEntryRow[];
  total: number;
  page: number;
  totalPages: number;
};

export async function getCashEntries(pageParam?: number): Promise<CashEntryList> {
  const total = await prisma.cashEntry.count();
  const totalPages = Math.max(1, Math.ceil(total / CASH_PAGE_SIZE));
  const page = Math.min(Math.max(1, pageParam ?? 1), totalPages);

  const rows = await prisma.cashEntry.findMany({
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * CASH_PAGE_SIZE,
    take: CASH_PAGE_SIZE,
  });

  return {
    items: rows.map((e) => ({
      id: e.id,
      entryNumber: e.entryNumber,
      kind: e.kind,
      kindLabel: CASH_KIND_LABELS[e.kind],
      methodLabel: SALE_PAY_LABELS[e.method as SalePayMethodKey] ?? e.method,
      amount: Number(e.amount),
      entryDate: e.entryDate.toISOString(),
      note: e.note,
      staffName: e.staffName,
      voided: e.voidedAt !== null,
      voidedBy: e.voidedBy,
      voidReason: e.voidReason,
    })),
    total,
    page,
    totalPages,
  };
}
