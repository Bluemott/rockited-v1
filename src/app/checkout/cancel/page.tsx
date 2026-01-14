import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { generateCheckoutCancelMetadata } from "@/lib/seo";

export const metadata: Metadata = generateCheckoutCancelMetadata();

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
          <p className="text-lg text-gray-600 mb-4">
            Your payment was cancelled. No charges have been made to your account.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
          <div className="space-y-2 text-left">
            <p className="text-gray-600">
              If you're experiencing issues with checkout, please try:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Check your internet connection</li>
              <li>Verify your payment information</li>
              <li>Try a different payment method</li>
              <li>Contact our support team</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cart">
            <Button size="lg">Return to Cart</Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
