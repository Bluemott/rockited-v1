import type { Metadata } from "next";

import { generateFAQMetadata } from "@/lib/seo";

export const metadata: Metadata = generateFAQMetadata();

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
