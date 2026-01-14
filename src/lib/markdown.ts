'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

/**
 * Render markdown content as React components
 */
export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-4xl font-bold text-foreground mt-8 mb-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-3xl font-bold text-foreground mt-6 mb-3" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-2xl font-semibold text-foreground mt-5 mb-2" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-xl font-semibold text-foreground mt-4 mb-2" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="text-base text-muted-foreground mb-4 leading-relaxed" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside mb-4 space-y-2 text-muted-foreground" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 text-muted-foreground" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="ml-4" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4"
            {...props}
          />
        ),
        code: ({ node, inline, ...props }: any) => {
          if (inline) {
            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                {...props}
              />
            );
          }
          return (
            <code
              className="block bg-muted p-4 rounded-lg text-sm font-mono text-foreground overflow-x-auto my-4"
              {...props}
            />
          );
        },
        pre: ({ node, ...props }) => (
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4" {...props} />
        ),
        a: ({ node, ...props }: any) => (
          <a
            className="text-primary hover:text-primary/80 underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        img: ({ node, ...props }: any) => (
          <img
            className="rounded-lg my-6 max-w-full h-auto"
            alt={props.alt || ''}
            {...props}
          />
        ),
        hr: ({ node, ...props }) => (
          <hr className="my-6 border-border" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-semibold text-foreground" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
