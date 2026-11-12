// WhatsApp নম্বর এক জায়গায় (দেশের কোডসহ, + ছাড়া)
export const WHATSAPP_NUMBER = "8801741850132";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}