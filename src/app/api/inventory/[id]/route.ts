import { NextRequest, NextResponse } from "next/server";

import { sanitizeInteger } from "@/lib/sanitize";
import type { InventoryApiResponse, ErrorApiResponse } from "@/lib/types";
import { checkInventory } from "@/lib/woocommerce";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;

    // Validate and sanitize product ID
    let productId: number;
    try {
      productId = sanitizeInteger(resolvedParams.id, 1);
    } catch {
      return NextResponse.json(
        { error: "Invalid product ID. Must be a positive integer." },
        { status: 400 }
      );
    }

    const inventory = await checkInventory(productId);

    const response: InventoryApiResponse = {
      stock_status: inventory.stock_status,
      stock_quantity: inventory.stock_quantity,
      on_sale: inventory.on_sale,
      price: inventory.price,
      regular_price: inventory.regular_price,
      sale_price: inventory.sale_price,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Inventory API error:", errorMessage);

    const errorResponse: ErrorApiResponse = {
      error: "Failed to fetch inventory",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
