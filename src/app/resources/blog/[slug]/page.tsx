import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { SocialShare } from "@/components/blog/SocialShare";
import { BlogStructuredData } from "@/components/seo/BlogStructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/ui/motion";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { generateBlogPostMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    return {};
  }

  return generateBlogPostMetadata(post);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post, 3);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rockited4d.com";
  const postUrl = `${siteUrl}/resources/blog/${post.slug}`;
  const featuredImage = post.featuredImage
    ? post.featuredImage.startsWith("http")
      ? post.featuredImage
      : `${siteUrl}${post.featuredImage}`
    : `${siteUrl}/Rockited4D_New_Hero_Image.webp`;

  return (
    <>
      <BlogStructuredData post={post} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <MotionDiv variant="fadeInUp">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/resources">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Link>
          </Button>
        </MotionDiv>

        {/* Article Header */}
        <MotionDiv variant="fadeInUp" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">{post.category}</Badge>
            {post.tags && post.tags.length > 0 && (
              <>
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{post.title}</h1>

          <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          </div>

          {post.featuredImage && (
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
              <Image
                src={featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            </div>
          )}
        </MotionDiv>

        {/* Article Content */}
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <article className="prose prose-lg max-w-none dark:prose-invert mb-8">
            <BlogPostContent content={post.content} />
          </article>
        </MotionDiv>

        {/* Social Share */}
        <MotionDiv variant="fadeInUp" delay={0.2}>
          <SocialShare
            url={postUrl}
            title={post.title}
            description={post.excerpt}
            image={featuredImage}
          />
        </MotionDiv>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <MotionDiv variant="fadeInUp" delay={0.3}>
            <RelatedPosts posts={relatedPosts} />
          </MotionDiv>
        )}
      </div>
    </>
  );
}
