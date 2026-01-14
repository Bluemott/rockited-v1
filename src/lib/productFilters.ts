import { WooProduct } from "./types";

export type SortOption =
  | "price-low-high"
  | "price-high-low"
  | "name-a-z"
  | "name-z-a"
  | "newest"
  | "oldest";

export interface ProductFilters {
  search: string;
  categories: number[];
  priceRange: [number, number];
  stockStatus: ("instock" | "outofstock" | "onbackorder")[];
  sort: SortOption;
}

export const defaultFilters: ProductFilters = {
  search: "",
  categories: [],
  priceRange: [0, 10000],
  stockStatus: [],
  sort: "name-a-z",
};

/**
 * Parse price string to number (handles currency symbols and commas)
 */
function parsePrice(price: string): number {
  if (!price) return 0;
  return parseFloat(price.replace(/[^0-9.-]+/g, "")) || 0;
}

/**
 * Filter products by search query
 */
export function filterBySearch(products: WooProduct[], search: string): WooProduct[] {
  if (!search.trim()) return products;

  const query = search.toLowerCase().trim();
  return products.filter((product) => {
    const nameMatch = product.name.toLowerCase().includes(query);
    const descMatch =
      product.description?.toLowerCase().includes(query) ||
      product.short_description?.toLowerCase().includes(query);
    const skuMatch = product.sku?.toLowerCase().includes(query);

    return nameMatch || descMatch || skuMatch;
  });
}

/**
 * Filter products by categories
 */
export function filterByCategories(products: WooProduct[], categoryIds: number[]): WooProduct[] {
  if (categoryIds.length === 0) return products;

  return products.filter((product) => {
    return product.categories.some((cat) => categoryIds.includes(cat.id));
  });
}

/**
 * Filter products by price range
 */
export function filterByPriceRange(
  products: WooProduct[],
  [min, max]: [number, number]
): WooProduct[] {
  return products.filter((product) => {
    const price = parsePrice(product.price);
    return price >= min && price <= max;
  });
}

/**
 * Filter products by stock status
 */
export function filterByStockStatus(
  products: WooProduct[],
  statuses: ("instock" | "outofstock" | "onbackorder")[]
): WooProduct[] {
  if (statuses.length === 0) return products;

  return products.filter((product) => {
    return statuses.includes(product.stock_status);
  });
}

/**
 * Apply all filters to products
 */
export function applyFilters(products: WooProduct[], filters: ProductFilters): WooProduct[] {
  let filtered = [...products];

  filtered = filterBySearch(filtered, filters.search);
  filtered = filterByCategories(filtered, filters.categories);
  filtered = filterByPriceRange(filtered, filters.priceRange);
  filtered = filterByStockStatus(filtered, filters.stockStatus);

  return filtered;
}

/**
 * Sort products based on sort option
 */
export function sortProducts(products: WooProduct[], sortOption: SortOption): WooProduct[] {
  const sorted = [...products];

  switch (sortOption) {
    case "price-low-high":
      return sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));

    case "price-high-low":
      return sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));

    case "name-a-z":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case "name-z-a":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case "newest":
      return sorted.sort((a, b) => {
        const dateA = new Date(a.date_created).getTime();
        const dateB = new Date(b.date_created).getTime();
        return dateB - dateA;
      });

    case "oldest":
      return sorted.sort((a, b) => {
        const dateA = new Date(a.date_created).getTime();
        const dateB = new Date(b.date_created).getTime();
        return dateA - dateB;
      });

    default:
      return sorted;
  }
}

/**
 * Get the minimum and maximum prices from products
 */
export function getPriceRange(products: WooProduct[]): [number, number] {
  if (products.length === 0) return [0, 10000];

  const prices = products.map((p) => parsePrice(p.price)).filter((p) => p > 0);

  if (prices.length === 0) return [0, 10000];

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return [Math.floor(min), Math.ceil(max)];
}

/**
 * Count active filters
 */
export function countActiveFilters(
  filters: ProductFilters,
  defaultPriceRange: [number, number]
): number {
  let count = 0;

  if (filters.search.trim()) count++;
  if (filters.categories.length > 0) count++;
  if (
    filters.priceRange[0] !== defaultPriceRange[0] ||
    filters.priceRange[1] !== defaultPriceRange[1]
  )
    count++;
  if (filters.stockStatus.length > 0) count++;
  if (filters.sort !== defaultFilters.sort) count++;

  return count;
}
