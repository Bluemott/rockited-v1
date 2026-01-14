import type { Metadata } from 'next';
import { getPostBySlug } from '@/lib/blog';
import { generateBlogPostMetadata } from '@/lib/seo';

interface BlogPostLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostLayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  
  if (!post) {
    return {};
  }

  return generateBlogPostMetadata(post);
}

export default async function BlogPostLayout({ children }: BlogPostLayoutProps) {
  return children;
}
