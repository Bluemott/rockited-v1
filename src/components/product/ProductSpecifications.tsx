"use client";

import { Package, Ruler, Weight, Truck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WooProduct } from "@/lib/types";

interface ProductSpecificationsProps {
  product: WooProduct;
}

export default function ProductSpecifications({ product }: ProductSpecificationsProps) {
  const hasWeight = product.weight && parseFloat(product.weight) > 0;
  const hasDimensions =
    product.dimensions &&
    (parseFloat(product.dimensions.length) > 0 ||
      parseFloat(product.dimensions.width) > 0 ||
      parseFloat(product.dimensions.height) > 0);
  const hasShippingInfo = product.shipping_required || product.shipping_class;

  // Don't render if there's no relevant information
  if (!hasWeight && !hasDimensions && !hasShippingInfo) {
    return null;
  }

  const formatDimension = (value: string, unit: string = "in") => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return "N/A";
    return `${num} ${unit}`;
  };

  const formatWeight = (value: string, unit: string = "lbs") => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return "N/A";
    return `${num} ${unit}`;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Product Specifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasWeight && (
            <div className="flex items-start gap-3">
              <Weight className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Weight</div>
                <div className="text-base font-semibold">{formatWeight(product.weight)}</div>
              </div>
            </div>
          )}

          {hasDimensions && (
            <div className="flex items-start gap-3">
              <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">Dimensions</div>
                <div className="text-base font-semibold">
                  {formatDimension(product.dimensions.length)} ×{" "}
                  {formatDimension(product.dimensions.width)} ×{" "}
                  {formatDimension(product.dimensions.height)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">(L × W × H)</div>
              </div>
            </div>
          )}

          {hasShippingInfo && (
            <>
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Shipping Required</div>
                  <div className="text-base font-semibold">
                    {product.shipping_required ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              {product.shipping_class && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Shipping Class</div>
                    <div className="text-base font-semibold">{product.shipping_class}</div>
                  </div>
                </div>
              )}

              {product.shipping_taxable !== undefined && (
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Shipping Taxable
                    </div>
                    <div className="text-base font-semibold">
                      {product.shipping_taxable ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
