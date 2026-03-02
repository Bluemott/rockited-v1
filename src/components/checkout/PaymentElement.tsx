"use client";

import {
  CheckoutProvider,
  useCheckout,
  PaymentElement,
  ShippingAddressElement,
  ExpressCheckoutElement,
} from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getStripeAppearance } from "@/lib/stripe-appearance";


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/** Shipping address to prefill billing (use shipping for billing or edit manually). */
export interface ShippingAddressForBilling {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
}

/** Session data from /api/checkout/session for display (totals, currency). */
interface SessionDisplayData {
  amount_total?: number;
  amount_subtotal?: number;
  currency?: string;
  total_details?: { amount_shipping?: number; amount_tax?: number };
}

interface PaymentElementProps {
  clientSecret: string;
  sessionId?: string;
  /** When true, shipping was collected before creating the session; do not show ShippingAddressElement or poll for shipping updates. */
  shippingAlreadyCollected?: boolean;
  /** Email collected in checkout form; passed to Stripe via updateEmail() and confirm() so session has required email. */
  customerEmail?: string | null;
  /** When provided with shippingAlreadyCollected, billing fields are prefilled so customer can use shipping for billing or edit manually. */
  shippingAddressForBilling?: ShippingAddressForBilling | null;
}

function CheckoutForm({
  sessionId,
  clientSecret: _clientSecret,
  shippingAlreadyCollected = false,
  customerEmail: _customerEmail = null,
  shippingAddressForBilling = null,
}: {
  sessionId?: string;
  clientSecret: string;
  shippingAlreadyCollected?: boolean;
  customerEmail?: string | null;
  shippingAddressForBilling?: ShippingAddressForBilling | null;
}) {
  const checkoutResult = useCheckout();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionDisplayData | null>(null);
  const billingPrefillDoneRef = useRef(false);

  const fetchSessionData = useMemo(
    () => async () => {
      if (!sessionId) return;
      try {
        const response = await fetch(`/api/checkout/session?session_id=${sessionId}`);
        if (response.ok) {
          const data = (await response.json()) as SessionDisplayData;
          setSessionData(data);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    queueMicrotask(() => {
      void fetchSessionData();
    });
  }, [fetchSessionData]);

  // Prefill billing from shipping when checkout is ready (use shipping for billing or fill manually)
  useEffect(() => {
    if (
      !shippingAlreadyCollected ||
      !shippingAddressForBilling ||
      billingPrefillDoneRef.current ||
      checkoutResult.type !== "success"
    ) {
      return;
    }
    const checkout = checkoutResult.checkout;
    if (typeof checkout.updateBillingAddress !== "function") return;

    billingPrefillDoneRef.current = true;
    const a = shippingAddressForBilling;
    checkout
      .updateBillingAddress({
        name: a.name ?? undefined,
        address: {
          line1: a.line1 ?? undefined,
          line2: a.line2 ?? undefined,
          city: a.city ?? undefined,
          state: a.state ?? undefined,
          postal_code: a.postal_code ?? undefined,
          country: a.country || "US",
        },
      })
      .catch(() => {
        billingPrefillDoneRef.current = false;
      });
  }, [shippingAlreadyCollected, shippingAddressForBilling, checkoutResult]);

  // Do not call updateShippingAddress() when permissions.update_shipping_details is "server_only"
  // (our session is created that way). Shipping is set server-side via collected_information.shipping_details in /api/checkout.
  // Do not call updateEmail() when the session was created with customer_email (we pass
  // customerEmail from the form and the API sets customer_email on session creation).
  // Stripe errors: "You cannot update the email if customer_email is already provided on Checkout Session creation."

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
      // Don't pass email to confirm() when the session was created with customer_email (we pass
      // customerEmail from the form to the API). Stripe errors if you set email in confirm() when
      // customer_email is already set on the Checkout Session.
      const confirmResult = await checkout.confirm();

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
      {!shippingAlreadyCollected && (
        <div>
          <ShippingAddressElement />
        </div>
      )}

      {/* One-click wallet buttons (Apple Pay, Google Pay, Link) - shown when eligible */}
      <div className="space-y-2">
        <ExpressCheckoutElement
          onConfirm={async () => {
            if (checkoutResult.type !== "success") return;
            setIsProcessing(true);
            setErrorMessage(null);
            try {
              const confirmResult = await checkoutResult.checkout.confirm();
              if (confirmResult && "error" in confirmResult) {
                setErrorMessage(
                  (confirmResult.error as { message?: string })?.message ||
                    "Payment failed. Please try again."
                );
                setIsProcessing(false);
              }
            } catch (err: unknown) {
              const errorObj = err as { message?: string };
              setErrorMessage(errorObj?.message || "An error occurred. Please try again.");
              setIsProcessing(false);
            }
          }}
        />
      </div>

      <div className="relative py-2 min-h-[2.5rem] flex items-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase w-full">
          <span className="bg-card px-2 text-muted-foreground">Or pay with card</span>
        </div>
      </div>

      <div>
        <PaymentElement
          options={
            shippingAlreadyCollected && shippingAddressForBilling
              ? { fields: { billingDetails: { name: "never" } } }
              : undefined
          }
        />
      </div>

      {sessionData && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {currency} $
              {((sessionData.amount_subtotal || sessionData.amount_total || 0) / 100).toFixed(2)}
            </span>
          </div>
          {sessionData.total_details?.amount_shipping != null ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {currency} ${(sessionData.total_details.amount_shipping / 100).toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground text-xs">
                {shippingAlreadyCollected ? "—" : "Calculating..."}
              </span>
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

export default function PaymentElementComponent({
  clientSecret,
  sessionId,
  shippingAlreadyCollected = false,
  customerEmail = null,
  shippingAddressForBilling = null,
}: PaymentElementProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
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
          <CheckoutForm
            sessionId={sessionId}
            clientSecret={clientSecret}
            shippingAlreadyCollected={shippingAlreadyCollected}
            customerEmail={customerEmail}
            shippingAddressForBilling={shippingAddressForBilling}
          />
        </CheckoutProvider>
      </CardContent>
    </Card>
  );
}
