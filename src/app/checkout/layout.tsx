import type { Metadata } from 'next';
import { generateCheckoutMetadata } from '@/lib/seo';

export const metadata: Metadata = generateCheckoutMetadata();

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
