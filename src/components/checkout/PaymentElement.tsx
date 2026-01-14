"use client";

import { useMemo, useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckoutProvider,
  useCheckout,
  PaymentElement,
  ShippingAddressElement,
} from "@stripe/react-stripe-js/checkout";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getStripeAppearance } from "@/lib/stripe-appearance";
import { AlertCircle } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentElementProps {
  clientSecret: string;
  sessionId?: string;
}

function CheckoutForm({
  sessionId,
  clientSecret: _clientSecret,
}: {
  sessionId?: string;
  clientSecret: string;
}) {
  const checkoutResult = useCheckout();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  // Fetch session data to display totals
  useEffect(() => {
    if (sessionId) {
      const fetchSession = async () => {
        try {
          const response = await fetch(`/api/checkout/session?session_id=${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            setSessionData(data);
          }
        } catch (error) {
          console.error("Error fetching session data:", error);
        }
      };
      fetchSession();
    }
  }, [sessionId]);

  // Note: Shipping address is handled automatically by Stripe's ShippingAddressElement

  // Handle payment submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (checkoutResult.type !== "success") {
      return;
    }

    const checkout = checkoutResult.checkout;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the checkout session
      const returnUrl = sessionId
        ? `${window.location.origin}/checkout?session_id={CHECKOUT_SESSION_ID}`
        : `${window.location.origin}/checkout/success`;

      const confirmResult = await checkout.confirm({
        returnUrl: returnUrl,
      });

      if (confirmResult && "error" in confirmResult) {
        setErrorMessage(
          (confirmResult.error as { message?: string })?.message ||
            "Payment failed. Please try again."
        );
        setIsProcessing(false);
      }
      // If successful, checkout.confirm redirects automatically
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj?.message || "An error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  // Display session totals if available
  const totalAmount = sessionData?.amount_total
    ? (sessionData.amount_total / 100).toFixed(2)
    : null;
  const currency = sessionData?.currency?.toUpperCase() || "USD";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shipping Address Element */}
      <div>
        <ShippingAddressElement />
      </div>

      {/* Payment Element */}
      <div>
        <PaymentElement />
      </div>

      {/* Order Summary from Session */}
      {sessionData && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {currency} $
              {((sessionData.amount_subtotal || sessionData.amount_total || 0) / 100).toFixed(2)}
            </span>
          </div>
          {sessionData.total_details?.amount_shipping ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {currency} ${(sessionData.total_details.amount_shipping / 100).toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground text-xs">Calculating...</span>
            </div>
          )}
          {sessionData.total_details?.amount_tax ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">
                {currency} ${(sessionData.total_details.amount_tax / 100).toFixed(2)}
              </span>
            </div>
          ) : null}
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>
              {currency} {totalAmount || "Calculating..."}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={checkoutResult.type !== "success" || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Processing...
          </>
        ) : (
          `Pay ${totalAmount ? `${currency} ${totalAmount}` : ""}`
        )}
      </Button>
    </form>
  );
}

export default function PaymentElementComponent({ clientSecret, sessionId }: PaymentElementProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine current theme mode
  const currentTheme = mounted
    ? ((resolvedTheme || theme || "light") as "light" | "dark")
    : "light";

  // Get appearance configuration based on current theme
  const appearance = useMemo(() => {
    return getStripeAppearance(currentTheme);
  }, [currentTheme]);

  // CheckoutProvider options with appearance and client secret
  const options = useMemo(() => {
    return {
      clientSecret,
      elementsOptions: {
        appearance,
      },
    };
  }, [clientSecret, appearance]);

  if (!clientSecret) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <div className="flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Complete your purchase</CardTitle>
      </CardHeader>
      <CardContent>
        <CheckoutProvider stripe={stripePromise} options={options}>
          <CheckoutForm sessionId={sessionId} clientSecret={clientSecret} />
        </CheckoutProvider>
      </CardContent>
    </Card>
  );
}
