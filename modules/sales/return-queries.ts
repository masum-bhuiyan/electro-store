import { customerTypeLabel, type CustomerTypeKey } from "@/lib/customer-type";
import { prisma } from "@/lib/prisma";

export type SaleReturnReceiptData = {
  id: string;
  returnNumber: string;
  createdAt: string;
  saleId: string;
  saleNumber: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerTypeText: string;
  total: number;
  creditAmount: number;
  cashRefund: number;
  note: string | null;
  staffName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
};

export async function getSaleReturnReceipt(
  id: string
): Promise<SaleReturnReceiptData | null> {
  const r = await prisma.saleReturn.findUnique({
    where: { id },
    include: {
      sale: {
        select: {
          id: true,
          saleNumber: true,
          customerId: true,
          customerName: true,
          customerPhone: true,
          customerType: true,
        },
      },
      items: { orderBy: { id: "asc" } },
    },
  });
  if (!r) return null;

  return {
    id: r.id,
    returnNumber: r.returnNumber,
    createdAt: r.createdAt.toISOString(),
    saleId: r.sale.id,
    saleNumber: r.sale.saleNumber,
    customerId: r.sale.customerId,
    customerName: r.sale.customerName,
    customerPhone: r.sale.customerPhone,
    customerTypeText: customerTypeLabel(r.sale.customerType as CustomerTypeKey),
    total: Number(r.total),
    creditAmount: Number(r.creditAmount),
    cashRefund: Number(r.cashRefund),
    note: r.note,
    staffName: r.staffName,
    items: r.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      amount: Number(i.amount),
    })),
  };
}