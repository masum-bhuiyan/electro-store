// সাইটের ইংরেজি লেখা এক জায়গায়। পরে bn যোগ করলেই বাংলা হবে।
export const en = {
  shopName: "Bhuiyan Tools",
  nav: { shop: "Shop", track: "Track Order" },
  hero: {
    eyebrow: "MOBILE REPAIR TOOLS · BANGLADESH",
    title1: "Original Tools.",
    title2: "Honest Price.",
    text: "Trusted by technicians since 2015. Authorized dealer of Sugon, ATTEN, Mechanic and more. One-click order, delivery across Bangladesh.",
    shop: "Shop Now",
    whatsapp: "WhatsApp Us",
  },
  trust: [
    { icon: "shield", title: "100% Original", text: "Authorized dealer" },
    { icon: "cash", title: "Cash on Delivery", text: "Pay when you receive" },
    { icon: "truck", title: "Delivery Nationwide", text: "All districts" },
    { icon: "help", title: "After-sales Support", text: "Replace or help" },
  ],
    home: {
    featured: "Featured Products",
    latest: "New Arrivals",
    viewAll: "View all",
    empty: "Products are coming soon.",
    track: "Check your order status",
  },
    product: {
    chooseOption: "Choose option",
    buyNow: "Buy Now",
    addToCart: "Add to Cart",
    maxInCart: "Max quantity in cart",
    outOfStock: "Out of stock",
    inStock: "In stock",
    onlyLeft: (n: number) => `Only ${n} left`,
    off: (n: number) => `${n}% OFF`,
    inCart: (n: number) => `In your cart: ${n}`,
    viewCart: "View cart",
    whatsapp: "Order on WhatsApp",
    whatsappMessage: (name: string, option: string, price: string, url: string) =>
      `Hello, I want to order:\n${name} (${option})\nPrice: ${price}\n${url}`,
  },
    card: {
    original: "Original",
    addToCart: "Add to cart",
    added: "Added to cart",
  },
    category: {
    shopBy: "Shop by Category",
    allProducts: "All Products",
    all: "All",
    home: "Home",
    products: (n: number) => `${n} ${n === 1 ? "product" : "products"}`,
    found: (n: number) => `${n} ${n === 1 ? "product" : "products"} found`,
    empty: "No products in this category yet.",
    browseAll: "Browse all products",
    metaDescription: (name: string) =>
      `Buy original ${name} for mobile repair at honest prices. Cash on delivery across Bangladesh.`,
  },
  pagination: {
    label: "Pagination",
    prev: "Previous",
    next: "Next",
  },
} as const;