import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90, 100], // Allow qualities used in the app
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rockited4d.com",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.rockited4d.com",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api.rockited4d.com",
        port: "",
        pathname: "/wp-content/uploads/**",
      },
      // Development/localhost patterns
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "",
        pathname: "/**",
      },
      // Development: Allow IP address for Lightsail (temporary - should be replaced with domain)
      {
        protocol: "http",
        hostname: "52.23.226.128",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "52.23.226.128",
        port: "",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: ["@woocommerce/woocommerce-rest-api"],
  async headers() {
    return [
      // SEO headers for sitemap and robots.txt
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
      // Stripe PCI compliance: allow Stripe domains for Payment Element, Checkout, and webhooks
      {
        source: "/checkout",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "connect-src 'self' https://checkout.stripe.com https://api.stripe.com https://*.stripe.com",
              "frame-src 'self' https://checkout.stripe.com https://js.stripe.com https://hooks.stripe.com https://*.js.stripe.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.stripe.com https://js.stripe.com https://*.js.stripe.com",
              "img-src 'self' data: https: https://*.stripe.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
