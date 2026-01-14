import { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts, getCategories } from "@/lib/woocommerce";
import ProductsWithFilters from "@/components/product/ProductsWithFilters";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { generateProductsPageMetadata } from "@/lib/seo";

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
  try {
    // Fetch all products (increase per_page to get more products)
    // You may want to implement pagination or fetch all products
    const products = await getProducts({ per_page: 100 });
    const categories = await getCategories({ per_page: 100 });

    return <ProductsWithFilters products={products} categories={categories} />;
  } catch (error) {
    console.error("Error fetching products:", error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg">Failed to load products. Please try again later.</p>
      </div>
    );
  }
}
