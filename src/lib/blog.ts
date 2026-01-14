import { BlogPost } from './types';
import {
  getAllWordPressPosts,
  getWordPressPostBySlug,
  getAllWordPressCategories,
  getAllWordPressTags,
  getWordPressPostsByCategory,
  getWordPressPostsByTag,
  getWordPressRelatedPosts,
  searchWordPressPosts,
} from './wordpress';

/**
 * Get all blog posts sorted by date (newest first)
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  return await getAllWordPressPosts();
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  return await getWordPressPostBySlug(slug);
}

/**
 * Get all unique categories from blog posts
 */
export async function getAllCategories(): Promise<string[]> {
  return await getAllWordPressCategories();
}

/**
 * Get all unique tags from blog posts
 */
export async function getAllTags(): Promise<string[]> {
  return await getAllWordPressTags();
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  return await getWordPressPostsByCategory(category);
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  return await getWordPressPostsByTag(tag);
}

/**
 * Get related posts based on tags and category
 */
export async function getRelatedPosts(
  currentPost: BlogPost,
  limit: number = 3
): Promise<BlogPost[]> {
  return await getWordPressRelatedPosts(currentPost, limit);
}

/**
 * Search posts by query string
 */
export async function searchPosts(query: string): Promise<BlogPost[]> {
  return await searchWordPressPosts(query);
}
