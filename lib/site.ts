// সাইটের আসল ঠিকানা। Hostinger-এর hPanel-এ SITE_URL env দিন (নিজের ডোমেইন থাকলে সেটা)
const raw = process.env.SITE_URL || "https://your-site.hostingersite.com";
export const SITE_URL = raw.replace(/\/+$/, "");

export const SHOP_NAME = "Bhuiyan Tools";
// মেমোতে ব্যবহারের পুরো নাম, ঠিকানা ও সময়
export const SHOP_LEGAL_NAME = "Bhuiyan International & Telecom";
// মেমোতে ছাপার ওয়েবসাইট (ডোমেইন বদলালে শুধু এখানে বদলান)
export const SHOP_WEBSITE = "bhuiyantools.com";
export const SHOP_ADDRESS =
  "4/148, Gulistan Shopping Complex (5th Floor), Dhaka-1000";
export const SHOP_HOURS = "Sat–Thu 10:00 AM – 8:00 PM";

// প্রধান নম্বর (WhatsApp-এও এটাই) আর দ্বিতীয় নম্বর
export const SHOP_PHONE = "01741-850132";
export const SHOP_PHONE_2 = "01840-016930";

export const SHOP_EMAIL = "bhuiyantools@gmail.com";

// social লিংক। খালি থাকলে footer-এ আইকন দেখাবে না। পেজের আসল লিংক পেলে বসান
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61593687496203";
export const YOUTUBE_URL = "https://www.youtube.com/@bhuiyantelecom5810";

// "01741-850132" থেকে ড্যাশ বাদ দিয়ে tel: লিংকের জন্য
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}