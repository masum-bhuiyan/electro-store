export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Electro Store। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}