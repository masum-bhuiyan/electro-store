import { isStaffRole } from "@/lib/permissions";
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

  // কর্মচারী role (মালিক, ম্যানেজার, সেলস, একাউন্টস), সক্রিয় এবং পাসওয়ার্ড আছে, এমন কেউই ঢুকতে পারবে
  const staff =
    user && isStaffRole(user.role) && user.isActive && user.password
      ? user
      : null;

  // কর্মচারী না পেলেও একই সময় নেওয়ার জন্য নকল hash দিয়ে মেলাই
  const hash = staff?.password ?? (await getDummyHash());
  const passwordOk = await verifyPassword(password, hash);

  if (!staff) return false;

  // লক থাকলে সঠিক পাসওয়ার্ডেও ঢোকা যাবে না
  if (staff.lockedUntil && staff.lockedUntil > now) return false;

  if (!passwordOk) {
    const updated = await prisma.user.update({
      where: { id: staff.id },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });

    if (updated.failedLogins >= MAX_FAILS) {
      await prisma.user.update({
        where: { id: staff.id },
        data: {
          failedLogins: 0,
          lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60 * 1000),
        },
      });
    }
    return false;
  }

  await prisma.user.update({
    where: { id: staff.id },
    data: { failedLogins: 0, lockedUntil: null },
  });
  await createSession(staff.id);
  return true;
}