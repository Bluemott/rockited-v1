"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useTheme } from "next-themes";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getStripeAppearance } from "@/lib/stripe-appearance";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentElementProps {
  clientSecret: string;
}
export default function PaymentElementComponent({ clientSecret }: PaymentElementProps) {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = (resolvedTheme || theme || "light") as "light" | "dark";
  const appearance = useMemo(() => getStripeAppearance(currentTheme), [currentTheme]);

  const options = useMemo(() => {
    return {
      clientSecret,
      appearance,
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
        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </CardContent>
    </Card>
  );
}
