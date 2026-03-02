import { BlogPost } from "@/lib/types";

import { BlogCard } from "./BlogCard";

interface RelatedPostsProps {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-8 border-t">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Related Articles</h2>
        <p className="text-muted-foreground">
          Continue exploring recovery topics with these related articles.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
