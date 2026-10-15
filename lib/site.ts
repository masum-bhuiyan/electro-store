// সাইটের আসল ঠিকানা। Hostinger-এর hPanel-এ SITE_URL env দিন (নিজের ডোমেইন থাকলে সেটা)
const raw = process.env.SITE_URL || "https://your-site.hostingersite.com";
export const SITE_URL = raw.replace(/\/+$/, "");

export const SHOP_NAME = "Electro Store";

// দোকানের ফোন নম্বর। খালি থাকলে footer-এ কিছু দেখায় না। লঞ্চের আগে নিজের নম্বর বসান
export const SHOP_PHONE = "01811223344";