import { NextRequest, NextResponse } from 'next/server';
import { createEmbeddedCheckoutSession, stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { sanitizeString, sanitizeEmail, sanitizeInteger, sanitizeNumber, sanitizeObjectKeys, validateBodySize } from '@/lib/sanitize';

// Maximum request body size (1MB)
const MAX_BODY_SIZE = 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Get raw body text for size validation
    const bodyText = await request.text();
    validateBodySize(bodyText, MAX_BODY_SIZE);

    // Parse and sanitize body
    const body = sanitizeObjectKeys(JSON.parse(bodyText));
    const { items, customerEmail } = body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Limit maximum number of items
    if (items.length > 100) {
      return NextResponse.json(
        { error: 'Too many items in cart. Maximum 100 items allowed.' },
        { status: 400 }
      );
    }

    // Validate and sanitize items structure
    const sanitizedItems = items.map((item: unknown, index: number) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Invalid item at index ${index}: must be an object`);
      }

      const sanitizedItem = sanitizeObjectKeys(item as Record<string, unknown>);

      if (!sanitizedItem.id || !sanitizedItem.name) {
        throw new Error(`Invalid item at index ${index}: id and name are required`);
      }

      // Sanitize and validate fields
      const id = sanitizeInteger(sanitizedItem.id, 1);
      const name = sanitizeString(String(sanitizedItem.name));
      const price = sanitizeNumber(sanitizedItem.price, 0, 1000000); // Max $10,000 per item
      const quantity = sanitizeInteger(sanitizedItem.quantity, 1, 100); // Max 100 per item

      if (name.length === 0 || name.length > 500) {
        throw new Error(`Invalid item name at index ${index}: must be between 1 and 500 characters`);
      }

      return {
        id,
        name,
        price,
        quantity,
        image: sanitizedItem.image ? sanitizeString(String(sanitizedItem.image)) : undefined,
        sku: sanitizedItem.sku ? sanitizeString(String(sanitizedItem.sku)) : undefined,
      };
    });

    // Sanitize customer email if provided
    let sanitizedEmail: string | undefined;
    if (customerEmail) {
      try {
        sanitizedEmail = sanitizeEmail(String(customerEmail));
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid email address format' },
          { status: 400 }
        );
      }
    }

    // Build return URL - use validated environment variable
    let baseUrl = env.NEXT_PUBLIC_SITE_URL;
    
    // In development, try to get the origin from the request headers if available
    if (process.env.NODE_ENV === 'development' && !baseUrl.includes('localhost')) {
      // If NEXT_PUBLIC_SITE_URL is not set to localhost, try to infer from request
      const origin = request.headers.get('origin') || request.headers.get('referer');
      if (origin) {
        try {
          const url = new URL(origin);
          baseUrl = `${url.protocol}//${url.host}`;
        } catch (e) {
          // Fall back to validated env var
        }
      }
    }
    
    const returnUrl = `${baseUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`;

    // Get logo URL from environment or use default
    const logoUrl = env.STRIPE_LOGO_URL || '/Rockited_Logo_For_Dark_BKGRND.png';
    
    // Check if Stripe Tax should be enabled
    // Set STRIPE_TAX_ENABLED=false in .env if you haven't enabled Stripe Tax in dashboard yet
    const taxEnabled = env.STRIPE_TAX_ENABLED !== false;

    // Create checkout session with options
    let session;
    try {
      session = await createEmbeddedCheckoutSession(
        sanitizedItems,
        returnUrl,
        {
          customerEmail: sanitizedEmail,
          shippingAddressCollection: true, // Enable shipping address collection
          allowPromotionCodes: true, // Allow discount codes
          taxEnabled, // Enable automatic tax calculation (if enabled in Stripe Dashboard)
          allowedCountries: ['US'], // US only shipping
          brandingLogoUrl: logoUrl, // Add logo branding
        }
      );
    } catch (error: any) {
      // Handle tax-related errors specifically
      if (error.message?.includes('tax') || error.type === 'StripeInvalidRequestError') {
        console.error('Tax configuration error:', {
          message: error.message,
          type: error.type,
          code: error.code,
        });
        
        // If tax fails but is optional, retry without tax
        if (taxEnabled && error.message?.includes('tax')) {
          console.warn('Tax calculation failed, retrying without tax');
          try {
            session = await createEmbeddedCheckoutSession(
              sanitizedItems,
              returnUrl,
              {
                customerEmail: sanitizedEmail,
                shippingAddressCollection: true,
                allowPromotionCodes: true,
                taxEnabled: false, // Disable tax as fallback
                allowedCountries: ['US'],
                brandingLogoUrl: logoUrl,
              }
            );
          } catch (retryError: any) {
            throw retryError;
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // For custom mode Checkout Sessions, we use the session's client_secret directly
    // The PaymentIntent will be created when the payment is confirmed
    if (!session.client_secret) {
      throw new Error('Failed to get client secret from Checkout Session');
    }

    // Verify tax status if enabled
    const taxStatus = session.automatic_tax?.status;
    if (taxEnabled && taxStatus) {
      console.log('Tax calculation status:', taxStatus);
    }

    return NextResponse.json({ 
      clientSecret: session.client_secret,
      sessionId: session.id,
      taxEnabled: taxEnabled && !!session.automatic_tax?.enabled,
      taxStatus: session.automatic_tax?.status,
    });
  } catch (error: unknown) {
    // Don't leak internal error details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Checkout API error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return user-friendly error messages
    if (errorMessage.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'Payment service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Validation errors should return 400
    if (errorMessage.includes('Invalid') || errorMessage.includes('must be')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Include more details in development mode only
    const errorResponse: { error: string; details?: string } = {
      error: 'Failed to create checkout session. Please try again.',
    };
    
    if (process.env.NODE_ENV === 'development' && error instanceof Error && error.stack) {
      errorResponse.details = error.stack;
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
