"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

import { trackPageView } from "@/lib/analytics";
import { hasAnalyticsConsent } from "@/lib/cookies";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [consentGiven, setConsentGiven] = useState(false);

  // Check consent status on mount and when it changes
  useEffect(() => {
    const checkConsent = () => {
      setConsentGiven(hasAnalyticsConsent());
    };

    checkConsent();

    // Listen for consent changes (e.g., when user accepts/declines)
    const interval = setInterval(checkConsent, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Track page views on route changes (only if consent given)
    if (measurementId && consentGiven && pathname) {
      trackPageView(pathname);
    }
  }, [pathname, measurementId, consentGiven]);

  // Don't render anything if no measurement ID is set or consent not given
  if (!measurementId || !consentGiven) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
