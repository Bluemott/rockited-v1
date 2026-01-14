"use client";

import { useState, useEffect } from "react";
import { WooProduct, WooAttribute } from "@/lib/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductAttributesProps {
  product: WooProduct;
  onAttributeChange?: (attributes: Record<string, string>) => void;
}

export default function ProductAttributes({ product, onAttributeChange }: ProductAttributesProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Initialize with default attributes if available
  useEffect(() => {
    if (product.default_attributes && product.default_attributes.length > 0) {
      const defaults: Record<string, string> = {};
      product.default_attributes.forEach((attr: { id?: number; option?: string }) => {
        if (attr.id && attr.option) {
          defaults[attr.id.toString()] = attr.option;
        }
      });
      setSelectedAttributes(defaults);
      if (onAttributeChange) {
        onAttributeChange(defaults);
      }
    }
  }, [product.default_attributes, onAttributeChange]);

  // Filter out variation-only attributes for display (we'll show all visible attributes)
  const displayAttributes = (product.attributes || []).filter(
    (attr: WooAttribute) => attr.visible && attr.options && attr.options.length > 0
  );

  if (displayAttributes.length === 0) {
    return null;
  }

  const handleAttributeChange = (attributeId: string, value: string) => {
    const newAttributes = {
      ...selectedAttributes,
      [attributeId]: value,
    };
    setSelectedAttributes(newAttributes);
    if (onAttributeChange) {
      onAttributeChange(newAttributes);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Product Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayAttributes.map((attribute: WooAttribute) => {
          const attributeId = attribute.id.toString();
          const selectedValue = selectedAttributes[attributeId] || "";

          return (
            <div key={attribute.id} className="space-y-2">
              <Label htmlFor={`attr-${attribute.id}`}>
                {attribute.name}
                {attribute.variation && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Variation
                  </Badge>
                )}
              </Label>
              <Select
                value={selectedValue}
                onValueChange={(value) => handleAttributeChange(attributeId, value)}
              >
                <SelectTrigger id={`attr-${attribute.id}`}>
                  <SelectValue placeholder={`Select ${attribute.name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {attribute.options.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
