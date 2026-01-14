import { WooProduct, WooCategory } from "./types";

/**
 * Optimize meta description to be between minLength and maxLength characters
 * Strips HTML tags, truncates at word boundaries, and ensures optimal length
 */
export function optimizeMetaDescription(
  text: string,
  minLength: number = 150,
  maxLength: number = 160
): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Strip HTML tags and decode HTML entities
  let cleanText = text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;/g, "&") // Decode &amp;
    .replace(/&lt;/g, "<") // Decode &lt;
    .replace(/&gt;/g, ">") // Decode &gt;
    .replace(/&quot;/g, '"') // Decode &quot;
    .replace(/&#39;/g, "'") // Decode &#39;
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();

  // If text is already within range, return it
  if (cleanText.length >= minLength && cleanText.length <= maxLength) {
    return cleanText;
  }

  // If text is too short, pad with meaningful content (if possible)
  if (cleanText.length < minLength) {
    // For very short text, we'll return it as-is since padding artificially
    // would reduce quality. The caller should handle this case.
    return cleanText;
  }

  // If text is too long, truncate at word boundary
  if (cleanText.length > maxLength) {
    // Truncate to maxLength
    let truncated = cleanText.substring(0, maxLength);

    // Find the last space before maxLength to avoid cutting words
    const lastSpace = truncated.lastIndexOf(" ");

    // If we found a space and it's reasonably close to maxLength (within 20 chars)
    if (lastSpace > maxLength - 20 && lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }

    // Remove trailing punctuation that might look awkward
    truncated = truncated.replace(/[.,;:!?]+$/, "");

    // Ensure we're still within maxLength after cleanup
    if (truncated.length > maxLength) {
      truncated = truncated.substring(0, maxLength);
    }

    return truncated.trim();
  }

  return cleanText;
}

/**
 * Extract keywords from text for SEO purposes
 * Simple keyword extraction - can be enhanced later
 */
export function extractKeywords(text: string): string[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  // Remove HTML and normalize
  const cleanText = text
    .replace(/<[^>]*>/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Split into words and filter out common stop words
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "were",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "may",
    "might",
    "must",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "what",
    "which",
    "who",
    "when",
    "where",
    "why",
    "how",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "up",
    "down",
    "out",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
  ]);

  const words = cleanText.split(/\s+/).filter((word) => {
    return word.length > 2 && !stopWords.has(word);
  });

  // Count word frequency and return unique words
  return [...new Set(words)];
}

/**
 * Generate breadcrumbs for a product page
 * Includes: Home → Products → [Category] → Product Name
 */
export function generateProductBreadcrumbs(
  product: WooProduct,
  siteConfig: { url: string; name: string }
): Array<{ name: string; url: string }> {
  const breadcrumbs: Array<{ name: string; url: string }> = [
    { name: "Home", url: siteConfig.url },
    { name: "Products", url: `${siteConfig.url}/products` },
  ];

  // Add category if product has categories
  if (product.categories && product.categories.length > 0) {
    // Use the first category (primary category)
    const category = product.categories[0];
    if (category) {
      // Note: Category pages don't exist yet, but we'll use the slug format
      // When category pages are implemented, this will work automatically
      breadcrumbs.push({
        name: category.name,
        url: `${siteConfig.url}/products?category=${category.slug}`,
      });
    }
  }

  // Add product name
  breadcrumbs.push({
    name: product.name,
    url: `${siteConfig.url}/products/${product.slug}`,
  });

  return breadcrumbs;
}

/**
 * Generate breadcrumbs for a category page
 * Includes: Home → Products → Category Name
 * Ready for when category pages are implemented
 */
export function generateCategoryBreadcrumbs(
  category: WooCategory,
  siteConfig: { url: string; name: string }
): Array<{ name: string; url: string }> {
  return [
    { name: "Home", url: siteConfig.url },
    { name: "Products", url: `${siteConfig.url}/products` },
    {
      name: category.name,
      url: `${siteConfig.url}/products/category/${category.slug}`,
    },
  ];
}

/**
 * Validate and format breadcrumb items
 * Ensures proper URL formatting and validates structure
 */
export function generateBreadcrumbs(
  items: Array<{ name: string; url: string }>
): Array<{ name: string; url: string }> {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items
    .filter((item) => item && item.name && item.url)
    .map((item) => ({
      name: String(item.name).trim(),
      url: String(item.url).trim(),
    }))
    .filter((item) => item.name.length > 0 && item.url.length > 0);
}
