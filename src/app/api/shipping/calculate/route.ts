import { NextRequest, NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/woocommerce';
import { sanitizeString, sanitizeInteger, sanitizeObjectKeys, validateBodySize } from '@/lib/sanitize';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

export async function POST(request: NextRequest) {
  try {
    // Validate body size
    const bodyText = await request.text();
    validateBodySize(bodyText, MAX_BODY_SIZE);

    // Parse and sanitize body
    const body = sanitizeObjectKeys(JSON.parse(bodyText));
    const { country, state, postcode, city, products } = body;

    // Validate and sanitize required fields
    if (!country || typeof country !== 'string') {
      return NextResponse.json(
        { error: 'Country is required and must be a string' },
        { status: 400 }
      );
    }

    const sanitizedCountry = sanitizeString(country).toUpperCase();
    
    // Validate country code format (ISO 3166-1 alpha-2)
    if (sanitizedCountry.length !== 2 || !/^[A-Z]{2}$/.test(sanitizedCountry)) {
      return NextResponse.json(
        { error: 'Invalid country code format. Must be a 2-letter ISO code.' },
        { status: 400 }
      );
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Products array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Limit maximum number of products
    if (products.length > 100) {
      return NextResponse.json(
        { error: 'Too many products. Maximum 100 products allowed.' },
        { status: 400 }
      );
    }

    // Validate and sanitize products array structure
    const sanitizedProducts = products.map((product: unknown, index: number) => {
      if (!product || typeof product !== 'object') {
        throw new Error(`Invalid product at index ${index}: must be an object`);
      }

      const sanitizedProduct = sanitizeObjectKeys(product as Record<string, unknown>);

      if (!sanitizedProduct.id || !sanitizedProduct.quantity) {
        throw new Error(`Product at index ${index}: id and quantity are required`);
      }

      const id = sanitizeInteger(sanitizedProduct.id, 1);
      const quantity = sanitizeInteger(sanitizedProduct.quantity, 1, 1000); // Max 1000 per product

      return { id, quantity };
    });

    // Sanitize optional fields
    const sanitizedState = state ? sanitizeString(String(state)).substring(0, 100) : undefined;
    const sanitizedPostcode = postcode ? sanitizeString(String(postcode)).substring(0, 20) : undefined;
    const sanitizedCity = city ? sanitizeString(String(city)).substring(0, 100) : undefined;

    // Calculate shipping
    const shipping = await calculateShipping({
      country: sanitizedCountry,
      state: sanitizedState,
      postcode: sanitizedPostcode,
      city: sanitizedCity,
      products: sanitizedProducts,
    });

    return NextResponse.json(shipping);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Shipping calculation API error:', errorMessage);
    
    // Validation errors should return 400
    if (errorMessage.includes('Invalid') || errorMessage.includes('must be') || errorMessage.includes('required')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    // Return a more user-friendly error message
    const errorResponse: { error: string; details?: string } = {
      error: 'Failed to calculate shipping. Please try again.',
    };
    
    if (process.env.NODE_ENV === 'development' && error instanceof Error && error.stack) {
      errorResponse.details = error.stack;
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

