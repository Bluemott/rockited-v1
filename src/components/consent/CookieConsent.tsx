"use client";

import { Cookie } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { initGA } from "@/lib/analytics";
import { getConsentStatus, setConsentStatus } from "@/lib/cookies";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
    const consent = getConsentStatus();

    // Only show banner if consent hasn't been given yet
    if (consent === null) {
      queueMicrotask(() => setShowBanner(true));
    }
  }, []);

  const handleAccept = () => {
    setConsentStatus("accepted");
    setShowBanner(false);

    // Initialize GA if measurement ID is available
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (measurementId) {
      initGA(measurementId);
    }
  };

  const handleDecline = () => {
    setConsentStatus("declined");
    setShowBanner(false);
  };

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-lg border-2">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="hidden md:block">
                <Cookie className="h-6 w-6 text-primary mt-1" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Cookie Consent</h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your browsing experience, analyze site traffic, and
                  personalize content. By clicking &quot;Accept&quot;, you consent to our use of
                  cookies. You can decline, but some features may not work properly.
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button onClick={handleAccept} size="sm" className="flex-1 md:flex-none">
                Accept
              </Button>
              <Button
                onClick={handleDecline}
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none"
              >
                Decline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
