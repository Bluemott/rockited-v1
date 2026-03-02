import type { Metadata } from "next";
import { Suspense } from "react";

import ProductsWithFilters from "@/components/product/ProductsWithFilters";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { generateProductsPageMetadata } from "@/lib/seo";
import { getProducts, getCategories, getBestsellers } from "@/lib/woocommerce";

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = generateProductsPageMetadata();

export default async function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ProductsList />
    </Suspense>
  );
}

async function ProductsList() {
  let products: Awaited<ReturnType<typeof getProducts>> | null = null;
  let categories: Awaited<ReturnType<typeof getCategories>> | null = null;
  let bestsellers: Awaited<ReturnType<typeof getBestsellers>> | null = null;
  let fetchError: unknown = null;

  try {
    [products, categories, bestsellers] = await Promise.all([
      getProducts({ per_page: 100 }),
      getCategories({ per_page: 100 }),
      getBestsellers(8),
    ]);
  } catch (error) {
    console.error("Error fetching products:", error);
    fetchError = error;
  }

  if (fetchError || !products || !categories) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg">Failed to load products. Please try again later.</p>
      </div>
    );
  }

  return (
    <ProductsWithFilters
      products={products}
      categories={categories}
      bestsellers={bestsellers ?? []}
    />
  );
}
