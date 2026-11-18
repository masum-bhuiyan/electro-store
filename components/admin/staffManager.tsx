"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  changeStaffRoleAction,
  createStaffAction,
  resetStaffPasswordAction,
  setStaffActiveAction,
  updateStaffAccessAction,
} from "@/app/(admin)/admin/(panel)/staff/actions";
import {
  ASSIGNABLE_ROLES,
  GRANTABLE_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  isAssignableRole,
  isGrantablePermission,
  roleDefaults,
  type Permission,
} from "@/lib/permissions";
import type { StaffResult, StaffRow } from "@/modules/staff/admin";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

const NETWORK_ERROR = "সংযোগে সমস্যা হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "SALES" as string,
  password: "",
};

type Credentials = { name: string; email: string; password: string };

// 0/O, 1/l/I-এর মতো গুলিয়ে যাওয়া অক্ষর বাদ দিয়েছি
const PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// "বানিয়ে দিন" বোতামের জন্য। ব্রাউজারের নিরাপদ random ব্যবহার করে
function makePassword(length = 12): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => PASSWORD_CHARS[n % PASSWORD_CHARS.length]).join("");
}

export default function StaffManager({
  staff,
  currentUserId,
}: {
  staff: StaffRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [accessId, setAccessId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Permission[]>([]);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function showCreds(value: Credentials) {
    setCreds(value);
    setCopied(false);
  }

  async function copyCreds() {
    if (!creds) return;
    const text = [
      "Bhuiyan Tools অ্যাডমিন লগইন",
      `লিংক: ${window.location.origin}/admin/login`,
      `ইমেইল: ${creds.email}`,
      `পাসওয়ার্ড: ${creds.password}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("কপি করা যায়নি। তথ্যটা হাতে লিখে নিন।");
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrors({});
    setError(null);
    setMessage(null);
    setCreds(null);

    try {
      const result = await createStaffAction(form);
      if (result.ok) {
        showCreds({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        setMessage("✅ কর্মচারী যোগ হয়েছে।");
        setForm(emptyForm);
        router.refresh();
        return;
      }
      setError(result.message);
      if (result.errors) setErrors(result.errors);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setSaving(false);
    }
  }

  // কাজ চালায়। ফলাফল ফেরত দেয় (নেটওয়ার্ক সমস্যায় null)
  async function run(
    id: string,
    action: () => Promise<StaffResult>,
    okMessage: string
  ): Promise<StaffResult | null> {
    if (busyId) return null;
    setBusyId(id);
    setError(null);
    setMessage(null);

    try {
      const result = await action();
      if (result.ok) setMessage(okMessage);
      else setError(result.message);
      router.refresh();
      return result;
    } catch {
      setError(NETWORK_ERROR);
      return null;
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(row: StaffRow) {
    if (row.isActive) {
      const sure = window.confirm(
        `"${row.name}"-এর অ্যাকাউন্ট বন্ধ করবেন? তার সব লগইন বাতিল হবে। পরে আবার চালু করা যাবে।`
      );
      if (!sure) return;
    }
    await run(
      row.id,
      () => setStaffActiveAction(row.id, !row.isActive),
      row.isActive ? "✅ অ্যাকাউন্ট বন্ধ করা হয়েছে।" : "✅ অ্যাকাউন্ট চালু করা হয়েছে।"
    );
  }

  async function handleReset(row: StaffRow) {
    const sure = window.confirm(
      `"${row.name}"-এর পাসওয়ার্ড বদলাবেন? পুরোনো পাসওয়ার্ড ও সব লগইন বাতিল হবে।`
    );
    if (!sure) return;

    setCreds(null);
    const result = await run(
      row.id,
      () => resetStaffPasswordAction(row.id, resetPw),
      "✅ পাসওয়ার্ড বদলানো হয়েছে।"
    );
    if (result && result.ok) {
      showCreds({ name: row.name, email: row.email ?? "", password: resetPw });
      setResetId(null);
      setResetPw("");
    }
  }

  function openAccess(row: StaffRow) {
    if (accessId === row.id) {
      setAccessId(null);
      return;
    }
    setResetId(null);
    setAccessId(row.id);
    setDraft(row.effective.filter(isGrantablePermission));
  }

  function openReset(row: StaffRow) {
    if (resetId === row.id) {
      setResetId(null);
      return;
    }
    setAccessId(null);
    setResetId(row.id);
    setResetPw("");
  }

  function toggleDraft(p: Permission) {
    setDraft((d) => (d.includes(p) ? d.filter((x) => x !== p) : [...d, p]));
  }

  async function handleSaveAccess(row: StaffRow) {
    const result = await run(
      row.id,
      () => updateStaffAccessAction(row.id, draft),
      "✅ অ্যাক্সেস সংরক্ষণ হয়েছে।"
    );
    if (result && result.ok) setAccessId(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-bold">নতুন কর্মচারী</h2>
        <p className="mb-4 text-xs text-gray-500">
          পাসওয়ার্ড আপনি নিজে লিখুন, অথবা "বানিয়ে দিন" চাপুন।
        </p>

        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">নাম</span>
            <input
              type="text"
              value={form.name}
              maxLength={80}
              onChange={(e) => setField("name", e.target.value)}
              className={inputClass}
            />
            {errors.name && (
              <span className="mt-1 block text-xs text-red-600">{errors.name}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              ইমেইল (এটাই ইউজারনেম)
            </span>
            <input
              type="email"
              value={form.email}
              maxLength={100}
              onChange={(e) => setField("email", e.target.value)}
              className={inputClass}
            />
            {errors.email && (
              <span className="mt-1 block text-xs text-red-600">{errors.email}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              ফোন (ঐচ্ছিক)
            </span>
            <input
              type="tel"
              value={form.phone}
              maxLength={20}
              onChange={(e) => setField("phone", e.target.value)}
              className={inputClass}
            />
            {errors.phone && (
              <span className="mt-1 block text-xs text-red-600">{errors.phone}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">role</span>
            <select
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              className={inputClass}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            {errors.role && (
              <span className="mt-1 block text-xs text-red-600">{errors.role}</span>
            )}
          </label>

          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.password}
                maxLength={200}
                autoComplete="off"
                onChange={(e) => setField("password", e.target.value)}
                className={`${inputClass} font-mono`}
              />
              <button
                type="button"
                onClick={() => setField("password", makePassword())}
                className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                বানিয়ে দিন
              </button>
            </div>
            {errors.password && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.password}
              </span>
            )}
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
            >
              {saving ? "..." : "+ কর্মচারী যোগ করুন"}
            </button>
          </div>
        </form>
      </section>

      {creds && (
        <section className="rounded-lg border-2 border-green-600 bg-green-50 p-5 text-sm">
          <h2 className="mb-2 text-lg font-bold text-green-900">
            {creds.name}-এর লগইন তথ্য
          </h2>
          <p className="font-mono">ইমেইল: {creds.email}</p>
          <p className="font-mono text-base font-bold">
            পাসওয়ার্ড: {creds.password}
          </p>
          <p className="mt-3 font-medium text-red-700">
            পাসওয়ার্ড পরে আর দেখা যাবে না। কপি করে কর্মচারীকে দিন। ভুলে গেলে নতুন
            পাসওয়ার্ড দিতে হবে।
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyCreds}
              className="rounded-md bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800"
            >
              {copied ? "✅ কপি হয়েছে" : "কপি করুন"}
            </button>
            <button
              type="button"
              onClick={() => setCreds(null)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
            >
              লুকান
            </button>
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold">সবার তালিকা ({staff.length})</h2>

        <ul className="divide-y divide-gray-200 text-sm">
          {staff.map((row) => {
            const isOwner = row.role === "ADMIN";
            const isMe = row.id === currentUserId;
            const busy = busyId === row.id;

            return (
              <li key={row.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {row.name}
                      {isMe && <span className="ml-2 text-xs text-gray-500">(আপনি)</span>}
                      {!row.isActive && (
                        <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                          বন্ধ
                        </span>
                      )}
                      {row.hasCustomAccess && (
                        <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                          আলাদা অ্যাক্সেস
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      ইমেইল: {row.email ?? "—"}
                      {row.phone ? ` · ফোন: ${row.phone}` : ""}
                    </p>
                  </div>

                  {isOwner ? (
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
                      {ROLE_LABELS.ADMIN}
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={row.role}
                        disabled={busy}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!isAssignableRole(value)) return;
                          if (
                            row.hasCustomAccess &&
                            !window.confirm(
                              "role বদলালে এর আলাদা অ্যাক্সেস মুছে নতুন role-এর ডিফল্টে ফিরবে। চালিয়ে যাবেন?"
                            )
                          ) {
                            return;
                          }
                          setAccessId(null);
                          run(
                            row.id,
                            () => changeStaffRoleAction(row.id, value),
                            "✅ role বদলানো হয়েছে।"
                          );
                        }}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openAccess(row)}
                        className="text-gray-600 hover:text-blue-600 disabled:opacity-50"
                      >
                        অ্যাক্সেস
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openReset(row)}
                        className="text-gray-600 hover:text-blue-600 disabled:opacity-50"
                      >
                        পাসওয়ার্ড বদলান
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleActive(row)}
                        className={
                          row.isActive
                            ? "text-gray-600 hover:text-red-600 disabled:opacity-50"
                            : "text-green-700 hover:underline disabled:opacity-50"
                        }
                      >
                        {row.isActive ? "বন্ধ করুন" : "চালু করুন"}
                      </button>
                    </div>
                  )}
                </div>

                {resetId === row.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={resetPw}
                      maxLength={200}
                      autoComplete="off"
                      placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)"
                      onChange={(e) => setResetPw(e.target.value)}
                      className={`${inputClass} max-w-xs font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setResetPw(makePassword())}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      বানিয়ে দিন
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleReset(row)}
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600"
                    >
                      সংরক্ষণ
                    </button>
                  </div>
                )}

                {accessId === row.id && (
                  <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-3 text-xs text-gray-600">
                      টিক দেওয়া কাজগুলো {row.name} করতে পারবে। কিছু অনুমতি (কাস্টমার,
                      POS, কেনা, টাকা-পয়সা, রিপোর্ট) সেই সেই ধাপ বানানোর পর কাজ করবে।
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {GRANTABLE_PERMISSIONS.map((p) => (
                        <label key={p} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={draft.includes(p)}
                            onChange={() => toggleDraft(p)}
                            className="h-4 w-4"
                          />
                          <span>{PERMISSION_LABELS[p]}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleSaveAccess(row)}
                        className="rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600"
                      >
                        সংরক্ষণ
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setDraft(roleDefaults(row.role).filter(isGrantablePermission))
                        }
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50"
                      >
                        {ROLE_LABELS[row.role]}-এর ডিফল্টে ফেরান
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-gray-500">
          মালিকের নতুন অ্যাকাউন্ট বা পাসওয়ার্ড বদলাতে টার্মিনালে{" "}
          <code className="font-mono">npm run create-admin</code> চালাতে হয়।
        </p>
      </section>
    </div>
  );
}