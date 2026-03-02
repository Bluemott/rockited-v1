"use client";

import { ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackAddToCart } from "@/lib/analytics";
import { useCartStore } from "@/lib/store";
import { WooProduct } from "@/lib/types";
import { normalizeImageUrl } from "@/lib/utils";

interface AddToCartButtonProps {
  product: WooProduct;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCartStore();

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      const price = parseFloat(product.price);
      const category = product.categories?.[0]?.name;

      // Track add to cart event
      trackAddToCart({
        id: product.id,
        name: product.name,
        price,
        quantity,
        category,
      });

      // Add multiple items based on quantity
      // Normalize image URL to use domain instead of IP address
      const imageUrl = product.images[0]?.src || "/placeholder-product.jpg";
      const normalizedImageUrl = normalizeImageUrl(imageUrl);

      for (let i = 0; i < quantity; i++) {
        addItem({
          id: product.id,
          name: product.name,
          price,
          image: normalizedImageUrl,
          sku: product.sku,
          virtual: product.virtual,
          categories: product.categories?.map((c) => ({ slug: c.slug })),
        });
      }

      toast.success(`${quantity} ${quantity === 1 ? "item" : "items"} added to cart`);

      setTimeout(() => {
        setIsAdding(false);
        setQuantity(1);
      }, 1000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add items to cart");
      setIsAdding(false);
    }
  };

  const isOutOfStock = product.stock_status === "outofstock";

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Label htmlFor="quantity" className="text-sm font-medium">
          Quantity:
        </Label>
        <Select
          value={quantity.toString()}
          onValueChange={(value) => setQuantity(parseInt(value))}
          disabled={isOutOfStock}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: Math.min(10, product.stock_quantity || 10) }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isOutOfStock || isAdding}
        size="lg"
        className="w-full"
      >
        {isAdding ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : isOutOfStock ? (
          "Out of Stock"
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
