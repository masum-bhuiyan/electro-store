// কোন role কী করতে পারবে, সব নিয়ম এই একটা ফাইলে

export const STAFF_ROLES = ["ADMIN", "MANAGER", "SALES", "ACCOUNTS"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

// ADMIN = মালিক (Owner)। ডাটাবেসে নাম ADMIN-ই রেখেছি
export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "মালিক",
  MANAGER: "ম্যানেজার",
  SALES: "সেলস",
  ACCOUNTS: "একাউন্টস",
};

export const ALL_PERMISSIONS = [
  "orders.view",
  "orders.manage", // অর্ডারের স্ট্যাটাস বদলানো
  "orders.editPrice", // অর্ডারে দাম এডিট (ধাপ ১E)
  "products.view",
  "products.edit",
  "costPrice.view", // কেনা দাম দেখা
  "stock.view",
  "stock.adjust",
  "catalog.manage",
  "customers.view", // (ERP-2)
  "customers.manage",
  "pos.sell", // (ERP-3)
  "purchase.manage", // (ERP-4)
  "money.manage", // খরচ, ক্যাশ, ব্যাংক, বাকি আদায় (ERP-5/6)
  "reports.view", // (ERP-7)
  "ownerFinance.view", // মালিকের গোপন হিসাব
  "staff.manage", // কর্মচারী যোগ/বন্ধ/role বদল
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  // মালিক সব পারে
  ADMIN: ALL_PERMISSIONS,

  // ম্যানেজার: সব, শুধু মালিকের গোপন হিসাব আর কর্মচারী ব্যবস্থাপনা বাদে
  MANAGER: ALL_PERMISSIONS.filter(
    (p) => p !== "ownerFinance.view" && p !== "staff.manage"
  ),

  // সেলস: বিক্রি ও অর্ডার। কেনা দাম দেখতে পারবে না
  SALES: [
    "orders.view",
    "orders.manage",
    "products.view",
    "stock.view",
    "customers.view",
    "customers.manage",
    "pos.sell",
  ],

  // একাউন্টস: টাকা, খরচ, রিপোর্ট
  ACCOUNTS: [
    "orders.view",
    "products.view",
    "costPrice.view",
    "stock.view",
    "customers.view",
    "money.manage",
    "reports.view",
  ],
};

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}