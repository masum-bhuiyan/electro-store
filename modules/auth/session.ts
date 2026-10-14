import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

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

export type AdminUser = { id: string; name: string; email: string | null };

// cache() দিয়ে মুড়েছি: একই অনুরোধে layout আর page দুজনে ডাকলেও ডাটাবেসে একবারই যায়
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token || token.length > 100) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) return null;
  if (session.user.role !== "ADMIN") return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
});

// অ্যাডমিন না হলে লগইন পেজে পাঠায়। প্রতিটা অ্যাডমিন পেজ ও Server Action-এর শুরুতে ডাকুন
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}