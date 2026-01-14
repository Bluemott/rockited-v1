"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatPrice } from "@/lib/utils";
import PaymentElementComponent from "@/components/checkout/PaymentElement";
import CheckoutSuccess from "@/components/checkout/CheckoutSuccess";
import { trackBeginCheckout } from "@/lib/analytics";
import { Plus, Minus, X, ShoppingCart } from "lucide-react";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

function CheckoutContent() {
  const { items, total, itemCount, updateQuantity, removeItem } = useCartStore();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [cartChanged, setCartChanged] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // Calculate subtotal (before tax and shipping)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Track begin checkout event
  useEffect(() => {
    if (!sessionId && items.length > 0) {
      const checkoutItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: undefined, // Could be enhanced to include category from product data
      }));
      trackBeginCheckout(checkoutItems);
    }
  }, [sessionId, items]);

  // Initialize embedded checkout - always call hooks in the same order
  useEffect(() => {
    // Only initialize if we don't have a session_id and we have items
    if (!sessionId && items.length > 0 && !cartChanged) {
      const initializeCheckout = async () => {
        setIsLoading(true);
        setError("");

        try {
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items }),
          });

          const data = await response.json();

          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            // Also store sessionId if provided
            if (data.sessionId) {
              setCheckoutSessionId(data.sessionId);
            }
          } else {
            throw new Error(data.error || "Failed to initialize checkout");
          }
        } catch (error) {
          console.error("Checkout initialization error:", error);
          setError("Failed to initialize checkout. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      initializeCheckout();
    }
  }, [sessionId, items, cartChanged]);

  // Handle quantity changes
  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    updateQuantity(id, newQuantity);
    // Reset checkout session to force reinitialization
    setClientSecret("");
    setCheckoutSessionId("");
    setCartChanged(true);
  };

  // Handle item removal
  const handleRemoveItem = (id: number) => {
    removeItem(id);
    // Reset checkout session to force reinitialization
    setClientSecret("");
    setCheckoutSessionId("");
    setCartChanged(true);
  };

  // Reinitialize checkout when cart changes
  useEffect(() => {
    if (cartChanged && items.length > 0) {
      setCartChanged(false);
      setIsLoading(true);
      setError("");

      // Reinitialize checkout with updated cart
      const initializeCheckout = async () => {
        try {
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items }),
          });

          const data = await response.json();

          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            if (data.sessionId) {
              setCheckoutSessionId(data.sessionId);
            }
          } else {
            throw new Error(data.error || "Failed to initialize checkout");
          }
        } catch (error) {
          console.error("Checkout reinitialization error:", error);
          setError("Failed to update checkout. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      initializeCheckout();
    }
  }, [cartChanged, items]);

  // If we have a session_id, show success page
  if (sessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CheckoutSuccess sessionId={sessionId} />
      </div>
    );
  }

  // Handle empty cart
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-white mb-4">Checkout</h1>
          <p className="text-lg text-gray-300 mb-8">Your cart is empty</p>
          <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Order Details - Takes more space */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Order Summary</h2>
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Edit Cart
                </Button>
              </Link>
            </div>

            <div className="bg-card rounded-lg shadow-brand-md p-6 border border-border space-y-6">
              {/* Cart Items with Images and Details */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder-product.jpg"}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1">{item.name}</h3>
                      {item.sku && (
                        <p className="text-sm text-muted-foreground mb-2">SKU: {item.sku}</p>
                      )}
                      <p className="text-base font-medium text-foreground">
                        {formatPrice(item.price)} each
                      </p>
                    </div>

                    {/* Quantity Controls and Price */}
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-3">
                        {/* Quantity Adjuster */}
                        <div className="flex items-center border border-border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium text-foreground min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Item Subtotal */}
                      <p className="text-lg font-semibold text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary Breakdown */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-success">Calculated at checkout</span>
                </div>

                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium text-success">Calculated automatically</span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Final total includes shipping and tax
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-primary mb-2">Secure Checkout</h3>
              <p className="text-sm text-muted-foreground">
                Your payment information is encrypted and secure with Stripe. You'll stay on this
                page throughout the entire checkout process.
              </p>
            </div>
          </div>

          {/* Embedded Checkout - Sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <div className="bg-card rounded-lg shadow-brand-md p-6 border border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">Payment</h2>

                {isLoading && (
                  <div className="flex justify-center items-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                    <p className="text-destructive text-sm">{error}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {clientSecret && !isLoading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-foreground">
                          Stripe Embedded Checkout
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">Secure</span>
                    </div>

                    <PaymentElementComponent
                      clientSecret={clientSecret}
                      sessionId={checkoutSessionId}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <CheckoutContent />
    </Suspense>
  );
}
