import Link from "next/link";
import Image from "next/image";
import { Calendar, User, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlogPost } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rockited4d.com";
  const featuredImage = post.featuredImage
    ? post.featuredImage.startsWith("http")
      ? post.featuredImage
      : `${siteUrl}${post.featuredImage}`
    : `${siteUrl}/Rockited4D_New_Hero_Image.webp`;

  return (
    <Link href={`/resources/blog/${post.slug}`}>
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
        {post.featuredImage && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <Image
              src={featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <CardContent className="pt-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {post.category}
            </Badge>
          </div>

          <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">{post.title}</h3>

          <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-3">{post.excerpt}</p>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{post.author}</span>
              </div>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-2 w-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
