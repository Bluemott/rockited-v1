import type { WooProduct } from "../types";
import { wooProductSchema, wooProductsSchema } from "../schemas/external";

import { wooApi } from "./client";

// Product query parameters
export interface ProductQueryParams {
  per_page?: number;
  page?: number;
  category?: number | string;
  featured?: boolean;
  orderby?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: string;
  slug?: string;
  [key: string]: unknown;
}

// Category query parameters
export interface CategoryQueryParams {
  per_page?: number;
  page?: number;
  slug?: string;
  [key: string]: unknown;
}

// Product API functions
export const getProducts = async (params: ProductQueryParams = {}): Promise<WooProduct[]> => {
  try {
    const response = await wooApi.get("products", {
      per_page: params.per_page || 10,
      page: params.page || 1,
      status: "publish",
      ...params,
    });
    return wooProductsSchema.parse(response.data) as unknown as WooProduct[];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getProduct = async (id: number): Promise<WooProduct> => {
  try {
    const response = await wooApi.get(`products/${id}`);
    return wooProductSchema.parse(response.data) as unknown as WooProduct;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

export const getProductBySlug = async (slug: string): Promise<WooProduct | null> => {
  try {
    const response = await wooApi.get("products", {
      slug,
      status: "publish",
    });
    const products = wooProductsSchema.parse(response.data) as unknown as WooProduct[];
    return products[0] || null;
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    throw error;
  }
};

// Categories API functions
export const getCategories = async (params: CategoryQueryParams = {}) => {
  try {
    const response = await wooApi.get("products/categories", {
      per_page: params.per_page || 100,
      ...params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getCategoryBySlug = async (slug: string) => {
  try {
    const response = await wooApi.get("products/categories", {
      slug,
    });
    return response.data[0] || null;
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    throw error;
  }
};

// Featured products API function
export const getFeaturedProducts = async (limit: number = 3): Promise<WooProduct[]> => {
  try {
    const response = await wooApi.get("products", {
      per_page: limit,
      page: 1,
      status: "publish",
      featured: true,
      orderby: "menu_order",
      order: "asc",
    });
    return wooProductsSchema.parse(response.data) as unknown as WooProduct[];
  } catch (error) {
    console.error("Error fetching featured products:", error);
    throw error;
  }
};

/** Fetch multiple products by ID. Preserves order of ids where API allows. */
export const getProductsByIds = async (ids: number[]): Promise<WooProduct[]> => {
  if (ids.length === 0) return [];
  try {
    const response = await wooApi.get("products", {
      include: ids.join(","),
      per_page: ids.length,
      status: "publish",
    });
    const data = wooProductsSchema.parse(response.data) as unknown as WooProduct[];
    // Preserve requested order (API may return in different order)
    const byId = new Map(data.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is WooProduct => p != null);
  } catch (error) {
    console.error("Error fetching products by ids:", error);
    throw error;
  }
};

/** Bestsellers for store-wide "Customers also bought" (order by total sales). */
export const getBestsellers = async (limit: number = 8): Promise<WooProduct[]> => {
  try {
    const response = await wooApi.get("products", {
      per_page: limit,
      page: 1,
      status: "publish",
      orderby: "popularity",
      order: "desc",
    });
    return wooProductsSchema.parse(response.data) as unknown as WooProduct[];
  } catch (error) {
    console.error("Error fetching bestsellers:", error);
    throw error;
  }
};

// Variation query parameters
export interface VariationQueryParams {
  per_page?: number;
  page?: number;
  [key: string]: unknown;
}

// Product Variations API functions
export const getProductVariations = async (
  productId: number,
  params: VariationQueryParams = {}
) => {
  try {
    const response = await wooApi.get(`products/${productId}/variations`, {
      per_page: params.per_page || 100,
      page: params.page || 1,
      ...params,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching variations for product ${productId}:`, error);
    throw error;
  }
};

export const getProductVariation = async (productId: number, variationId: number) => {
  try {
    const response = await wooApi.get(`products/${productId}/variations/${variationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching variation ${variationId} for product ${productId}:`, error);
    throw error;
  }
};
