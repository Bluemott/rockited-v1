"use client";

import Image from "next/image";
import Link from "next/link";

import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useCartStore } from "@/lib/store";
import { formatPrice, normalizeImageUrl } from "@/lib/utils";

export default function CartPage() {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart, _hasHydrated } = useCartStore();

  // Wait for hydration before checking cart state
  // This prevents showing "empty cart" during SSR/hydration when cart actually has items
  if (!_hasHydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Your Cart</h1>
          <p className="text-lg text-muted-foreground mb-8">Your cart is empty</p>
          <Link href="/products">
            <Button size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Your Cart</h1>
          <Button variant="outline" onClick={clearCart} size="sm">
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  data-testid="cart-item"
                  className="bg-card rounded-lg shadow-brand-md p-6 flex items-center space-x-4"
                >
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={normalizeImageUrl(item.image)}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    <p className="text-lg font-bold text-foreground">{formatPrice(item.price)}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <select
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>

                    <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-brand-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-foreground mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({itemCount})</span>
                  <span className="font-semibold text-foreground">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold text-success">Free</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <Link href="/checkout" className="block">
                <Button size="lg" className="w-full mb-4">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/products">
                <Button variant="outline" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
