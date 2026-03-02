"use client";

import { Loader2, Package, Truck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WooProduct, WooShippingRate } from "@/lib/types";

interface ShippingEstimatorProps {
  product: WooProduct;
  quantity?: number;
}

interface ShippingCalculationResult {
  zone_id: number;
  zone_name: string;
  rates: WooShippingRate[];
  total_weight: string;
}

const FALLBACK_MESSAGE =
  "Standard shipping applies; exact rate at checkout.";

const SHIPPING_ESTIMATE_ERROR_MESSAGE =
  "Unable to load shipping estimate. Try again or see checkout for exact rates.";

export default function ShippingEstimator({ product, quantity = 1 }: ShippingEstimatorProps) {
  const [postcode, setPostcode] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Skip if product doesn't require shipping
  if (!product.shipping_required || product.virtual) {
    return null;
  }

  const zip5 = postcode.trim().replace(/\D/g, "").slice(0, 5);
  const canCalculate = zip5.length === 5;

  const handleCalculate = async () => {
    if (!canCalculate) return;

    setIsCalculating(true);
    setError(null);
    setShippingRates(null);
    setShowFallback(false);

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: "US",
          postcode: zip5,
          products: [{ id: product.id, quantity: quantity || 1 }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to calculate shipping");
        setIsCalculating(false);
        return;
      }

      const data: ShippingCalculationResult = await response.json();
      if (data.rates?.length) {
        setShippingRates(data);
        setError(null);
      } else {
        setShowFallback(true);
        setError(null);
      }
    } catch {
      setError(SHIPPING_ESTIMATE_ERROR_MESSAGE);
      setShowFallback(false);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(price || "0"));
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Estimator
        </CardTitle>
        <CardDescription>
          {shippingRates?.rates?.length
            ? `From ${formatPrice(shippingRates.rates[0]?.cost ?? "0")} to ZIP ${zip5} — options below.`
            : "Estimate shipping to a US ZIP code. Ships in 2–5 business days to the continental US."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="postcode">ZIP code</Label>
          <Input
            id="postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="90210"
            maxLength={5}
            aria-describedby="postcode-hint"
          />
          <p id="postcode-hint" className="text-xs text-muted-foreground">
            Enter a 5-digit US ZIP code
          </p>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !canCalculate}
          className="w-full"
        >
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              Get estimate
            </>
          )}
        </Button>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {showFallback && !shippingRates && (
          <div className="p-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
            {FALLBACK_MESSAGE}
          </div>
        )}

        {shippingRates && shippingRates.rates.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              Shipping to ZIP {zip5}
              {shippingRates.total_weight && (
                <span className="ml-2">(Total weight: {shippingRates.total_weight} lbs)</span>
              )}
            </div>
            <div className="space-y-2">
              {shippingRates.rates.map((rate, index) => (
                <div
                  key={`${rate.method_id}-${index}`}
                  className="flex items-center justify-between p-3 rounded-md border bg-card"
                >
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {rate.method_title}
                      {index === 0 && (
                        <span className="text-xs font-normal text-primary rounded bg-primary/10 px-1.5 py-0.5">
                          Best value
                        </span>
                      )}
                    </div>
                    {rate.estimated_delivery && (
                      <div className="text-sm text-muted-foreground">
                        {rate.estimated_delivery}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-lg">{formatPrice(rate.cost)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
