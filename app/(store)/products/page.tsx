import ProductCard from "@/components/store/productCard";
import { getProducts } from "@/modules/products/queries";

// আপাতত প্রতিবার ডাটাবেস থেকে নতুন ডাটা আনবে। ক্যাশিং দিন ১৩-তে করব।
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">সব প্রোডাক্ট</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">এখনো কোনো প্রোডাক্ট নেই।</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}