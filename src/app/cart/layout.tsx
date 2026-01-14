import type { Metadata } from 'next';
import { generateCartMetadata } from '@/lib/seo';

export const metadata: Metadata = generateCartMetadata();

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
