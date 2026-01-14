"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function Footer() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use based on theme
  const isDarkMode = mounted && (theme === "dark" || resolvedTheme === "dark");
  const logoSource = isDarkMode ? "/Rockited_Logo_For_Dark_BKGRND.png" : "/Rock_it_ed_Comp.png";
  return (
    <footer className="bg-card text-foreground py-12 shadow-brand-lg border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block mb-4 hover:opacity-80 transition-opacity">
              <Image
                src={logoSource}
                alt="ROCK IT ED"
                width={200}
                height={56}
                className="h-14 w-auto"
                quality={100}
              />
            </Link>
            <p className="text-muted-foreground text-sm">
              Premium products for modern living. Quality, style, and innovation in every item.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Resources
                </Link>
              </li>
              <li>
                <Link
                  href="/about/shipping"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Shipping Info
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about/returns"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/about/faq"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/about/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/about/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Find recovery resources, support groups, and helpful organizations.
            </p>
            <Link
              href="/resources"
              className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              View All Resources →
            </Link>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} ROCK IT ED. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
