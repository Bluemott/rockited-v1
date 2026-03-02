import { RotateCcw, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { RETURN_POLICY_SUMMARY } from "@/lib/content/returns";
import { generateReturnsMetadata } from "@/lib/seo";

export const metadata: Metadata = generateReturnsMetadata();

export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Returns & Refunds</h1>
        <p className="text-lg text-muted-foreground">
          {RETURN_POLICY_SUMMARY} Below are the full details and how to process a return or refund.
        </p>
      </MotionDiv>

      <div className="space-y-6">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <RotateCcw className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    30-Day Return Policy
                  </h2>
                  <p className="text-muted-foreground">
                    We offer a 30-day return policy on all products. If you&apos;re not completely
                    satisfied with your purchase, you can return it within 30 days of delivery for a
                    full refund or exchange.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.2}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Return Conditions</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Original Condition</p>
                      <p className="text-muted-foreground text-sm">
                        Items must be in their original condition, unused, and with all tags
                        attached.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Original Packaging</p>
                      <p className="text-muted-foreground text-sm">
                        Items should be returned in their original packaging when possible.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Proof of Purchase</p>
                      <p className="text-muted-foreground text-sm">
                        Please include your order number or receipt with your return.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.3}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  How to Return an Item
                </h2>
                <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
                  <li>
                    Contact our customer service team to initiate a return. You can reach us at
                    support@rockited.com or call (555) 123-4567.
                  </li>
                  <li>
                    We&apos;ll provide you with a return authorization number and return shipping label.
                  </li>
                  <li>Package the item securely in its original packaging (if available).</li>
                  <li>
                    Include the return authorization number and your order number in the package.
                  </li>
                  <li>Ship the item back using the provided return label.</li>
                  <li>
                    Once we receive and inspect the item, we&apos;ll process your refund within 5-7
                    business days.
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.4}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Refund Processing</h2>
                  <p className="text-muted-foreground mb-4">
                    Refunds will be processed to the original payment method used for the purchase.
                    Processing times may vary:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                    <li>
                      Credit/Debit Cards: 5-7 business days after we receive the returned item
                    </li>
                    <li>PayPal: 3-5 business days after we receive the returned item</li>
                    <li>Bank transfers: 7-10 business days after we receive the returned item</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.5}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Non-Returnable Items
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    The following items cannot be returned:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Items that have been used, damaged, or altered</li>
                    <li>Items without original packaging or tags</li>
                    <li>Items returned after 30 days from delivery</li>
                    <li>Personalized or custom-made items (unless defective)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.6}>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Need Help with a Return?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our customer service team is here to assist you with any questions about returns
                  or refunds.
                </p>
                <a
                  href="/about/contact"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Contact Customer Service
                </a>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </div>
    </div>
  );
}
