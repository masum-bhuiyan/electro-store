import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/modules/products/queries";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";

  // খালি বা অনেক লম্বা লেখা হলে ডাটাবেসে যাওয়ার দরকার নেই
  if (q.trim().length === 0 || q.length > 50) {
    return NextResponse.json([]);
  }

  const suggestions = await getSearchSuggestions(q);
  return NextResponse.json(suggestions);
}