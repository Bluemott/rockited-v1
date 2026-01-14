import { NextRequest, NextResponse } from "next/server";
import { getFeaturedProducts } from "@/lib/woocommerce";
import type { FeaturedProductsApiResponse, ErrorApiResponse } from "@/lib/types";

export async function GET(_request: NextRequest) {
  try {
    // Limit is fixed at 3 for featured products
    const products = await getFeaturedProducts(3);
    const response: FeaturedProductsApiResponse = products;
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching featured products:", errorMessage);

    const errorResponse: ErrorApiResponse = {
      error: "Failed to fetch featured products",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
