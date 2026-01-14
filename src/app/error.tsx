"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Home, ShoppingBag, RefreshCw, AlertCircle } from "lucide-react";

// Note: Error boundaries in Next.js must be client components and cannot export metadata.
// The generateErrorMetadata() function is available in @/lib/seo.ts and can be used
// in a layout or other server component if error page-specific metadata is needed.

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        <MotionDiv variant="fadeInUp" className="text-center">
          <Card className="overflow-hidden">
            <CardContent className="pt-12 pb-8 px-6">
              {/* Error Icon */}
              <MotionDiv variant="scaleIn" delay={0.1}>
                <div className="mb-8 flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                  </div>
                </div>
              </MotionDiv>

              {/* Error Message */}
              <MotionDiv variant="fadeInUp" delay={0.2}>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Something Went Wrong
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                  We encountered an unexpected error. Don't worry, our team has been notified and
                  we're working to fix it.
                </p>
              </MotionDiv>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === "development" && error.message && (
                <MotionDiv variant="fadeInUp" delay={0.25}>
                  <Alert variant="destructive" className="mb-8 text-left">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Details</AlertTitle>
                    <AlertDescription className="mt-2">
                      <code className="text-xs break-all">{error.message}</code>
                      {error.digest && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">Error ID: </span>
                          <code className="text-xs">{error.digest}</code>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </MotionDiv>
              )}

              {/* Action Buttons */}
              <MotionDiv variant="fadeInUp" delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" onClick={reset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" size="lg" asChild>
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
                </div>
              </MotionDiv>

              {/* Helpful Links */}
              <MotionDiv variant="fadeInUp" delay={0.4}>
                <div className="mt-12 pt-8 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4">
                    Need help? Check out these resources:
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Link href="/about/faq" className="text-sm text-primary hover:underline">
                      FAQ
                    </Link>
                    <Link href="/about/contact" className="text-sm text-primary hover:underline">
                      Contact Support
                    </Link>
                    <Link
                      href="/about/customer-service"
                      className="text-sm text-primary hover:underline"
                    >
                      Customer Service
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
