import { MarkdownContent } from '@/lib/markdown';

interface BlogPostContentProps {
  content: string;
}

export function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <MarkdownContent content={content} />
    </div>
  );
}
