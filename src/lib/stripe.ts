import Stripe from 'stripe';
import { env } from './env';

// Initialize Stripe with validated environment variable
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  maxNetworkRetries: 2,
  timeout: 20000,
});

// Type definitions for better type safety
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

export interface CheckoutSessionOptions {
  customerEmail?: string;
  shippingAddressCollection?: boolean;
  allowPromotionCodes?: boolean;
  taxEnabled?: boolean;
  allowedCountries?: string[];
  brandingLogoUrl?: string;
}

/**
 * Create Stripe Checkout Session (hosted page)
 */
export const createCheckoutSession = async (
  cartItems: CartItem[],
  successUrl: string,
  cancelUrl: string,
  options?: CheckoutSessionOptions
): Promise<Stripe.Checkout.Session> => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cart items are required');
  }

  try {
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            product_id: item.id.toString(),
            sku: item.sku || '',
          },
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        cart_items: JSON.stringify(cartItems),
      },
    };

    // Add optional parameters
    if (options?.customerEmail) {
      sessionParams.customer_email = options.customerEmail;
    }

    if (options?.shippingAddressCollection) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ['US', 'CA'], // Add more countries as needed
      };
    }

    if (options?.allowPromotionCodes) {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return session;
  } catch (error: any) {
    console.error('Error creating checkout session:', {
      message: error.message,
      type: error.type,
      code: error.code,
    });
    
    // Provide user-friendly error messages
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error('Invalid checkout request. Please try again.');
    } else if (error.type === 'StripeAPIError') {
      throw new Error('Payment service temporarily unavailable. Please try again later.');
    }
    
    throw error;
  }
};

/**
 * Create Stripe Checkout Session with custom UI mode (Payment Element)
 * Uses ui_mode: 'custom' to enable Payment Element with Appearance API customization
 */
export const createEmbeddedCheckoutSession = async (
  cartItems: CartItem[],
  returnUrl: string,
  options?: CheckoutSessionOptions
): Promise<Stripe.Checkout.Session> => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cart items are required');
  }

  try {
    const allowedCountries = options?.allowedCountries || ['US'];
    const taxEnabled = options?.taxEnabled ?? true; // Enable tax by default
    
    const lineItems = cartItems.map(item => {
      const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            metadata: {
              product_id: item.id.toString(),
              sku: item.sku || '',
              woocommerce_product_id: item.id.toString(),
            },
            // Tax code goes on product_data, not price_data
            ...(taxEnabled && { tax_code: getTaxCodeForProduct() }),
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
          // Tax behavior goes on price_data
          ...(taxEnabled && { tax_behavior: 'exclusive' as const }), // Tax added separately for clear pricing
        },
        quantity: item.quantity,
      };

      return lineItem;
    });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: 'custom', // Changed from 'embedded' to 'custom' for Payment Element
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      return_url: returnUrl,
      metadata: {
        cart_items: JSON.stringify(cartItems),
      },
    };

    // Add optional parameters
    if (options?.customerEmail) {
      sessionParams.customer_email = options.customerEmail;
    }

    // Configure shipping address collection for Payment Element
    // With custom mode, shipping is handled via Address Element and updateShippingAddress
    if (options?.shippingAddressCollection) {
      sessionParams.shipping_address_collection = {
        allowed_countries: allowedCountries,
      };
      // Note: permissions and initial shipping_options not needed for custom mode
      // Shipping will be updated dynamically via session.updateShippingAddress()
    }

    // Enable automatic tax calculation
    // Note: Stripe Tax must be enabled in your Stripe Dashboard for this to work
    if (taxEnabled) {
      sessionParams.automatic_tax = {
        enabled: true,
      };
      
      // Collect billing address for tax calculation if shipping is not collected
      if (!options?.shippingAddressCollection) {
        sessionParams.billing_address_collection = 'required';
      }
    }

    if (options?.allowPromotionCodes) {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return session;
  } catch (error: any) {
    console.error('Error creating embedded checkout session:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      detail: error.raw?.message || error.detail,
      raw: error.raw,
    });
    
    // Provide user-friendly error messages with more detail in development
    if (error.type === 'StripeInvalidRequestError') {
      const detailedMessage = process.env.NODE_ENV === 'development' 
        ? `Invalid checkout request: ${error.message}${error.param ? ` (param: ${error.param})` : ''}`
        : 'Invalid checkout request. Please try again.';
      throw new Error(detailedMessage);
    } else if (error.type === 'StripeAPIError') {
      throw new Error('Payment service temporarily unavailable. Please try again later.');
    }
    
    throw error;
  }
};

/**
 * Get tax code for a product
 * Uses general merchandise tax code by default
 * Reference: https://docs.stripe.com/tax/tax-codes
 * - txcd_99999999 = General merchandise (default for physical products)
 * - txcd_10101001 = Software as a service
 * - txcd_10101002 = Digital products transferred electronically
 */
export const getTaxCodeForProduct = (product?: { virtual?: boolean; categories?: Array<{ slug?: string }> }): string => {
  // If product info is provided and it's virtual, use digital product tax code
  if (product?.virtual) {
    return 'txcd_10101002';
  }
  
  // Default to general merchandise for physical products
  return 'txcd_99999999';
};

/**
 * Retrieve Stripe Checkout Session with expanded line items
 */
export const getCheckoutSession = async (
  sessionId: string,
  expand?: string[]
): Promise<Stripe.Checkout.Session> => {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const expandParams = expand || ['line_items', 'customer', 'payment_intent'];
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: expandParams,
    });

    return session;
  } catch (error: any) {
    console.error(`Error retrieving checkout session ${sessionId}:`, {
      message: error.message,
      type: error.type,
      code: error.code,
    });
    
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error('Invalid session ID');
    }
    
    throw error;
  }
};
