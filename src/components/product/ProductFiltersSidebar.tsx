"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X, Filter } from "lucide-react";
import type { WooCategory, WooProduct } from "@/lib/types";
import { ProductFilters, defaultFilters, countActiveFilters } from "@/lib/productFilters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ProductFiltersSidebarProps {
  categories: WooCategory[];
  products: WooProduct[];
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  priceRange: [number, number];
}

export default function ProductFiltersSidebar({
  categories,
  products: _products,
  filters,
  onFiltersChange,
  priceRange: initialPriceRange,
}: ProductFiltersSidebarProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Calculate price range from products
  const [minPrice, maxPrice] = useMemo(() => {
    return initialPriceRange;
  }, [initialPriceRange]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    const newFilters = { ...localFilters, search: value };
    setLocalFilters(newFilters);

    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      onFiltersChange(newFilters);
    }, 300);

    setSearchDebounce(timeout);
  };

  const handleCategoryToggle = (categoryId: number) => {
    const newCategories = localFilters.categories.includes(categoryId)
      ? localFilters.categories.filter((id) => id !== categoryId)
      : [...localFilters.categories, categoryId];

    const newFilters = { ...localFilters, categories: newCategories };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (values: number[]) => {
    const newFilters = {
      ...localFilters,
      priceRange: [values[0], values[1]] as [number, number],
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStockStatusToggle = (status: "instock" | "outofstock" | "onbackorder") => {
    const newStatuses = localFilters.stockStatus.includes(status)
      ? localFilters.stockStatus.filter((s) => s !== status)
      : [...localFilters.stockStatus, status];

    const newFilters = { ...localFilters, stockStatus: newStatuses };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      sort: value as ProductFilters["sort"],
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      ...defaultFilters,
      priceRange: [minPrice, maxPrice] as [number, number],
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount = countActiveFilters(localFilters, [minPrice, maxPrice]);

  return (
    <div className="h-full flex flex-col text-sidebar-foreground">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 text-xs">
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
        {/* Search */}
        <div className="pt-4">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Search
          </Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        {/* Sort */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Sort By
          </Label>
          <div className="mt-2">
            <Select value={localFilters.sort} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-a-z">Name: A to Z</SelectItem>
                <SelectItem value="name-z-a">Name: Z to A</SelectItem>
                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Categories */}
        {categories.length > 0 && (
          <>
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Categories
              </Label>
              <div className="space-y-3 mt-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={localFilters.categories.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Price Range */}
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Price Range
            </Label>
            <span className="text-xs text-muted-foreground">
              ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]}
            </span>
          </div>
          <div className="space-y-4 mt-2">
            <Slider
              value={[localFilters.priceRange[0], localFilters.priceRange[1]]}
              onValueChange={handlePriceRangeChange}
              min={minPrice}
              max={maxPrice}
              step={1}
              className="w-full"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="min-price" className="text-xs text-muted-foreground">
                  Min
                </Label>
                <Input
                  id="min-price"
                  type="number"
                  value={localFilters.priceRange[0]}
                  onChange={(e) => {
                    const value = Math.max(
                      minPrice,
                      Math.min(parseInt(e.target.value) || minPrice, localFilters.priceRange[1])
                    );
                    handlePriceRangeChange([value, localFilters.priceRange[1]]);
                  }}
                  min={minPrice}
                  max={maxPrice}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="max-price" className="text-xs text-muted-foreground">
                  Max
                </Label>
                <Input
                  id="max-price"
                  type="number"
                  value={localFilters.priceRange[1]}
                  onChange={(e) => {
                    const value = Math.min(
                      maxPrice,
                      Math.max(parseInt(e.target.value) || maxPrice, localFilters.priceRange[0])
                    );
                    handlePriceRangeChange([localFilters.priceRange[0], value]);
                  }}
                  min={minPrice}
                  max={maxPrice}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stock Status */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Stock Status
          </Label>
          <div className="space-y-3 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stock-instock"
                checked={localFilters.stockStatus.includes("instock")}
                onCheckedChange={() => handleStockStatusToggle("instock")}
              />
              <Label htmlFor="stock-instock" className="text-sm font-normal cursor-pointer flex-1">
                In Stock
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stock-outofstock"
                checked={localFilters.stockStatus.includes("outofstock")}
                onCheckedChange={() => handleStockStatusToggle("outofstock")}
              />
              <Label
                htmlFor="stock-outofstock"
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Out of Stock
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stock-onbackorder"
                checked={localFilters.stockStatus.includes("onbackorder")}
                onCheckedChange={() => handleStockStatusToggle("onbackorder")}
              />
              <Label
                htmlFor="stock-onbackorder"
                className="text-sm font-normal cursor-pointer flex-1"
              >
                On Backorder
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
