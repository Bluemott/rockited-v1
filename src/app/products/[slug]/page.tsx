import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getProductBySlug, getProducts } from "@/lib/woocommerce";
import { WooProduct, WooImage } from "@/lib/types";
import ProductCard from "@/components/product/ProductCard";
import AddToCartButton from "@/components/product/AddToCartButton";
import ShippingEstimator from "@/components/product/ShippingEstimator";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import ProductReviews from "@/components/product/ProductReviews";
import ProductAttributes from "@/components/product/ProductAttributes";
import StructuredData from "@/components/seo/StructuredData";
import { generateProductMetadata, getSiteConfig } from "@/lib/seo";
import { generateProductBreadcrumbs } from "@/lib/seoUtils";
import ProductViewTracker from "@/components/analytics/ProductViewTracker";

export const revalidate = 3600; // Revalidate every hour

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return generateProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  // Get related products
  const relatedProducts = product.categories?.[0]?.id
    ? await getProducts({
        per_page: 4,
        category: product.categories[0].id,
      }).then((products) => products.filter((p: WooProduct) => p.id !== product.id))
    : [];

  const siteConfig = getSiteConfig();
  const breadcrumbs = generateProductBreadcrumbs(product, siteConfig);

  return (
    <>
      <StructuredData type="product" data={product} />
      <StructuredData type="breadcrumb" data={breadcrumbs} />
      <ProductViewTracker product={product} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1 relative">
              <Image
                src={product.images[0]?.src || "/placeholder-product.jpg"}
                alt={product.images[0]?.alt || product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover rounded-lg"
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1, 5).map((image: WooImage) => (
                  <div key={image.id || image.src} className="aspect-w-1 aspect-h-1 relative">
                    <Image
                      src={image.src}
                      alt={image.alt || product.name}
                      fill
                      sizes="(max-width: 1024px) 25vw, 200px"
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">SKU: {product.sku}</p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(parseFloat(product.price))}
              </span>
              {product.on_sale && product.regular_price !== product.price && (
                <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(parseFloat(product.regular_price))}
                </span>
              )}
            </div>

            {product.short_description && (
              <div className="text-gray-600 dark:text-gray-300">
                <div dangerouslySetInnerHTML={{ __html: product.short_description }} />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <span
                className={`text-sm font-medium ${
                  product.stock_status === "instock"
                    ? "text-green-600 dark:text-green-400"
                    : product.stock_status === "outofstock"
                      ? "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {product.stock_status === "instock"
                  ? "In Stock"
                  : product.stock_status === "outofstock"
                    ? "Out of Stock"
                    : "On Backorder"}
              </span>
              {product.stock_quantity && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({product.stock_quantity} available)
                </span>
              )}
            </div>

            {/* Product Attributes */}
            <ProductAttributes product={product} />

            <AddToCartButton product={product} />

            {/* Shipping Estimator */}
            <ShippingEstimator product={product} />

            {/* Product Specifications */}
            <ProductSpecifications product={product} />
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Description
            </h2>
            <div
              className="text-gray-600 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Product Reviews */}
        <ProductReviews product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product: WooProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Generate static params for all products
export async function generateStaticParams() {
  try {
    const products = await getProducts({ per_page: 100 });
    return products.map((product: WooProduct) => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}
