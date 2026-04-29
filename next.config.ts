import type { NextConfig } from "next";

const parseCsv = (value: string | undefined): string[] =>
  (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const mediaHosts = parseCsv(process.env.NEXT_PUBLIC_MEDIA_HOSTS);
const mediaPath = process.env.NEXT_PUBLIC_MEDIA_PATH_GLOB || "/**";
const staticHosts = ["rockited4d.com", "www.rockited4d.com", "api.rockited4d.com"];
const imageHosts = Array.from(new Set([...staticHosts, ...mediaHosts]));

const imageRemotePatterns = imageHosts.flatMap((hostname) => [
  { protocol: "https" as const, hostname, port: "", pathname: mediaPath },
  { protocol: "http" as const, hostname, port: "", pathname: mediaPath },
]);

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90, 100], // Allow qualities used in the app
    remotePatterns: [
      ...imageRemotePatterns,
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
