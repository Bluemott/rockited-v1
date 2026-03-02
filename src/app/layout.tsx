import type { Metadata } from "next";
import { Noto_Serif, Montserrat } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";

import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import CookieConsent from "@/components/consent/CookieConsent";
import Layout from "@/components/layout/Layout";
import StructuredData from "@/components/seo/StructuredData";
import { generateHomeMetadata } from "@/lib/seo";

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = generateHomeMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSerif.variable} ${montserrat.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StructuredData type="organization" />
          <StructuredData type="website" />
          <GoogleAnalytics />
          <Layout>{children}</Layout>
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
