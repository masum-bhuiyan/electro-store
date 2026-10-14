import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/loginForm";
import { getCurrentAdmin } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // আগেই লগইন করা থাকলে আবার ফর্ম দেখানোর দরকার নেই
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">অ্যাডমিন লগইন</h1>
        <LoginForm />
      </div>
    </div>
  );
}