import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe';
import { sanitizeString } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionIdParam = searchParams.get('session_id');

    if (!sessionIdParam) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Sanitize session ID (Stripe session IDs are alphanumeric with underscores and hyphens)
    const sessionId = sanitizeString(sessionIdParam);
    
    // Validate session ID format (Stripe session IDs start with cs_)
    if (!sessionId.startsWith('cs_') || sessionId.length < 10 || sessionId.length > 200) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Retrieve session with expanded line items for order details
    const session = await getCheckoutSession(sessionId, [
      'line_items',
      'customer',
      'payment_intent',
    ]);

    // Extract payment intent ID if available
    let paymentIntentId = null;
    if (session.payment_intent) {
      paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id;
    }

    // Return only necessary data (don't expose sensitive information)
    return NextResponse.json({
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      currency: session.currency,
      customer_email: session.customer_email,
      customer_details: session.customer_details,
      line_items: session.line_items,
      metadata: session.metadata,
      total_details: session.total_details,
      payment_intent: paymentIntentId,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Session API error:', {
      message: errorMessage,
      type: error instanceof Error && 'type' in error ? (error as { type?: string }).type : undefined,
    });

    if (errorMessage.includes('Invalid session ID') || errorMessage.includes('No such checkout session')) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
