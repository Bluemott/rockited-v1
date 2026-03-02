"use client";

import { useEffect } from "react";

import { trackProductView } from "@/lib/analytics";
import { useRecentlyViewedStore } from "@/lib/recentlyViewedStore";
import { WooProduct } from "@/lib/types";
import { normalizeImageUrl } from "@/lib/utils";

interface ProductViewTrackerProps {
  product: WooProduct;
}

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const addViewed = useRecentlyViewedStore((s) => s.addViewed);

  useEffect(() => {
    const price = parseFloat(product.price);
    const category = product.categories?.[0]?.name;

    trackProductView({
      id: product.id,
      name: product.name,
      price,
      category,
    });

    addViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price,
      imageSrc: normalizeImageUrl(product.images[0]?.src || "/placeholder-product.jpg"),
    });
  }, [product, addViewed]);

  return null;
}
