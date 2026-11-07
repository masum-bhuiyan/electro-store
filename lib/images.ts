const ALLOWED_HOST = "res.cloudinary.com";

// শুধু Cloudinary-র ছবির লিংক গ্রহণযোগ্য
export function isAllowedImageUrl(value: string): boolean {
  if (value.length > 500) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === ALLOWED_HOST &&
      u.pathname.includes("/image/upload/")
    );
  } catch {
    return false;
  }
}

// লিংকে "ছোট করো, সেরা ফরম্যাটে দাও" নির্দেশ জুড়ে দেয়
export function imageUrl(src: string, width: number): string {
  if (!isAllowedImageUrl(src)) return src;
  return src.replace(
    "/image/upload/",
    `/image/upload/f_auto,q_auto,c_limit,w_${width}/`
  );
}

// ব্রাউজার পর্দা অনুযায়ী ছোট বা বড় ছবি বেছে নেবে
export function imageSrcSet(src: string, widths: number[]): string | undefined {
  if (!isAllowedImageUrl(src)) return undefined;
  return widths.map((w) => `${imageUrl(src, w)} ${w}w`).join(", ");
}