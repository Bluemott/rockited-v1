import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getProducts } from "@/lib/woocommerce";
import type { WooProduct } from "@/lib/types";
import ProductGrid from "@/components/product/ProductGrid";
import StructuredData from "@/components/seo/StructuredData";
import { generateCategoryMetadata, getSiteConfig } from "@/lib/seo";
import { generateCategoryBreadcrumbs } from "@/lib/seoUtils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return generateCategoryMetadata(category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug);

  if (!category) {
    notFound();
  }

  // Fetch all products in this category
  let allProducts: WooProduct[] = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const products = await getProducts({
        per_page: 100,
        page,
        status: "publish",
        category: category.id,
      });

      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts = [...allProducts, ...products];
        hasMore = products.length === 100;
        page++;
      }
    }
  } catch (error) {
    console.error("Error fetching category products:", error);
    allProducts = [];
  }

  const siteConfig = getSiteConfig();
  const breadcrumbs = generateCategoryBreadcrumbs(category, siteConfig);

  return (
    <>
      <StructuredData type="breadcrumb" data={breadcrumbs} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Products
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{category.name}</h1>
            <p className="text-lg text-muted-foreground">
              Browse our collection of {category.name.toLowerCase()} products.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {allProducts.length === 0
              ? "No products found in this category."
              : `Showing ${allProducts.length} product${allProducts.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {allProducts.length > 0 ? (
          <ProductGrid products={allProducts} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No products available in this category at the moment.
            </p>
            <Link href="/products">
              <Button variant="outline" className="mt-4">
                Browse All Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
