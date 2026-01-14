import { BlogPost } from './types';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'src/content/blog');

/**
 * Get all blog posts sorted by date (newest first)
 */
export function getAllPosts(): BlogPost[] {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
          id: data.id || fileName.replace(/\.md$/, ''),
          slug: data.slug || fileName.replace(/\.md$/, ''),
          title: data.title || '',
          excerpt: data.excerpt || '',
          content,
          author: data.author || 'ROCK IT ED Team',
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          tags: data.tags || [],
          category: data.category || 'Recovery',
          featuredImage: data.featuredImage || '',
          seoKeywords: data.seoKeywords || [],
        } as BlogPost;
      })
      .filter((post) => post.title) // Only include posts with titles
      .sort((a, b) => {
        return b.publishedAt.getTime() - a.publishedAt.getTime();
      });

    return allPostsData;
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const allPosts = getAllPosts();
    return allPosts.find((post) => post.slug === slug) || null;
  } catch (error) {
    console.error('Error getting post by slug:', error);
    return null;
  }
}

/**
 * Get all unique categories from blog posts
 */
export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set<string>();
  posts.forEach((post) => {
    if (post.category) {
      categories.add(post.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Get all unique tags from blog posts
 */
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach((post) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag) => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
}

/**
 * Get posts by category
 */
export function getPostsByCategory(category: string): BlogPost[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) => post.category === category);
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): BlogPost[] {
  const allPosts = getAllPosts();
  return allPosts.filter(
    (post) => post.tags && Array.isArray(post.tags) && post.tags.includes(tag)
  );
}

/**
 * Get related posts based on tags and category
 */
export function getRelatedPosts(currentPost: BlogPost, limit: number = 3): BlogPost[] {
  const allPosts = getAllPosts();
  const related = allPosts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => {
      let score = 0;
      
      // Score based on shared tags
      if (currentPost.tags && post.tags) {
        const sharedTags = currentPost.tags.filter((tag) => post.tags?.includes(tag));
        score += sharedTags.length * 2;
      }
      
      // Score based on same category
      if (currentPost.category === post.category) {
        score += 1;
      }
      
      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);

  return related;
}

/**
 * Search posts by query string
 */
export function searchPosts(query: string): BlogPost[] {
  const allPosts = getAllPosts();
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return allPosts;
  }

  return allPosts.filter((post) => {
    const titleMatch = post.title.toLowerCase().includes(lowerQuery);
    const excerptMatch = post.excerpt.toLowerCase().includes(lowerQuery);
    const contentMatch = post.content.toLowerCase().includes(lowerQuery);
    const tagMatch = post.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
    const categoryMatch = post.category.toLowerCase().includes(lowerQuery);
    
    return titleMatch || excerptMatch || contentMatch || tagMatch || categoryMatch;
  });
}
