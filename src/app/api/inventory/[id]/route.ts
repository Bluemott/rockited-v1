import { NextRequest, NextResponse } from 'next/server';
import { checkInventory } from '@/lib/woocommerce';
import { sanitizeInteger } from '@/lib/sanitize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Validate and sanitize product ID
    let productId: number;
    try {
      productId = sanitizeInteger(resolvedParams.id, 1);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid product ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    const inventory = await checkInventory(productId);
    
    return NextResponse.json(inventory);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Inventory API error:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
