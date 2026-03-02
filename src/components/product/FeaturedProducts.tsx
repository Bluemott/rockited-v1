"use client";

import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { useCartStore } from "@/lib/store";
import { WooProduct } from "@/lib/types";

interface FeaturedProductsProps {
  products: WooProduct[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef<number | null>(null);
  const { addItem } = useCartStore();

  // Filter to only show featured products (or all if none are marked)
  const featuredProducts = products.length > 0 ? products : [];

  // Duplicate products for infinite scroll effect
  const duplicatedProducts = [...featuredProducts, ...featuredProducts];

  // Infinite scroll implementation (only for horizontal scroll container)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || featuredProducts.length === 0) return;

    // Check if we're on mobile (grid layout) - don't apply infinite scroll
    const isMobile = window.innerWidth < 640;
    if (isMobile) return;

    let isScrolling = false;
    const rafId: number | null = null;

    const handleScroll = () => {
      if (!scrollContainer || isScrolling) return;

      const scrollWidth = scrollContainer.scrollWidth;
      const scrollLeft = scrollContainer.scrollLeft;
      const singleSetWidth = scrollWidth / 2;

      // Reset to beginning when scrolled past the first set
      if (scrollLeft >= singleSetWidth - 1) {
        isScrolling = true;
        scrollContainer.scrollLeft = scrollLeft - singleSetWidth;
        requestAnimationFrame(() => {
          isScrolling = false;
        });
      }
      // Reset to end when scrolled before the start (for reverse scrolling)
      else if (scrollLeft <= 1) {
        isScrolling = true;
        scrollContainer.scrollLeft = singleSetWidth + scrollLeft;
        requestAnimationFrame(() => {
          isScrolling = false;
        });
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    // Initialize scroll position to the start of the first set
    scrollContainer.scrollLeft = 0;

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [featuredProducts.length]);

  // Auto-scroll to the left
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || featuredProducts.length === 0) return;

    // Clean up any existing animation frame
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }

    // Only start auto-scroll if not paused
    if (isPaused) return;

    const scrollSpeed = 1.5; // pixels per frame (increased from 0.5 for better visibility)

    const autoScroll = () => {
      if (!scrollContainer || isPaused) {
        if (autoScrollRef.current) {
          cancelAnimationFrame(autoScrollRef.current);
          autoScrollRef.current = null;
        }
        return;
      }

      scrollContainer.scrollLeft += scrollSpeed;
      autoScrollRef.current = requestAnimationFrame(autoScroll);
    };

    // Start auto-scroll after a brief delay to ensure container is ready
    const startTimeout = setTimeout(() => {
      autoScrollRef.current = requestAnimationFrame(autoScroll);
    }, 100);

