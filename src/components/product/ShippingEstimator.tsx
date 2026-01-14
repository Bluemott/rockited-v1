"use client";

import { useState } from "react";
import { WooProduct, WooShippingRate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Truck } from "lucide-react";
import { toast } from "sonner";

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

export default function ShippingEstimator({ product, quantity = 1 }: ShippingEstimatorProps) {
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Skip if product doesn't require shipping
  if (!product.shipping_required || product.virtual) {
    return null;
  }

  const handleCalculate = async () => {
    if (!country) {
      toast.error("Please select a country");
      return;
    }

    setIsCalculating(true);
    setError(null);
    setShippingRates(null);

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country,
          state: state || undefined,
          postcode: postcode || undefined,
          city: city || undefined,
          products: [
            {
              id: product.id,
              quantity: quantity || 1,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to calculate shipping");
      }

      const data: ShippingCalculationResult = await response.json();
      setShippingRates(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      const errorMessage = errorObj?.message || "Failed to calculate shipping rates";
      setError(errorMessage);
      toast.error(errorMessage);
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
        <CardDescription>Calculate shipping costs for this product</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="US"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="CA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postcode">Postal Code</Label>
            <Input
              id="postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="90210"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Los Angeles"
            />
          </div>
        </div>

        <Button onClick={handleCalculate} disabled={isCalculating || !country} className="w-full">
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              Calculate Shipping
            </>
          )}
        </Button>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {shippingRates && (
          <div className="mt-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              Shipping to: {shippingRates.zone_name}
              {shippingRates.total_weight && (
                <span className="ml-2">(Total weight: {shippingRates.total_weight} lbs)</span>
              )}
            </div>
            <div className="space-y-2">
              {shippingRates.rates.length > 0 ? (
                shippingRates.rates.map((rate, index) => (
                  <div
                    key={`${rate.method_id}-${index}`}
                    className="flex items-center justify-between p-3 rounded-md border bg-card"
                  >
                    <div>
                      <div className="font-medium">{rate.method_title}</div>
                      {rate.estimated_delivery && (
                        <div className="text-sm text-muted-foreground">
                          {rate.estimated_delivery}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-lg">{formatPrice(rate.cost)}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-3 rounded-md border">
                  No shipping methods available for this location.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
