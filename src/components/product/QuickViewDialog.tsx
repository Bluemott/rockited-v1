"use client";

import { ShoppingCart, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCartStore } from "@/lib/store";
import { WooProduct } from "@/lib/types";
import { normalizeImageUrl } from "@/lib/utils";

interface QuickViewDialogProps {
  product: WooProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickViewDialog({ product, open, onOpenChange }: QuickViewDialogProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem } = useCartStore();

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(price));
  };

  const getStockStatus = () => {
    switch (product.stock_status) {
      case "instock":
        return { text: "In Stock", variant: "default" as const };
      case "outofstock":
        return { text: "Out of Stock", variant: "destructive" as const };
      case "onbackorder":
        return { text: "On Backorder", variant: "secondary" as const };
      default:
        return { text: "Unknown", variant: "outline" as const };
    }
  };

  const handleAddToCart = () => {
    const imageUrl = product.images[0]?.src || "/placeholder-product.jpg";
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: normalizeImageUrl(imageUrl),
      sku: product.sku,
      virtual: product.virtual,
      categories: product.categories?.map((c) => ({ slug: c.slug })),
    });
    toast.success(`${product.name} added to cart`);
    onOpenChange(false);
  };

  const stockStatus = getStockStatus();
  const hasMultipleImages = product.images.length > 1;
  const mainImage = product.images[selectedImageIndex] || product.images[0];
  const thumbnails = product.images.slice(0, 5); // Limit to 5 thumbnails

  // Reset selected image when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedImageIndex(0);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-2 shadow-2xl"
        style={{
          borderColor: "hsl(var(--muted-foreground) / 0.3)",
          backgroundColor: "hsl(var(--card))",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-card-foreground">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
              <Image
                src={mainImage?.src || "/placeholder-product.jpg"}
                alt={mainImage?.alt || product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              {product.on_sale && (
                <Badge variant="destructive" className="absolute top-2 left-2 z-10">
                  Sale
                </Badge>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {hasMultipleImages && (
              <div className="grid grid-cols-5 gap-2">
                {thumbnails.map((image, index) => (
                  <button
                    key={image.id || image.src}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square relative rounded-md overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-transparent hover:border-muted-foreground/50"
                    }`}
                  >
                    <Image
                      src={normalizeImageUrl(image.src)}
                      alt={image.alt || `${product.name} thumbnail ${index + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-4 flex flex-col">
            {/* Price and Stock Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-card-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.on_sale && product.regular_price !== product.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.regular_price)}
                  </span>
                )}
              </div>
              <Badge variant={stockStatus.variant} className="w-fit">
                {stockStatus.text}
              </Badge>
              {product.sku && <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <div className="text-sm text-muted-foreground line-clamp-4">
                {product.short_description.replace(/<[^>]*>/g, "")}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                asChild
              >
                <Link href={`/products/${product.slug}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Details
                </Link>
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={product.stock_status === "outofstock"}
                variant="default"
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.stock_status === "outofstock" ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
