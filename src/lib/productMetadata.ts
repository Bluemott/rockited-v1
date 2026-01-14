import { WooProduct, WooMetaData } from "./types";

/**
 * Extract metadata from WooCommerce product meta_data array
 */
export function extractMetadata(product: WooProduct): Record<string, any> {
  if (!product.meta_data || product.meta_data.length === 0) {
    return {};
  }

  const metadata: Record<string, any> = {};

  product.meta_data.forEach((meta: WooMetaData) => {
    try {
      // Try to parse JSON values, fallback to string
      let value: any = meta.value;
      if (typeof meta.value === "string") {
        // Check if it's JSON
        if (meta.value.startsWith("{") || meta.value.startsWith("[")) {
          try {
            value = JSON.parse(meta.value);
          } catch {
            // Not JSON, keep as string
            value = meta.value;
          }
        }
      }
      metadata[meta.key] = value;
    } catch (error) {
      console.error(`Error parsing metadata key ${meta.key}:`, error);
      metadata[meta.key] = meta.value;
    }
  });

  return metadata;
}

/**
 * Get brand information from metadata
 */
export function getBrandFromMetadata(product: WooProduct): string | null {
  const metadata = extractMetadata(product);

  // Common brand metadata keys
  const brandKeys = [
    "brand",
    "_product_brand",
    "pa_brand",
    "product_brand",
    "woocommerce_brand",
    "brand_name",
    "_brand",
  ];

  for (const key of brandKeys) {
    if (metadata[key]) {
      const brand = metadata[key];
      return typeof brand === "string" ? brand : String(brand);
    }
  }

  return null;
}

/**
 * Get custom fields for display
 */
export function getCustomFields(
  product: WooProduct
): Array<{ key: string; label: string; value: any }> {
  const metadata = extractMetadata(product);
  const customFields: Array<{ key: string; label: string; value: any }> = [];

  // Also include any ACF (Advanced Custom Fields) keys
  Object.keys(metadata).forEach((key) => {
    if (key.startsWith("_") && !key.startsWith("__")) {
      // Skip private/internal fields unless they're displayable
      return;
    }

    const value = metadata[key];

    // Skip empty values
    if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
      return;
    }

    // Create a human-readable label
    const label = key
      .replace(/^_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    customFields.push({
      key,
      label,
      value,
    });
  });

  return customFields;
}

/**
 * Generate SEO keywords from product data
 */
export function getSEOKeywords(product: WooProduct): string[] {
  const keywords: string[] = [];

  // Add product name
  if (product.name) {
    keywords.push(product.name);
    // Add individual words from product name
    keywords.push(...product.name.toLowerCase().split(/\s+/));
  }

  // Add categories
  if (product.categories) {
    product.categories.forEach((category) => {
      keywords.push(category.name);
    });
  }

  // Add tags
  if (product.tags) {
    product.tags.forEach((tag) => {
      keywords.push(tag.name);
    });
  }

  // Add brand from metadata
  const brand = getBrandFromMetadata(product);
  if (brand) {
    keywords.push(brand);
  }

  // Add SKU
  if (product.sku) {
    keywords.push(product.sku);
  }

  // Remove duplicates and empty strings
  return [...new Set(keywords.filter((k) => k && k.trim().length > 0))];
}

/**
 * Get product condition from metadata
 */
export function getProductCondition(product: WooProduct): string {
  const metadata = extractMetadata(product);

  const conditionKeys = [
    "condition",
    "_product_condition",
    "pa_condition",
    "product_condition",
    "item_condition",
  ];

  for (const key of conditionKeys) {
    if (metadata[key]) {
      const condition = metadata[key];
      return typeof condition === "string" ? condition : String(condition);
    }
  }

  return "new"; // Default to new
}

/**
 * Get warranty information from metadata
 */
export function getWarrantyInfo(product: WooProduct): string | null {
  const metadata = extractMetadata(product);

  const warrantyKeys = [
    "warranty",
    "_product_warranty",
    "pa_warranty",
    "product_warranty",
    "warranty_period",
  ];

  for (const key of warrantyKeys) {
    if (metadata[key]) {
      const warranty = metadata[key];
      return typeof warranty === "string" ? warranty : String(warranty);
    }
  }

  return null;
}

/**
 * Get custom Open Graph image from metadata
 */
export function getCustomOGImage(product: WooProduct): string | null {
  const metadata = extractMetadata(product);

  const imageKeys = [
    "og_image",
    "_og_image",
    "open_graph_image",
    "_open_graph_image",
    "social_image",
    "_social_image",
  ];

  for (const key of imageKeys) {
    if (metadata[key]) {
      const image = metadata[key];
      const imageUrl = typeof image === "string" ? image : String(image);
      if (imageUrl && imageUrl.startsWith("http")) {
        return imageUrl;
      }
    }
  }

  return null;
}

/**
 * Get SEO meta description override from metadata
 */
export function getSEOMetaDescription(product: WooProduct): string | null {
  const metadata = extractMetadata(product);

  const descKeys = [
    "meta_description",
    "_meta_description",
    "seo_description",
    "_seo_description",
    "yoast_wpseo_metadesc",
    "rank_math_description",
  ];

  for (const key of descKeys) {
    if (metadata[key]) {
      const desc = metadata[key];
      return typeof desc === "string" ? desc : String(desc);
    }
  }

  return null;
}

/**
 * Get all metadata as a structured object with common fields
 */
export function getStructuredMetadata(product: WooProduct) {
  return {
    brand: getBrandFromMetadata(product),
    condition: getProductCondition(product),
    warranty: getWarrantyInfo(product),
    customOGImage: getCustomOGImage(product),
    seoDescription: getSEOMetaDescription(product),
    customFields: getCustomFields(product),
    keywords: getSEOKeywords(product),
    raw: extractMetadata(product),
  };
}
