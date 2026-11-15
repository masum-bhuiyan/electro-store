import CartDrawer from "@/components/store/cartDrawer";
import Footer from "@/components/store/footer";
import Header from "@/components/store/header";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-8">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}