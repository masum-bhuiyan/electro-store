import "dotenv/config";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

// পাসওয়ার্ড টাইপ করার সময় পর্দায় অক্ষর দেখায় না
function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") process.exit(1); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  if (!stdin.isTTY) {
    throw new Error("এই স্ক্রিপ্ট সরাসরি টার্মিনালে চালাতে হবে।");
  }

  const name = await ask("নাম: ");
  const email = (await ask("ইমেইল: ")).toLowerCase();
  const password = await askHidden("পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর): ");
  const again = await askHidden("পাসওয়ার্ড আবার লিখুন: ");

  if (name.length < 2) throw new Error("নাম খুব ছোট।");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ইমেইল ঠিক নয়।");
  if (password.length < 10) throw new Error("পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।");
  if (password.length > 200) throw new Error("পাসওয়ার্ড অনেক বড়।");
  if (password !== again) throw new Error("দুইবারের পাসওয়ার্ড মেলেনি।");

  const hashed = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: { name, email, password: hashed, role: "ADMIN" },
    update: { name, password: hashed, role: "ADMIN", failedLogins: 0, lockedUntil: null },
  });

  // পাসওয়ার্ড বদলালে পুরোনো সব লগইন বাতিল
  await prisma.session.deleteMany({ where: { userId: user.id } });

  console.log(`✅ অ্যাডমিন প্রস্তুত: ${user.email}`);
}

main()
  .catch((e) => {
    console.error("❌", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());