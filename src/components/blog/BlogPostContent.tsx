interface BlogPostContentProps {
  content: string;
}

export function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <div
      className="prose prose-lg max-w-none dark:prose-invert
        prose-headings:text-foreground
        prose-p:text-muted-foreground
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground
        prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-muted prose-pre:text-foreground
        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
        prose-img:rounded-lg prose-img:my-6
        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
        prose-li:text-muted-foreground
        prose-hr:border-border"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
