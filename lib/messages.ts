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
    detail: {
    description: "Description",
    specs: "Specifications",
    model: "Model",
    warranty: (months: number) => `${months}-month warranty`,
    related: "Related Products",
    notFound: "Product not found",
    image: (n: number) => `Image ${n}`,
    prevImage: "Previous image",
    nextImage: "Next image",
  },
    list: {
    title: "All Products",
    metaDescription:
      "Browse original mobile repair tools: soldering stations, microscopes, testing equipment and more. Cash on delivery across Bangladesh.",
    searchLabel: "Search products",
    searchPlaceholder: "Search tools, brands…",
    search: "Search",
    clear: "Clear",
    resultsFor: (q: string) => `Results for “${q}”`,
    noResults: (q: string) => `No products found for “${q}”. Try another word or browse a category.`,
    noProducts: "No products yet.",
  },
    cart: {
    title: "Your Cart",
    loading: "Loading cart…",
    empty: "Your cart is empty.",
    startShopping: "Start shopping",
    continueShopping: "Continue shopping",
    summary: "Order Summary",
    subtotal: "Subtotal",
    shippingNote: "Delivery charge is added at checkout.",
    checkout: "Proceed to Checkout",
    cod: "Cash on delivery available",
    clear: "Clear cart",
    remove: "Remove",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    maxReached: "Max quantity reached",
    items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
        label: "Cart",
    open: (n: number) =>
      n > 0 ? `Open cart, ${n} ${n === 1 ? "item" : "items"}` : "Open cart",
    close: "Close cart",
    alsoBuy: "Customers also buy",
    add: "+ Add",
    addNamed: (name: string) => `Add ${name} to cart`,
    removeNamed: (name: string) => `Remove ${name} from cart`,
  },
    checkout: {
    title: "Checkout",
    loading: "Loading…",
    verifying: "Checking your cart…",
    empty: "Your cart is empty.",
    startShopping: "Start shopping",
    loadFail: "Could not load your cart.",
    retry: "Try again",
    deliveryDetails: "Delivery details",
    name: "Your name",
    phone: "Mobile number",
    phonePlaceholder: "01XXXXXXXXX",
    address: "Full address",
    addressPlaceholder: "House / road, area, district",
    area: "Delivery area",
    insideDhaka: "Inside Dhaka",
    outsideDhaka: "Outside Dhaka",
    chooseArea: "Choose delivery area",
    heavyNote:
      "Delivery charge may be higher for heavy items. We will confirm with you before shipping.",
    remember: "Remember my details on this device",
    payment: "Payment method",
    codTitle: "Cash on delivery",
    codText: "Pay when you receive your order.",
    summary: "Order Summary",
    subtotal: "Subtotal",
    delivery: "Delivery",
    total: "Total",
    placeOrder: "Place Order",
    placing: "Placing order…",
    backToCart: "Back to cart",
    changed: "Some items in your cart changed:",
    gone: (name: string) => `"${name}" is no longer available and was removed from your cart.`,
    outOfStock: (name: string) => `"${name}" is out of stock and was removed from your cart.`,
    reduced: (name: string, n: number) =>
      `Only ${n} of "${name}" in stock, so the quantity was reduced.`,
    priceChanged: (name: string, price: string) =>
      `The price of "${name}" changed to ${price}.`,
    networkError: "Connection problem. Please check your internet and try again.",
    received: "Order received",
    orderNumber: "Order number",
    opening: "Opening confirmation page…",
    notOpening: "Click here if it does not open",
  },
    success: {
    metaTitle: "Order Received",
    title: "Your order has been received",
    text: "Thank you for shopping with us. We will call you shortly to confirm your order.",
    orderNumber: "Order number",
    totalLine: (total: string, method: string) => `Total ${total} · ${method}`,
    saveNote:
      "Please save your order number or take a screenshot. You will need it together with your mobile number to track your order.",
    track: "Track Order",
    continueShopping: "Continue Shopping",
    help: "Need help with this order?",
    whatsapp: "WhatsApp Us",
    whatsappMessage: (orderNumber: string) =>
      `Hello, I placed order ${orderNumber}. I need help.`,
  },
  track: {
    metaTitle: "Track Your Order",
    title: "Track Your Order",
    intro: "Enter your order number and the mobile number you used when ordering.",
    orderNumber: "Order number",
    orderPlaceholder: "ES-261010-K7M3QX",
    phone: "Mobile number",
    phonePlaceholder: "01XXXXXXXXX",
    submit: "Track Order",
    searching: "Searching…",
    networkError: "Connection problem. Please check your internet and try again.",
    placedOn: "Placed on",
    cancelled: "This order has been cancelled.",
    itemTimes: (price: string, qty: number) => `${price} × ${qty}`,
    subtotal: "Subtotal",
    delivery: "Delivery",
    total: "Total",
    payment: "Payment",
    helpText: "Questions about your order? Message us with your order number.",
    whatsapp: "WhatsApp Us",
    whatsappMessage: (orderNumber: string) =>
      `Hello, I want to ask about order ${orderNumber}.`,
    continueShopping: "Continue shopping",
    status: {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    },
    paymentStatus: {
      UNPAID: "Unpaid",
      PAID: "Paid",
      FAILED: "Failed",
      REFUNDED: "Refunded",
    },
    paymentMethod: {
      COD: "Cash on delivery",
      BKASH: "bKash",
      NAGAD: "Nagad",
      CARD: "Card",
    },
  },
    footer: {
    tagline: "Original Tools. Honest Price.",
    address: "4/148, Gulistan Shopping Complex (5th Floor), Dhaka-1000",
    hours: "Saturday – Thursday, 10:00 AM – 8:00 PM",
    call: "Call",
    email: "Email",
    follow: "Follow us",
    facebook: "Facebook",
    youtube: "YouTube",
    policies: "Policies",
    delivery: "Delivery Rules",
    refund: "Refund & Warranty",
    complaint: "Complaint",
    company: "Company",
    about: "About Us",
    founder: "Meet the Founder",
    contact: "Contact",
    rights: (year: number, name: string) =>
      `© ${year} ${name}. All rights reserved.`,
  },
  floatWhatsapp: {
    label: "Chat with us on WhatsApp",
    message: "Hello, I need help with a product.",
  },
    pages: {
    delivery: {
      title: "Delivery Rules",
      metaDescription:
        "Delivery time, delivery charge and courier options for orders from Bhuiyan Tools across Bangladesh.",
      intro:
        "We deliver original mobile repair tools to every district of Bangladesh.",
      sections: (inside: string, outside: string) => [
        {
          heading: "Delivery time",
          bullets: [
            "Inside Dhaka: 1–3 days",
            "Outside Dhaka: 2–5 days",
            "The time is counted after we confirm your order by phone.",
          ],
        },
        {
          heading: "Delivery charge",
          bullets: [
            `Inside Dhaka: ${inside}`,
            `Outside Dhaka: ${outside}`,
            "Heavy or large items may cost more. We will tell you and confirm with you before shipping.",
          ],
        },
        {
          heading: "Courier",
          paragraphs: [
            "We can send your order with any courier service, such as Pathao or Sundarban, as you prefer. Tell us your preferred courier when we call to confirm your order.",
          ],
        },
        {
          heading: "Order confirmation",
          paragraphs: [
            "After you place an order, we call the mobile number you gave to confirm it. Please keep your phone on and reachable.",
          ],
        },
        {
          heading: "Cash on delivery",
          paragraphs: [
            "You pay when you receive your order. Please check that the parcel is not damaged before you accept it.",
          ],
        },
      ],
    },
    refund: {
      title: "Refund & Warranty",
      metaDescription:
        "Warranty, return, replacement and refund rules for products bought from Bhuiyan Tools.",
      intro:
        "We sell original products and stand behind them. Here is how warranty, replacement and refund work.",
      sections: [
        {
          heading: "Warranty",
          paragraphs: [
            "Many products come with a warranty. When a product has one, the warranty period is shown on its product page.",
          ],
        },
        {
          heading: "What warranty covers",
          bullets: [
            "Manufacturing faults under normal use.",
            "Not covered: physical damage, burn marks, liquid damage, wrong use, or products opened or repaired by someone else.",
          ],
        },
        {
          heading: "Wrong, damaged or defective items",
          paragraphs: [
            "If you receive a wrong, damaged or defective item, contact us within 3 days of delivery. We will replace it or help you with a solution.",
          ],
        },
        {
          heading: "How to make a claim",
          bullets: [
            "Contact us on WhatsApp or by phone with your order number.",
            "Send clear photos or a short video showing the problem.",
            "Keep the box, accessories and invoice until the case is closed.",
          ],
        },
        {
          heading: "Refund",
          paragraphs: [
            "If a replacement is not possible, we will refund the price of the item after we receive and check it. We will tell you the refund method when we confirm your claim.",
          ],
        },
        {
          heading: "Not accepted",
          bullets: [
            "Used items or items with missing accessories.",
            "Opened consumables such as flux or glue, unless they are defective.",
          ],
        },
      ],
    },
    complaint: {
      title: "Complaint",
      metaDescription:
        "How to send a complaint to Bhuiyan Tools and what happens next.",
      intro:
        "We take every complaint seriously. If something went wrong, please tell us so we can fix it.",
      sections: [
        {
          heading: "How to send a complaint",
          bullets: [
            "Contact us by WhatsApp, phone or email.",
            "Include your order number and the mobile number you used to order.",
            "Describe the problem and attach photos or a short video if you can.",
          ],
        },
        {
          heading: "What happens next",
          bullets: [
            "We note your complaint and check the order.",
            "We aim to reply within 24 hours during opening hours.",
            "We then offer a solution: replacement, repair help or refund, depending on the case.",
          ],
        },
      ],
      contactTitle: "Contact us",
    },
    about: {
      title: "About Us",
      metaDescription:
        "Bhuiyan International & Telecom has supplied original mobile repair tools from Gulistan, Dhaka since 2015.",
      intro:
        "Bhuiyan International & Telecom is a mobile repair tools shop in Gulistan, Dhaka. We have served technicians since 2015, and now serve them online as Bhuiyan Tools.",
      sections: [
        {
          heading: "What we sell",
          paragraphs: [
            "More than 130 types of professional repair tools: microscopes, hot air guns, soldering and rework stations, DC power supplies, multimeters, PCB tools, hand tools and consumables.",
          ],
        },
        {
          heading: "Who we serve",
          paragraphs: [
            "Mobile repair technicians, students, service centers and training institutes, from new learners to experienced professionals.",
          ],
        },
        {
          heading: "Why customers trust us",
          bullets: [
            "100% original products from authorized brands.",
            "Honest prices, with cash on delivery.",
            "Delivery across Bangladesh with the courier you prefer.",
            "Help before and after you buy, by phone and WhatsApp.",
          ],
        },
        {
          heading: "Visit our shop",
          paragraphs: [
            "You are welcome to see the tools in person at our Gulistan shop. Address and opening hours are on our Contact page.",
          ],
        },
      ],
      founderLink: "Meet the founder",
    },
    founder: {
      title: "Meet the Founder",
      metaDescription:
        "Kofil Uddin, founder of Bhuiyan International & Telecom, on how he built a trusted mobile repair tools business.",
      intro: "Kofil Uddin, Founder of Bhuiyan International & Telecom",
      photoAlt: "Kofil Uddin, founder of Bhuiyan International & Telecom",
      quote:
        "“A good tool gives a technician time, trust and respect, all three. My journey started from this belief.”",
      sections: [
        {
          heading: "How it began",
          paragraphs: [
            "I am Kofil Uddin. After finishing my studies I came to Dhaka, and around 2010 my interest in mobile servicing tools began. The sector was not as organized as it is today. Finding correct information and recognizing good tools was mostly a struggle of learning on my own.",
          ],
        },
        {
          heading: "Years of learning by doing",
          paragraphs: [
            "For about five years I worked in different shops in Dhaka, directly with mobile repair tools. That is when I learned which tools truly work and which are good only in name. I talked to technicians every day, saw their problems and used the tools with my own hands. That real experience is my foundation today.",
          ],
        },
        {
          heading: "Starting on my own, 2015",
          paragraphs: [
            "With that experience I opened my own small shop in 2015, with a few products. The start was not easy. But I knew I had something many others did not: a deep, practical understanding of the sector.",
            "I talked to every customer from that understanding: which tool they really needed and which they could skip. Slowly people noticed, and my customers kept growing.",
          ],
        },
        {
          heading: "Customers outside Dhaka and WhatsApp",
          paragraphs: [
            "The best part was that many technicians outside Dhaka started to reach me, not in person but on WhatsApp. They asked for product photos and advice, then placed orders. This relationship is very valuable to me, because it shows people came to me for trust, not only because they saw a shop.",
          ],
        },
        {
          heading: "YouTube, 2020",
          paragraphs: [
            "Around 2020, customers kept asking about new products. I realized that sharing this information in videos would help many more people, so I started making videos about new products.",
            "Today my channel has 100+ videos and about 3,000 subscribers who come for new tools, reviews and advice.",
          ],
        },
        {
          heading: "Website and blog, 2025",
          paragraphs: [
            "In 2025 I launched Bhuiyantools.com so that a technician from any corner of the country can find me easily and order after seeing products from a distance, even by sending a screenshot.",
            "In the blog I share what I learned over 15 years: which tool is needed when, who it suits, and how beginners can start. I want what you read to come from real experience, not information copied from the internet.",
          ],
        },
        {
          heading: "Bhuiyan Tools today",
          paragraphs: [
            "Today Bhuiyan International & Telecom serves the mobile repair community of Bangladesh with 130+ types of professional repair tools, for new students, experienced technicians and service centers.",
            "What matters most to me is still the same: the tool I sell should be one I would trust in my own hands.",
          ],
        },
      ],
      contactTitle: "Contact me directly",
      watch: "Watch on YouTube",
    },
    contact: {
      title: "Contact Us",
      metaDescription:
        "Call, WhatsApp, email or visit Bhuiyan Tools in Gulistan, Dhaka.",
      intro:
        "Questions about a product or an order? Reach us in the way that is easiest for you.",
      whatsappMessage: "Hello, I have a question.",
      cards: {
        call: "Call",
        whatsapp: "WhatsApp",
        whatsappText: "Chat with us",
        email: "Email",
        visit: "Visit our shop",
        follow: "Follow us",
      },
    },
  },
    brands: {
    title: "Authorized Brands",
  },
  videos: {
    title: "Watch & Learn",
    text: "Real demos and honest reviews on our YouTube channel, made for technicians.",
    channel: "Watch on YouTube",
    defaultTitle: "video",
    play: (title: string) => `Play ${title}`,
    prev: "Previous videos",
    next: "Next videos",
  },
} as const;