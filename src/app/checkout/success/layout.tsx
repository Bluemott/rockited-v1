import type { Metadata } from 'next';
import { generateCheckoutSuccessMetadata } from '@/lib/seo';

export const metadata: Metadata = generateCheckoutSuccessMetadata();

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
