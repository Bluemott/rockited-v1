"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

const faqItems = [
  {
    question: "What is your return policy?",
    answer:
      "We offer a 30-day return policy on all products. Items must be in their original condition with tags attached. Please visit our Returns page for more detailed information.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Standard shipping typically takes 5-7 business days. We also offer express shipping (2-3 business days) and overnight delivery where available. Free shipping is available on orders over $50.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Currently, we ship within the United States. We are working on expanding our shipping options to include international destinations. Please check back soon for updates.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, PayPal, and other secure payment methods. All transactions are processed securely through our payment partners.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once your order ships, you will receive a tracking number via email. You can use this number to track your package in real-time through our shipping partners.",
  },
  {
    question: "What if I receive a damaged item?",
    answer:
      "If you receive a damaged item, please contact our customer service team immediately. We will arrange for a replacement or full refund at no cost to you.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "You can cancel your order within 24 hours of placing it, provided it has not yet shipped. Once an order has shipped, you can return it using our standard return process.",
  },
  {
    question: "Do you offer gift wrapping?",
    answer:
      "Yes, we offer gift wrapping services for an additional fee. You can select this option during checkout. Gift messages can also be included.",
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <MotionDiv variant="fadeInUp" className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions about our products, shipping, returns, and more.
        </p>
      </MotionDiv>

      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <MotionDiv key={index} variant="fadeInUp" delay={index * 0.1}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-accent/50 transition-colors"
                  aria-expanded={openItems.includes(index)}
                >
                  <h3 className="text-lg font-semibold text-foreground pr-4">{item.question}</h3>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-muted-foreground shrink-0 transition-transform",
                      openItems.includes(index) && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    openItems.includes(index) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        ))}
      </div>

      <MotionDiv variant="fadeInUp" delay={0.8} className="mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">Still have questions?</h2>
              <p className="text-muted-foreground mb-4">
                Can&apos;t find what you&apos;re looking for? Our customer service team is here to help.
              </p>
              <a
                href="/about/contact"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </CardContent>
        </Card>
      </MotionDiv>
    </div>
  );
}
