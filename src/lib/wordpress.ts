import { env } from "./env";
import { BlogPost } from "./types";

const WORDPRESS_URL = env.WOOCOMMERCE_URL; // Use same base URL as WooCommerce
const WORDPRESS_API_BASE = `${WORDPRESS_URL}/wp-json/wp/v2`;

// WordPress API response types
interface WordPressPost {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  date: string;
  modified: string;
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{
      name: string;
    }>;
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    "wp:term"?: Array<
      Array<{
        id: number;
        name: string;
        slug: string;
        taxonomy: string;
      }>
    >;
  };
}

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface WordPressMedia {
  id: number;
  source_url: string;
  alt_text: string;
}

/**
 * Fetch WordPress posts from REST API
 */
async function fetchWordPressPosts(
  params: Record<string, string | number | boolean> = {}
): Promise<WordPressPost[]> {
  try {
    const queryParams = new URLSearchParams({
      _embed: "1", // Include embedded resources (author, featured media, terms)
      status: "publish",
      ...params,
    });

    const response = await fetch(`${WORDPRESS_API_BASE}/posts?${queryParams}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching WordPress posts:", error);
    return [];
  }
}

/**
 * Fetch WordPress categories
 */
async function fetchWordPressCategories(): Promise<WordPressCategory[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_BASE}/categories?per_page=100`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching WordPress categories:", error);
    return [];
  }
}

/**
 * Fetch WordPress tags
 */
async function fetchWordPressTags(): Promise<WordPressTag[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_BASE}/tags?per_page=100`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching WordPress tags:", error);
    return [];
  }
}

/**
 * Fetch WordPress media by ID
 */
async function fetchWordPressMedia(mediaId: number): Promise<WordPressMedia | null> {
  try {
    const response = await fetch(`${WORDPRESS_API_BASE}/media/${mediaId}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching WordPress media ${mediaId}:`, error);
    return null;
  }
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Map WordPress post to BlogPost interface
 */
async function mapWordPressPostToBlogPost(wpPost: WordPressPost): Promise<BlogPost> {
  // Extract author name
  const authorName = wpPost._embedded?.author?.[0]?.name || "ROCK IT ED Team";

  // Extract featured image
  let featuredImage = "";
  if (wpPost.featured_media && wpPost._embedded?.["wp:featuredmedia"]?.[0]) {
    featuredImage = wpPost._embedded["wp:featuredmedia"][0].source_url;
  } else if (wpPost.featured_media) {
    // Fallback: fetch media if not embedded
    const media = await fetchWordPressMedia(wpPost.featured_media);
    if (media) {
      featuredImage = media.source_url;
    }
  }

  // Extract categories and tags from embedded terms
  let category = "Recovery"; // Default category
  const tags: string[] = [];

  if (wpPost._embedded?.["wp:term"]) {
    const allTerms = wpPost._embedded["wp:term"]?.flat() || [];
    const categories = allTerms.filter((term) => term.taxonomy === "category");
    const tagTerms = allTerms.filter((term) => term.taxonomy === "post_tag");

    if (categories.length > 0 && categories[0]) {
      category = categories[0].name;
    }

    tags.push(...tagTerms.map((tag) => tag.name));
  } else {
    // Fallback: fetch categories and tags if not embedded
    if (wpPost.categories.length > 0) {
      const categories = await fetchWordPressCategories();
      const postCategory = categories.find((cat) => cat.id === wpPost.categories[0]);
      if (postCategory) {
        category = postCategory.name;
      }
    }

    if (wpPost.tags.length > 0) {
      const allTags = await fetchWordPressTags();
      const postTags = allTags.filter((tag) => wpPost.tags.includes(tag.id));
      tags.push(...postTags.map((tag) => tag.name));
    }
  }

  // Extract SEO keywords from tags
  const seoKeywords = tags.length > 0 ? tags : [];

  return {
    id: wpPost.id.toString(),
    slug: wpPost.slug,
    title: stripHtml(wpPost.title.rendered),
    excerpt: stripHtml(wpPost.excerpt.rendered),
    content: wpPost.content.rendered, // Keep HTML for rendering
    author: authorName,
    publishedAt: new Date(wpPost.date),
    updatedAt: new Date(wpPost.modified),
    tags,
    category,
    featuredImage,
    seoKeywords,
  };
}

/**
 * Get all blog posts from WordPress
 */
export async function getAllWordPressPosts(): Promise<BlogPost[]> {
  try {
    const wpPosts = await fetchWordPressPosts({ per_page: 100 });

    // Map all posts
    const posts = await Promise.all(wpPosts.map((wpPost) => mapWordPressPostToBlogPost(wpPost)));

    // Sort by published date (newest first)
    return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  } catch (error) {
    console.error("Error getting all WordPress posts:", error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export async function getWordPressPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const wpPosts = await fetchWordPressPosts({ slug, per_page: 1 });

    if (wpPosts.length === 0) {
      return null;
    }

    const firstPost = wpPosts[0];
    if (!firstPost) {
      return null;
    }

    return await mapWordPressPostToBlogPost(firstPost);
  } catch (error) {
    console.error(`Error getting WordPress post by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Get all WordPress categories
 */
export async function getAllWordPressCategories(): Promise<string[]> {
  try {
    const categories = await fetchWordPressCategories();
    return categories
      .filter((cat) => cat.count > 0) // Only include categories with posts
      .map((cat) => cat.name)
      .sort();
  } catch (error) {
    console.error("Error getting WordPress categories:", error);
    return [];
  }
}

/**
 * Get all WordPress tags
 */
export async function getAllWordPressTags(): Promise<string[]> {
  try {
    const tags = await fetchWordPressTags();
    return tags
      .filter((tag) => tag.count > 0) // Only include tags with posts
      .map((tag) => tag.name)
      .sort();
  } catch (error) {
    console.error("Error getting WordPress tags:", error);
    return [];
  }
}

/**
 * Get posts by category
 */
export async function getWordPressPostsByCategory(categoryName: string): Promise<BlogPost[]> {
  try {
    // First, find the category ID
    const categories = await fetchWordPressCategories();
    const category = categories.find((cat) => cat.name === categoryName);

    if (!category) {
      return [];
    }

    const wpPosts = await fetchWordPressPosts({ categories: category.id, per_page: 100 });

    return await Promise.all(wpPosts.map((wpPost) => mapWordPressPostToBlogPost(wpPost)));
  } catch (error) {
    console.error(`Error getting WordPress posts by category ${categoryName}:`, error);
    return [];
  }
}

/**
 * Get posts by tag
 */
export async function getWordPressPostsByTag(tagName: string): Promise<BlogPost[]> {
  try {
    // First, find the tag ID
    const tags = await fetchWordPressTags();
    const tag = tags.find((t) => t.name === tagName);

    if (!tag) {
      return [];
    }

    const wpPosts = await fetchWordPressPosts({ tags: tag.id, per_page: 100 });

    return await Promise.all(wpPosts.map((wpPost) => mapWordPressPostToBlogPost(wpPost)));
  } catch (error) {
    console.error(`Error getting WordPress posts by tag ${tagName}:`, error);
    return [];
  }
}

/**
 * Get related posts based on categories and tags
 */
export async function getWordPressRelatedPosts(
  currentPost: BlogPost,
  limit: number = 3
): Promise<BlogPost[]> {
  try {
    const allPosts = await getAllWordPressPosts();

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
  } catch (error) {
    console.error("Error getting related WordPress posts:", error);
    return [];
  }
}

/**
 * Search posts by query string
 */
export async function searchWordPressPosts(query: string): Promise<BlogPost[]> {
  try {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return await getAllWordPressPosts();
    }

    // WordPress REST API supports search parameter
    const wpPosts = await fetchWordPressPosts({ search: lowerQuery, per_page: 100 });

    const posts = await Promise.all(wpPosts.map((wpPost) => mapWordPressPostToBlogPost(wpPost)));

    // Additional client-side filtering for better results
    return posts.filter((post) => {
      const titleMatch = post.title.toLowerCase().includes(lowerQuery);
      const excerptMatch = post.excerpt.toLowerCase().includes(lowerQuery);
      const tagMatch = post.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
      const categoryMatch = post.category.toLowerCase().includes(lowerQuery);

      return titleMatch || excerptMatch || tagMatch || categoryMatch;
    });
  } catch (error) {
    console.error(`Error searching WordPress posts for "${query}":`, error);
    return [];
  }
}
