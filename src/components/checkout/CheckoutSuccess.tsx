'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { getCheckoutSession } from '@/lib/stripe';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Truck, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { trackPurchase } from '@/lib/analytics';

interface CheckoutSuccessProps {
  sessionId: string;
}

export default function CheckoutSuccess({ sessionId }: CheckoutSuccessProps) {
  const { clearCart } = useCartStore();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (sessionId) {
      // Fetch session details first to verify payment status
      fetch(`/api/checkout/session?session_id=${sessionId}`)
        .then(async res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch session: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          // Verify payment status before clearing cart
          if (data.payment_status === 'paid' && data.status === 'complete') {
            // Only clear cart if payment is confirmed
            clearCart();
            
            setSession(data);
            
            // Track purchase event if we have session data
            if (data && data.amount_total && data.line_items) {
              const items = data.line_items?.data || [];
              trackPurchase({
                transactionId: sessionId,
                value: data.amount_total / 100, // Convert from cents
                items: items.map((item: any) => ({
                  id: item.price?.product || item.id,
                  name: item.description || 'Product',
                  price: item.amount_total / 100 / (item.quantity || 1),
                  quantity: item.quantity || 1,
                  category: undefined,
                })),
              });
            }
          } else {
            // Payment not completed yet
            setError('Payment is still processing. Please wait a moment and refresh the page.');
            setSession(data); // Still show session data
          }
          
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching session:', error);
          setError('Failed to verify payment. Please contact support if you were charged.');
          setLoading(false);
        });
    } else {
      setLoading(false);
      setError('No session ID provided');
    }
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Payment Verification
          </h1>
          <p className="text-lg text-muted-foreground">
            {error}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/products">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto text-center space-y-8"
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="space-y-4"
      >
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {session?.payment_status === 'paid' ? 'Order Successful!' : 'Payment Processing'}
        </h1>
        <p className="text-lg text-muted-foreground">
          {session?.payment_status === 'paid' 
            ? 'Thank you for your purchase. Your order has been confirmed.'
            : 'Your payment is being processed. You will receive a confirmation email once it\'s complete.'}
        </p>
        {error && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            {error}
          </p>
        )}
        {sessionId && (
          <Badge variant="outline" className="text-xs mt-2">
            Order ID: {sessionId}
          </Badge>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-start space-x-3"
            >
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                <Mail className="w-3 h-3" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Order Confirmation</p>
                <p className="text-sm text-muted-foreground">You'll receive an email confirmation shortly</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-start space-x-3"
            >
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                <Package className="w-3 h-3" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Processing</p>
                <p className="text-sm text-muted-foreground">We'll prepare your order for shipment</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-start space-x-3"
            >
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                <Truck className="w-3 h-3" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Shipping</p>
                <p className="text-sm text-muted-foreground">You'll receive tracking information once shipped</p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Button size="lg" asChild>
          <Link href="/products">
            Continue Shopping
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
