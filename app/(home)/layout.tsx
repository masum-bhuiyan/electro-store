import CartDrawer from "@/components/store/cartDrawer";
import Footer from "@/components/store/footer";
import Header from "@/components/store/header";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}