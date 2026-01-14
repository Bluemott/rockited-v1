'use client';

import { useEffect } from 'react';
import { WooProduct } from '@/lib/types';
import { trackProductView } from '@/lib/analytics';

interface ProductViewTrackerProps {
  product: WooProduct;
}

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
  useEffect(() => {
    const price = parseFloat(product.price);
    const category = product.categories?.[0]?.name;

    trackProductView({
      id: product.id,
      name: product.name,
      price,
      category,
    });
  }, [product]);

  return null;
}

