import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedProducts } from '@/lib/woocommerce';

export async function GET(request: NextRequest) {
  try {
    // Limit is fixed at 3 for featured products
    const products = await getFeaturedProducts(3);
    return NextResponse.json(products);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching featured products:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}
