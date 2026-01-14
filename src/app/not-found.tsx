import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { Home, ShoppingBag } from "lucide-react";
import { generateNotFoundMetadata } from "@/lib/seo";
import GoBackButton from "@/components/ui/GoBackButton";

export const metadata: Metadata = generateNotFoundMetadata();

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        <MotionDiv variant="fadeInUp" className="text-center">
          <Card className="overflow-hidden">
            <CardContent className="pt-12 pb-8 px-6">
              {/* 404 Number Display */}
              <MotionDiv variant="scaleIn" delay={0.1}>
                <div className="mb-8">
                  <h1 className="text-9xl md:text-[12rem] font-bold text-primary/20 leading-none">
                    404
                  </h1>
                </div>
              </MotionDiv>

              {/* Error Message */}
              <MotionDiv variant="fadeInUp" delay={0.2}>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Page Not Found
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                  The page you're looking for doesn't exist or has been moved. Let's get you back on
                  track.
                </p>
              </MotionDiv>

              {/* Action Buttons */}
              <MotionDiv variant="fadeInUp" delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" asChild>
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Go Home
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/products">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Browse Products
                    </Link>
                  </Button>
                  <GoBackButton />
                </div>
              </MotionDiv>

              {/* Helpful Links */}
              <MotionDiv variant="fadeInUp" delay={0.4}>
                <div className="mt-12 pt-8 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4">You might be looking for:</p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Link href="/products" className="text-sm text-primary hover:underline">
                      All Products
                    </Link>
                    <Link href="/about" className="text-sm text-primary hover:underline">
                      About Us
                    </Link>
                    <Link href="/about/contact" className="text-sm text-primary hover:underline">
                      Contact
                    </Link>
                    <Link href="/about/faq" className="text-sm text-primary hover:underline">
                      FAQ
                    </Link>
                  </div>
                </div>
              </MotionDiv>
            </CardContent>
          </Card>
        </MotionDiv>
      </div>
    </div>
  );
}
