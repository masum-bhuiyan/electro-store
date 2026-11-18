import { hashPassword } from "@/lib/password";
import {
  ASSIGNABLE_ROLES,
  STAFF_ROLES,
  computeEffectivePermissions,
  isGrantablePermission,
  roleDefaults,
  type AssignableRole,
  type Permission,
  type StaffRole,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { NewStaffInput } from "./validation";

export type StaffRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: StaffRole;
  isActive: boolean;
  effective: Permission[]; // এখন আসলে যা যা পারে
  hasCustomAccess: boolean; // ডিফল্টের বাইরে আলাদা অ্যাক্সেস আছে কি না
};

export type StaffResult =
  | { ok: true }
  | { ok: false; message: string; errors?: Record<string, string> };

const NOT_FOUND: StaffResult = {
  ok: false,
  message: "কর্মচারী পাওয়া যায়নি (মালিকের অ্যাকাউন্ট এখান থেকে বদলানো যায় না)।",
};

export async function getStaffList(): Promise<StaffRow[]> {
  const users = await prisma.user.findMany({
    where: { role: { in: [...STAFF_ROLES] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      extraPermissions: true,
      deniedPermissions: true,
    },
  });

  const rows: StaffRow[] = users.map((u) => {
    const role = u.role as StaffRole;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role,
      isActive: u.isActive,
      effective: computeEffectivePermissions(
        role,
        u.extraPermissions,
        u.deniedPermissions
      ),
      hasCustomAccess:
        u.extraPermissions.length > 0 || u.deniedPermissions.length > 0,
    };
  });

  // মালিক সবার আগে (বাকিরা তৈরির ক্রমে থাকে)
  return rows.sort(
    (a, b) => Number(b.role === "ADMIN") - Number(a.role === "ADMIN")
  );
}

export async function createStaff(data: NewStaffInput): Promise<StaffResult> {
  const sameEmail = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (sameEmail) {
    return {
      ok: false,
      message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
      errors: { email: "এই ইমেইল আগে থেকেই আছে।" },
    };
  }

  if (data.phone) {
    const samePhone = await prisma.user.findUnique({
      where: { phone: data.phone },
      select: { id: true },
    });
    if (samePhone) {
      return {
        ok: false,
        message: "ফর্মের লাল ঘরগুলো ঠিক করুন।",
        errors: { phone: "এই ফোন নম্বর আগে থেকেই আছে।" },
      };
    }
  }

  // ডাটাবেসে আসল পাসওয়ার্ড যায় না, শুধু hash
  const hashed = await hashPassword(data.password);

  try {
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashed,
        role: data.role,
        isActive: true,
      },
    });
  } catch {
    return { ok: false, message: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" };
  }
  return { ok: true };
}

export async function changeStaffRole(
  actorId: string,
  userId: string,
  role: AssignableRole
): Promise<StaffResult> {
  if (actorId === userId) {
    return { ok: false, message: "নিজের role নিজে বদলানো যাবে না।" };
  }

  // role বদলালে আলাদা অ্যাক্সেস মুছে নতুন role-এর ডিফল্টে ফেরে
  const res = await prisma.user.updateMany({
    where: { id: userId, role: { in: [...ASSIGNABLE_ROLES] } },
    data: { role, extraPermissions: [], deniedPermissions: [] },
  });
  return res.count === 0 ? NOT_FOUND : { ok: true };
}

// চেকবক্সে টিক দেওয়া অনুমতিগুলো থেকে "ডিফল্টের চেয়ে বাড়তি / কম" হিসাব করে রাখে
export async function updateStaffAccess(
  userId: string,
  chosen: Permission[]
): Promise<StaffResult> {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: { in: [...ASSIGNABLE_ROLES] } },
    select: { role: true },
  });
  if (!user) return NOT_FOUND;

  const defaults = roleDefaults(user.role as StaffRole).filter(
    isGrantablePermission
  );
  const extra = chosen.filter((p) => !defaults.includes(p));
  const denied = defaults.filter((p) => !chosen.includes(p));

  const res = await prisma.user.updateMany({
    where: { id: userId, role: { in: [...ASSIGNABLE_ROLES] } },
    data: { extraPermissions: extra, deniedPermissions: denied },
  });
  return res.count === 0 ? NOT_FOUND : { ok: true };
}

export async function setStaffActive(
  actorId: string,
  userId: string,
  active: boolean
): Promise<StaffResult> {
  if (actorId === userId) {
    return { ok: false, message: "নিজের অ্যাকাউন্ট নিজে বন্ধ করা যাবে না।" };
  }

  const res = await prisma.user.updateMany({
    where: { id: userId, role: { in: [...ASSIGNABLE_ROLES] } },
    data: { isActive: active },
  });
  if (res.count === 0) return NOT_FOUND;

  // বন্ধ করলে চালু থাকা সব লগইন বাতিল
  if (!active) {
    await prisma.session.deleteMany({ where: { userId } });
  }
  return { ok: true };
}

export async function resetStaffPassword(
  userId: string,
  password: string
): Promise<StaffResult> {
  const hashed = await hashPassword(password);

  const res = await prisma.user.updateMany({
    where: { id: userId, role: { in: [...ASSIGNABLE_ROLES] } },
    data: { password: hashed, failedLogins: 0, lockedUntil: null },
  });
  if (res.count === 0) return NOT_FOUND;

  // পুরোনো লগইন বাতিল
  await prisma.session.deleteMany({ where: { userId } });
  return { ok: true };
}