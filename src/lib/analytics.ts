"use client";

import { hasAnalyticsConsent } from "./cookies";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Initialize Google Analytics (called when consent is given)
 * Note: The script is loaded via Next.js Script component, this just ensures gtag is available
 */
export function initGA(measurementId: string): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) {
    return;
  }

  // Initialize dataLayer if not already done
  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (!window.gtag) {
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    }
    window.gtag = gtag;
  }

  // Configure GA
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    page_path: window.location.pathname,
  });
}

/**
 * Track a page view
 */
export function trackPageView(url: string): void {
  if (typeof window === "undefined" || !window.gtag || !hasAnalyticsConsent()) {
    return;
  }

  window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "", {
    page_path: url,
  });
}

/**
 * Track a custom event
 */
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.gtag || !hasAnalyticsConsent()) {
    return;
  }

  window.gtag("event", eventName, eventParams);
}

/**
 * Track product view
 */
export function trackProductView(product: {
  id: number;
  name: string;
  price: number;
  category?: string;
}): void {
  trackEvent("view_item", {
    currency: "USD",
    value: product.price,
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: 1,
      },
    ],
  });
}

/**
 * Track add to cart event
 */
export function trackAddToCart(item: {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}): void {
  trackEvent("add_to_cart", {
    currency: "USD",
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.id.toString(),
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity,
      },
    ],
  });
}

/**
 * Track begin checkout event
 */
export function trackBeginCheckout(
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>
): void {
  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  trackEvent("begin_checkout", {
    currency: "USD",
    value: totalValue,
    items: items.map((item) => ({
      item_id: item.id.toString(),
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

/**
 * Track purchase event
 */
export function trackPurchase(transaction: {
  transactionId: string;
  value: number;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
}): void {
  trackEvent("purchase", {
    transaction_id: transaction.transactionId,
    value: transaction.value,
    currency: "USD",
    items: transaction.items.map((item) => ({
      item_id: item.id.toString(),
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}
