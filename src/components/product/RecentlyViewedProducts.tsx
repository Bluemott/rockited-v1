"use client";

import { useRecentlyViewedStore, type RecentlyViewedItem } from "@/lib/recentlyViewedStore";
import { WooProduct } from "@/lib/types";

import ProductCard from "./ProductCard";

/** Map stored recently viewed item to a WooProduct-like shape for ProductCard. */
function toProductForCard(item: RecentlyViewedItem): WooProduct {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    price: String(item.price),
    images: [{ id: 0, date_created: "", date_modified: "", src: item.imageSrc, name: item.name, alt: item.name }],
    stock_status: "instock",
    on_sale: false,
    regular_price: String(item.price),
    short_description: "",
    sku: "",
    virtual: false,
    categories: [],
    permalink: "",
    date_created: "",
    date_modified: "",
    type: "simple",
    status: "publish",
    featured: false,
    catalog_visibility: "visible",
    description: "",
    sale_price: "",
    date_on_sale_from: null,
    date_on_sale_to: null,
    purchasable: true,
    total_sales: 0,
    downloadable: false,
    downloads: [],
    download_limit: 0,
    download_expiry: 0,
    external_url: "",
    button_text: "",
    tax_status: "taxable",
    tax_class: "",
    manage_stock: false,
    stock_quantity: null,
    backorders: "no",
    backorders_allowed: false,
    backordered: false,
    sold_individually: false,
    weight: "",
    dimensions: { length: "", width: "", height: "" },
    shipping_required: true,
    shipping_taxable: true,
    shipping_class: "",
    shipping_class_id: 0,
    reviews_allowed: false,
    average_rating: "0",
    rating_count: 0,
    related_ids: [],
    upsell_ids: [],
    cross_sell_ids: [],
    parent_id: 0,
    purchase_note: "",
    tags: [],
    attributes: [],
    default_attributes: [],
    variations: [],
    grouped_products: [],
    menu_order: 0,
    meta_data: [],
  };
}

interface RecentlyViewedProductsProps {
  excludeProductId?: number;
  title?: string;
  maxItems?: number;
}

export default function RecentlyViewedProducts({
  excludeProductId,
  title = "Recently viewed",
  maxItems = 8,
}: RecentlyViewedProductsProps) {
  const items = useRecentlyViewedStore((s) => s.items);
  const filtered = excludeProductId
    ? items.filter((i) => i.id !== excludeProductId)
    : items;
  const display = filtered.slice(0, maxItems);

  if (display.length === 0) return null;

  return (
    <section className="mt-16" aria-label={title}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {display.map((item) => (
          <ProductCard key={item.id} product={toProductForCard(item)} />
        ))}
      </div>
    </section>
  );
}
