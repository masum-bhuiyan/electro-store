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

export const PERMISSION_LABELS: Record<Permission, string> = {
  "orders.view": "অর্ডার দেখা",
  "orders.manage": "অর্ডারের অবস্থা বদলানো",
  "orders.editPrice": "অর্ডারে দাম এডিট",
  "products.view": "প্রোডাক্ট দেখা",
  "products.edit": "প্রোডাক্ট যোগ ও এডিট",
  "costPrice.view": "কেনা দাম দেখা",
  "stock.view": "স্টক দেখা",
  "stock.adjust": "স্টক বদলানো",
  "catalog.manage": "ক্যাটাগরি ও ব্র্যান্ড",
  "customers.view": "কাস্টমার দেখা",
  "customers.manage": "কাস্টমার যোগ ও এডিট",
  "pos.sell": "দোকানে বিক্রি (POS)",
  "purchase.manage": "মাল কেনা",
  "money.manage": "টাকা-পয়সা, খরচ, ক্যাশ",
  "reports.view": "রিপোর্ট দেখা",
  "ownerFinance.view": "মালিকের গোপন হিসাব",
  "staff.manage": "কর্মচারী ব্যবস্থাপনা",
};

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

// শুধু মালিকের থাকবে। চেকবক্স দিয়েও কাউকে দেওয়া যাবে না
export const OWNER_ONLY_PERMISSIONS: readonly Permission[] = [
  "ownerFinance.view",
  "staff.manage",
];

// চেকবক্সে যেগুলো দেওয়া-নেওয়া যায়
export const GRANTABLE_PERMISSIONS: readonly Permission[] =
  ALL_PERMISSIONS.filter((p) => !OWNER_ONLY_PERMISSIONS.includes(p));

export function roleDefaults(role: StaffRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function isPermission(value: unknown): value is Permission {
  return (
    typeof value === "string" &&
    (ALL_PERMISSIONS as readonly string[]).includes(value)
  );
}

export function isGrantablePermission(value: unknown): value is Permission {
  return (
    isPermission(value) &&
    (GRANTABLE_PERMISSIONS as readonly string[]).includes(value)
  );
}

// আসল অনুমতি = role-এর ডিফল্ট + আলাদা করে দেওয়া − আলাদা করে নেওয়া
export function computeEffectivePermissions(
  role: StaffRole,
  extra: readonly string[],
  denied: readonly string[]
): Permission[] {
  if (role === "ADMIN") return [...ALL_PERMISSIONS];

  const set = new Set<Permission>(ROLE_PERMISSIONS[role]);
  for (const p of extra) if (isGrantablePermission(p)) set.add(p);
  for (const p of denied) if (isPermission(p)) set.delete(p);
  // মালিক ছাড়া কেউ এই দুটো পাবে না, ডাটাবেসে যা-ই থাকুক
  for (const p of OWNER_ONLY_PERMISSIONS) set.delete(p);

  return ALL_PERMISSIONS.filter((p) => set.has(p));
}

// কর্মচারী ফর্ম থেকে যে role দেওয়া যাবে (মালিক শুধু create-admin স্ক্রিপ্টে)
export const ASSIGNABLE_ROLES = ["MANAGER", "SALES", "ACCOUNTS"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignableRole(value: unknown): value is AssignableRole {
  return (
    typeof value === "string" &&
    (ASSIGNABLE_ROLES as readonly string[]).includes(value)
  );
}