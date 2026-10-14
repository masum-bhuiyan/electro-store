import { prisma } from "@/lib/prisma";
import { getDummyHash, verifyPassword } from "@/lib/password";
import { createSession } from "./session";

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

// সফল হলে true, যেকোনো কারণে ব্যর্থ হলে false (কারণ বাইরে বোঝানো হয় না)
export async function loginAdmin(
  email: string,
  password: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  const now = new Date();

  // অ্যাডমিন ছাড়া বা পাসওয়ার্ডবিহীন কেউ ঢুকতে পারবে না
  const admin = user && user.role === "ADMIN" && user.password ? user : null;

  // অ্যাডমিন না পেলেও একই সময় নেওয়ার জন্য নকল hash দিয়ে মেলাই
  const hash = admin?.password ?? (await getDummyHash());
  const passwordOk = await verifyPassword(password, hash);

  if (!admin) return false;

  // লক থাকলে সঠিক পাসওয়ার্ডেও ঢোকা যাবে না
  if (admin.lockedUntil && admin.lockedUntil > now) return false;

  if (!passwordOk) {
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });

    if (updated.failedLogins >= MAX_FAILS) {
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          failedLogins: 0,
          lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60 * 1000),
        },
      });
    }
    return false;
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { failedLogins: 0, lockedUntil: null },
  });
  await createSession(admin.id);
  return true;
}