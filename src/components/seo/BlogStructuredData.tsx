import { BlogPost } from '@/lib/types';

interface BlogStructuredDataProps {
  post: BlogPost;
}

export function BlogStructuredData({ post }: BlogStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rockited4d.com';
  const postUrl = `${siteUrl}/resources/blog/${post.slug}`;
  const featuredImage = post.featuredImage 
    ? (post.featuredImage.startsWith('http') ? post.featuredImage : `${siteUrl}${post.featuredImage}`)
    : `${siteUrl}/Rockited4D_New_Hero_Image.webp`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: featuredImage,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ROCK IT ED',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/Rockited_Logo_For_Dark_BKGRND.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    keywords: post.seoKeywords && post.seoKeywords.length > 0 
      ? post.seoKeywords.join(', ')
      : post.tags?.join(', ') || '',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
    />
  );
}
