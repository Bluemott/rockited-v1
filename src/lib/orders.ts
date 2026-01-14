import { wooApi } from './woocommerce';
import type Stripe from 'stripe';
import { stripe } from './stripe';

export interface WooCommerceOrderItem {
  product_id: number;
  quantity: number;
  price?: string;
  name?: string;
  sku?: string;
}

export interface WooCommerceOrderData {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  line_items: WooCommerceOrderItem[];
  meta_data: Array<{
    key: string;
    value: string;
  }>;
  transaction_id?: string;
}

/**
 * Create a WooCommerce order from a Stripe checkout session
 */
export async function createWooCommerceOrder(
  session: Stripe.Checkout.Session
): Promise<any> {
  try {
    // Retrieve full session details with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'customer', 'payment_intent'],
    });

    // Extract customer information
    const customerEmail = session.customer_email || session.customer_details?.email || '';
    const customerName = session.customer_details?.name || '';
    const [firstName, ...lastNameParts] = customerName.split(' ') || ['', ''];
    const lastName = lastNameParts.join(' ') || '';

    // Extract billing address
    const billing = session.customer_details?.address || {};
    const shipping = session.shipping_details?.address || {};

    // Parse line items
    const lineItems: WooCommerceOrderItem[] = [];
    
    if (fullSession.line_items?.data) {
      for (const item of fullSession.line_items.data) {
        // Try to extract product ID from metadata or price metadata
        const productId = item.price?.metadata?.product_id || 
                         item.price?.metadata?.woocommerce_product_id ||
                         null;

        if (productId) {
          lineItems.push({
            product_id: parseInt(productId, 10),
            quantity: item.quantity || 1,
            price: ((item.amount_total || 0) / 100).toFixed(2),
          });
        } else {
          // If no product ID, create order item with name and price
          lineItems.push({
            product_id: 0, // Will need to be created or matched manually
            quantity: item.quantity || 1,
            price: ((item.amount_total || 0) / 100).toFixed(2),
            name: item.description || 'Product',
            sku: item.price?.metadata?.sku || '',
          });
        }
      }
    }

    // Build order data
    const orderData: WooCommerceOrderData = {
      payment_method: 'stripe',
      payment_method_title: 'Stripe',
      set_paid: session.payment_status === 'paid',
      billing: {
        first_name: firstName,
        last_name: lastName,
        email: customerEmail,
        phone: session.customer_details?.phone || '',
        address_1: billing.line1 || '',
        address_2: billing.line2 || '',
        city: billing.city || '',
        state: billing.state || '',
        postcode: billing.postal_code || '',
        country: billing.country || 'US',
      },
      line_items: lineItems,
      meta_data: [
        {
          key: '_stripe_session_id',
          value: session.id,
        },
        {
          key: '_stripe_payment_intent_id',
          value: session.payment_intent as string || '',
        },
        {
          key: '_stripe_customer_id',
          value: (session.customer as string) || '',
        },
      ],
      transaction_id: session.payment_intent as string || session.id,
    };

    // Add shipping address if available
    if (shipping.line1) {
      orderData.shipping = {
        first_name: firstName,
        last_name: lastName,
        address_1: shipping.line1 || '',
        address_2: shipping.line2 || '',
        city: shipping.city || '',
        state: shipping.state || '',
        postcode: shipping.postal_code || '',
        country: shipping.country || 'US',
      };
    }

    // Create order in WooCommerce
    const response = await wooApi.post('orders', orderData);

    if (response.status === 201) {
      console.log(`✅ WooCommerce order created: ${response.data.id} for Stripe session ${session.id}`);
      return response.data;
    } else {
      throw new Error(`Failed to create WooCommerce order: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error creating WooCommerce order:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('WooCommerce API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    
    throw error;
  }
}

/**
 * Check if an order already exists for a given Stripe session ID
 */
export async function findOrderByStripeSessionId(
  sessionId: string
): Promise<any | null> {
  try {
    const response = await wooApi.get('orders', {
      meta_key: '_stripe_session_id',
      meta_value: sessionId,
      per_page: 1,
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  } catch (error) {
    console.error('Error finding order by Stripe session ID:', error);
    return null;
  }
}

