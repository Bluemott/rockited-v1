"use client";

import { useState, useMemo, useEffect } from "react";

import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  ProductFilters,
  defaultFilters,
  applyFilters,
  sortProducts,
  getPriceRange,
} from "@/lib/productFilters";
import { WooProduct, WooCategory } from "@/lib/types";

import ProductFiltersSidebar from "./ProductFiltersSidebar";
import ProductGrid from "./ProductGrid";
import RecentlyViewedProducts from "./RecentlyViewedProducts";

interface ProductsWithFiltersProps {
  products: WooProduct[];
  categories: WooCategory[];
  bestsellers?: WooProduct[];
}

function ProductsContent({
  products,
  categories,
  bestsellers,
  filters,
  onFiltersChange,
  priceRange,
  filteredAndSortedProducts,
}: {
  products: WooProduct[];
  categories: WooCategory[];
  bestsellers: WooProduct[];
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  priceRange: [number, number];
  filteredAndSortedProducts: WooProduct[];
}) {
  const { open } = useSidebar();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div
        className={`
          hidden md:block transition-all duration-200 ease-linear flex-shrink-0
          ${open ? "w-64" : "w-0"}
        `}
      >
        <div
          className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-y-auto
          transition-all duration-200 ease-linear bg-sidebar border-r
          ${open ? "w-64" : "w-0 overflow-hidden"}
        `}
        >
          <ProductFiltersSidebar
            categories={categories}
            products={products}
            filters={filters}
            onFiltersChange={onFiltersChange}
            priceRange={priceRange}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">Filter/Search</span>
            </div>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">All Products</h1>
              <p className="text-lg text-muted-foreground">
                Discover our complete collection of premium products.
              </p>
            </div>
          </div>

          <RecentlyViewedProducts title="Recently viewed" maxItems={8} />

          {bestsellers.length > 0 && (
            <section className="mb-12" aria-label="Customers also bought">
              <h2 className="text-2xl font-bold text-foreground mb-6">Customers also bought</h2>
              <ProductGrid products={bestsellers} />
            </section>
          )}

          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedProducts.length === products.length
                ? `Showing all ${filteredAndSortedProducts.length} products`
                : `Showing ${filteredAndSortedProducts.length} of ${products.length} products`}
            </p>
          </div>

          <ProductGrid products={filteredAndSortedProducts} />
        </div>
      </main>
    </div>
  );
}

export default function ProductsWithFilters({
  products,
  categories,
  bestsellers = [],
}: ProductsWithFiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);

  // Calculate price range from products
  const priceRange = useMemo(() => getPriceRange(products), [products]);

  // Initialize price range in filters
  useEffect(() => {
    if (filters.priceRange[0] === 0 && filters.priceRange[1] === 10000) {
      queueMicrotask(() =>
        setFilters((prev) => ({
          ...prev,
          priceRange,
        }))
      );
    }
  }, [priceRange, filters.priceRange]);

  // Apply filters and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = applyFilters(products, filters);
    filtered = sortProducts(filtered, filters.sort);
    return filtered;
  }, [products, filters]);

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <ProductsContent
        products={products}
        categories={categories}
        bestsellers={bestsellers}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        priceRange={priceRange}
        filteredAndSortedProducts={filteredAndSortedProducts}
      />
    </SidebarProvider>
  );
}