    return () => {
      clearTimeout(startTimeout);
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };
  }, [featuredProducts.length, isPaused]);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(price));
  };

  const handleAddToCart = (product: WooProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.images[0]?.src || "/placeholder-product.jpg",
      sku: product.sku,
      virtual: product.virtual,
      categories: product.categories?.map((c) => ({ slug: c.slug })),
    });
    toast.success(`${product.name} added to cart`);
  };

  const getStockStatus = () => {
    return {
      instock: { text: "In Stock", variant: "default" as const },
      outofstock: { text: "Out of Stock", variant: "destructive" as const },
      onbackorder: { text: "On Backorder", variant: "secondary" as const },
    };
  };

  if (!featuredProducts || featuredProducts.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary>
      <section className="relative py-20 -mt-10 floating-content">
        <div className="container mx-auto px-4 relative">
          <MotionDiv variant="fadeInUp" className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Best Sellers
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto">
              Discover our most popular products, loved by customers for their exceptional quality
              and design.
            </p>
          </MotionDiv>

          {/* Mobile Grid Layout (hidden on tablet+) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:hidden">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="w-full bg-card border-2 border-border shadow-brand-lg hover:shadow-brand-xl transition-all duration-300 group flex flex-col"
              >
                <div className="relative overflow-hidden">
                  <Link href={`/products/${product.slug}`}>
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={product.images[0]?.src || "/placeholder-product.jpg"}
                        alt={product.images[0]?.alt || product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </Link>

                  {product.on_sale && (
                    <Badge variant="destructive" className="absolute top-3 left-3 z-10">
                      Sale
                    </Badge>
                  )}

                  {/* Best Seller badge */}
                  <Badge
                    variant="default"
                    className="absolute top-3 right-3 z-10 bg-accent-orange text-white"
                  >
                    Best Seller
                  </Badge>
                </div>

                <CardHeader className="space-y-2">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 text-lg sm:text-xl">
                      {product.name}
                    </h3>
                  </Link>

                  {product.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {product.short_description.replace(/<[^>]*>/g, "")}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 flex-grow">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl sm:text-2xl font-bold text-foreground">
                          {formatPrice(product.price)}
                        </span>
                        {product.on_sale && product.regular_price !== product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.regular_price)}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={getStockStatus()[product.stock_status]?.variant || "outline"}
                        className="text-xs"
                      >
                        {getStockStatus()[product.stock_status]?.text || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-muted hover:text-foreground hover:border-muted-foreground h-9"
                    asChild
                  >
                    <Link href={`/products/${product.slug}`}>View Details</Link>
                  </Button>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock_status === "outofstock"}
                    variant="default"
                    className="flex-1 h-9"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.stock_status === "outofstock" ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Horizontal Scroll Container (hidden on mobile, shown on tablet+) */}
          <div
            className="relative w-full hidden sm:block"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4 items-stretch"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {duplicatedProducts.map((product, index) => (
                <div
                  key={`${product.id}-${index}`}
                  className="flex-shrink-0 w-[calc(50%-1.5rem)] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-1.5rem)]"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <Card className="w-full bg-card border-2 border-border shadow-brand-lg hover:shadow-brand-xl transition-all duration-300 group h-full flex flex-col">
                    <div className="relative overflow-hidden">
                      <Link href={`/products/${product.slug}`}>
                        <div className="aspect-[4/3] relative">
                          <Image
                            src={product.images[0]?.src || "/placeholder-product.jpg"}
                            alt={product.images[0]?.alt || product.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </Link>

                      {product.on_sale && (
                        <Badge variant="destructive" className="absolute top-3 left-3 z-10">
                          Sale
                        </Badge>
                      )}

                      {/* Best Seller badge */}
                      <Badge
                        variant="default"
                        className="absolute top-3 right-3 z-10 bg-accent-orange text-white"
                      >
                        Best Seller
                      </Badge>
                    </div>

                    <CardHeader className="space-y-2">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 text-lg md:text-xl">
                          {product.name}
                        </h3>
                      </Link>

                      {product.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {product.short_description.replace(/<[^>]*>/g, "")}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3 flex-grow">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl md:text-2xl font-bold text-foreground">
                              {formatPrice(product.price)}
                            </span>
                            {product.on_sale && product.regular_price !== product.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.regular_price)}
                              </span>
                            )}
                          </div>
                          <Badge
                            variant={getStockStatus()[product.stock_status]?.variant || "outline"}
                            className="text-xs"
                          >
                            {getStockStatus()[product.stock_status]?.text || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="bg-muted flex gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-muted hover:text-foreground hover:border-muted-foreground h-9"
                        asChild
                      >
                        <Link href={`/products/${product.slug}`}>View Details</Link>
                      </Button>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_status === "outofstock"}
                        variant="default"
                        className="flex-1 h-9"
                        size="sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.stock_status === "outofstock" ? "Out of Stock" : "Add to Cart"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent-orange/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-accent-orange/5 rounded-full blur-2xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-accent-orange/10 rounded-full blur-xl animate-pulse delay-500" />
          </div>
        </div>
      </section>
    </ErrorBoundary>
  );
}
