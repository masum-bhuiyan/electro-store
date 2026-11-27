import { logoutAction } from "@/app/(admin)/admin/actions";
import AdminShell, { type NavGroup } from "@/components/admin/adminShell";
import { ROLE_LABELS } from "@/lib/permissions";
import { requireStaff } from "@/modules/auth/session";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  const can = (p: (typeof staff.permissions)[number]) =>
    staff.permissions.includes(p);

  const all: (NavGroup & { show: boolean[] })[] = [
    {
      title: "",
      items: [{ label: "ড্যাশবোর্ড", href: "/admin" }],
      show: [true],
    },
    {
      title: "বিক্রয়",
      items: [
        { label: "নতুন বিক্রয় (POS)", href: "/admin/pos" },
        { label: "বিক্রয়ের তালিকা", href: "/admin/sales" },
        { label: "অনলাইন অর্ডার", href: "/admin/orders" },
      ],
      show: [can("pos.sell"), can("pos.sell"), can("orders.view")],
    },
    {
      title: "পণ্য",
      items: [
        { label: "প্রোডাক্ট", href: "/admin/products" },
        { label: "স্টক", href: "/admin/stock" },
        { label: "ক্যাটাগরি ও ব্র্যান্ড", href: "/admin/catalog" },
      ],
      show: [can("products.view"), can("stock.view"), can("catalog.manage")],
    },
    {
      title: "ক্রয়",
      items: [
        { label: "ক্রয়", href: "/admin/purchases" },
        { label: "সাপ্লায়ার", href: "/admin/suppliers" },
      ],
      show: [can("purchase.manage"), can("purchase.manage")],
    },
    {
      title: "ক্রেতা",
      items: [{ label: "ক্রেতা", href: "/admin/customers" }],
      show: [can("customers.view")],
    },
    {
      title: "টাকা",
      items: [
        { label: "খরচ", href: "/admin/expenses" },
        { label: "ক্যাশ ও ব্যাংক", href: "/admin/cash" },
        { label: "ক্যাশবুক", href: "/admin/cashbook" },
        { label: "দিনের সমাপ্তি", href: "/admin/closing" },
      ],
      show: [
        can("money.manage"),
        can("money.manage"),
        can("money.manage"),
        can("money.manage"),
      ],
    },
    {
      title: "রিপোর্ট",
      items: [
        { label: "বিক্রয় রিপোর্ট", href: "/admin/reports/sales" },
        { label: "লাভ-ক্ষতি", href: "/admin/reports/profit" },
        { label: "কেনা দামের নিচে বিক্রি", href: "/admin/reports/below-cost" },
        { label: "টাকা বেরোনো", href: "/admin/reports/money-out" },
      ],
      show: [
        can("reports.view"),
        can("ownerFinance.view"),
        can("ownerFinance.view"),
        can("money.manage"),
      ],
    },
    {
      title: "সেটিংস",
      items: [{ label: "কর্মচারী", href: "/admin/staff" }],
      show: [can("staff.manage")],
    },
  ];

  const groups: NavGroup[] = all
    .map((g) => ({
      title: g.title,
      items: g.items.filter((_, i) => g.show[i]),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <AdminShell
      groups={groups}
      userLabel={`${staff.name} (${ROLE_LABELS[staff.role]})`}
      logoutSlot={
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            লগআউট
          </button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}