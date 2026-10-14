import type { Metadata } from "next";

// পুরো অ্যাডমিন এলাকা Google-এর তালিকা থেকে আড়ালে
export const metadata: Metadata = {
  title: "অ্যাডমিন | Electro Store",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}