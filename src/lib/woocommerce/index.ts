// Barrel export for WooCommerce API functions
// This maintains backward compatibility while organizing code into smaller modules

// Export API client
export { wooApi } from "./client";

// Export product functions
export {
  getProducts,
  getProduct,
  getProductBySlug,
  getCategories,
  getCategoryBySlug,
  getFeaturedProducts,
  getProductVariations,
  getProductVariation,
  type ProductQueryParams,
  type CategoryQueryParams,
  type VariationQueryParams,
} from "./products";

// Export review functions
export { getProductReviews, createProductReview, type ReviewQueryParams } from "./reviews";

// Export inventory functions
export { checkInventory } from "./inventory";

// Export shipping functions
export {
  getShippingZones,
  getShippingZoneMethods,
  calculateShipping,
  getShippingMethods,
} from "./shipping";
