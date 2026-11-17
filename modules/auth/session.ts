import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  hasPermission,
  isStaffRole,
  type Permission,
  type StaffRole,
} from "@/lib/permissions";

const COOKIE_NAME = "es_session";
const SESSION_DAYS = 7;

// ডাটাবেসে আসল token নয়, তার ছাপ রাখি। ডাটাবেস ফাঁস হলেও কেউ লগইন করতে পারবে না
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  // মেয়াদ শেষ হওয়া পুরোনো session মুছে ফেলি (ডাটাবেস পরিষ্কার রাখতে)
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(COOKIE_NAME);
}

export type StaffUser = {
  id: string;
  name: string;
  email: string | null;
  role: StaffRole;
};

// আগের নামটা রেখেছি, যাতে পুরোনো ফাইলের import না ভাঙে
export type AdminUser = StaffUser;

// যেকোনো সক্রিয় কর্মচারী (মালিক, ম্যানেজার, সেলস, একাউন্টস)।
// cache() দিয়ে মুড়েছি: একই অনুরোধে layout আর page দুজনে ডাকলেও ডাটাবেসে একবারই যায়
export const getCurrentStaff = cache(async (): Promise<StaffUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token || token.length > 100) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) return null;
  // বন্ধ করা কর্মচারীর পুরোনো session দিয়েও ঢোকা যাবে না
  if (!session.user.isActive) return null;
  // CUSTOMER role-এর কেউ কখনো অ্যাডমিনে ঢুকতে পারবে না
  if (!isStaffRole(session.user.role)) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
});

// শুধু মালিক (ADMIN)। আগের আচরণ অপরিবর্তিত
export const getCurrentAdmin = cache(async (): Promise<StaffUser | null> => {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "ADMIN") return null;
  return staff;
});

// মালিক না হলে লগইন পেজে পাঠায়। বিদ্যমান সব অ্যাডমিন পেজ ও Server Action এটাই ডাকছে
export async function requireAdmin(): Promise<StaffUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

// যেকোনো কর্মচারী হলেই চলবে (ধাপ ১D থেকে ব্যবহার হবে)
export async function requireStaff(): Promise<StaffUser> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

// নির্দিষ্ট অনুমতি না থাকলে ড্যাশবোর্ডে ফেরত পাঠায় (ধাপ ১D থেকে ব্যবহার হবে)
export async function requirePermission(
  permission: Permission
): Promise<StaffUser> {
  const staff = await requireStaff();
  if (!hasPermission(staff.role, permission)) redirect("/admin");
  return staff;
}