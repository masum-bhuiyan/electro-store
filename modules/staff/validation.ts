import {
  isAssignableRole,
  isGrantablePermission,
  type AssignableRole,
  type Permission,
} from "@/lib/permissions";

export type NewStaffInput = {
  name: string;
  email: string;
  phone: string | null;
  role: AssignableRole;
  password: string;
};

type Errors = Record<string, string>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// 01XXXXXXXXX রূপে আনে। ঠিক না হলে null
function normalizePhone(raw: string): string | null {
  let p = raw.replace(/[\s-]/g, "");
  if (p.startsWith("+880")) p = "0" + p.slice(4);
  else if (p.startsWith("880") && p.length === 13) p = "0" + p.slice(3);
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

export function validatePassword(
  value: unknown
): { ok: true; value: string } | { ok: false; message: string } {
  const password = str(value);
  if (password.length < 10) {
    return { ok: false, message: "পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।" };
  }
  if (password.length > 200) {
    return { ok: false, message: "পাসওয়ার্ড অনেক বড়।" };
  }
  return { ok: true, value: password };
}

export function validateNewStaff(
  payload: unknown
): { ok: true; data: NewStaffInput } | { ok: false; errors: Errors } {
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  const errors: Errors = {};

  const name = str(input.name).trim();
  if (name.length < 2 || name.length > 80) {
    errors.name = "নাম ২ থেকে ৮০ অক্ষরের মধ্যে হতে হবে।";
  }

  const email = str(input.email).trim().toLowerCase();
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "ইমেইল ঠিক নয়।";
  }

  const phoneRaw = str(input.phone).trim();
  let phone: string | null = null;
  if (phoneRaw) {
    phone = normalizePhone(phoneRaw);
    if (!phone) errors.phone = "ফোন নম্বর ঠিক নয় (যেমন 01712345678)।";
  }

  const role = input.role;
  if (!isAssignableRole(role)) errors.role = "role বেছে নিন।";

  const pw = validatePassword(input.password);
  if (!pw.ok) errors.password = pw.message;

  if (Object.keys(errors).length > 0 || !isAssignableRole(role) || !pw.ok) {
    return { ok: false, errors };
  }
  return { ok: true, data: { name, email, phone, role, password: pw.value } };
}

// চেকবক্স থেকে আসা অনুমতির তালিকা। মালিক-শুধু অনুমতি এলে পুরোটাই বাতিল
export function validateAccess(
  payload: unknown
): { ok: true; permissions: Permission[] } | { ok: false } {
  if (!Array.isArray(payload) || payload.length > 50) return { ok: false };

  const result: Permission[] = [];
  for (const item of payload) {
    if (!isGrantablePermission(item)) return { ok: false };
    if (!result.includes(item)) result.push(item);
  }
  return { ok: true, permissions: result };
}