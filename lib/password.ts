import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// scrypt-এর সেটিংস। এগুলো hash-এর ভেতরেই লেখা থাকে, তাই পরে বাড়ানো যাবে
const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 64;

function derive(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, { N: n, r, p }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0)) return false;

  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (expected.length !== KEY_LEN) return false;

  try {
    const actual = await derive(password, salt, n, r, p);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ইমেইল ভুল হলেও পাসওয়ার্ড মেলানোর সমান সময় খরচ করার জন্য একটা নকল hash
let dummyHash: Promise<string> | null = null;
export function getDummyHash(): Promise<string> {
  if (!dummyHash) dummyHash = hashPassword("not-a-real-password");
  return dummyHash;
}