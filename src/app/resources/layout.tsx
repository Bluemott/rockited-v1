import type { Metadata } from 'next';
import { generateResourcesMetadata } from '@/lib/seo';

export const metadata: Metadata = generateResourcesMetadata();

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
