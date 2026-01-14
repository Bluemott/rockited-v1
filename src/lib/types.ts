// WooCommerce Product Types
export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: Array<{
    id: string;
    name: string;
    file: string;
  }>;
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | "onbackorder";
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: WooCategory[];
  tags: WooTag[];
  images: WooImage[];
  attributes: WooAttribute[];
  default_attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: WooMetaData[];
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooTag {
  id: number;
  name: string;
  slug: string;
}

export interface WooImage {
  id: number;
  date_created: string;
  date_modified: string;
  src: string;
  name: string;
  alt: string;
}

export interface WooAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WooMetaData {
  id: number;
  key: string;
  value: string;
}

// Product Review Types
export interface WooReview {
  id: number;
  date_created: string;
  date_created_gmt: string;
  product_id: number;
  product_name: string;
  product_permalink: string;
  status: "approved" | "hold" | "spam" | "unspam" | "trash" | "untrash";
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  reviewer_avatar_urls: {
    "24": string;
    "48": string;
    "96": string;
  };
}

// Review Submission Types
export interface ReviewSubmission {
  product_id: number;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number; // 1-5
  status: "hold"; // Always start as pending moderation
}

// Product Variation Types
export interface WooVariation {
  id: number;
  date_created: string;
  date_modified: string;
  description: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  on_sale: boolean;
  status: string;
  purchasable: boolean;
  virtual: boolean;
  downloadable: boolean;
  downloads: Array<{
    id: string;
    name: string;
    file: string;
  }>;
  download_limit: number;
  download_expiry: number;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: "instock" | "outofstock" | "onbackorder";
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_class: string;
  shipping_class_id: number;
  image: WooImage | null;
  attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
  menu_order: number;
  meta_data: WooMetaData[];
}

// Shipping Types
export interface WooShippingZone {
  id: number;
  name: string;
  order: number;
  locations: Array<{
    code: string;
    type: "country" | "state" | "postcode" | "continent";
  }>;
}

export interface WooShippingMethod {
  id: string;
  instance_id: number;
  title: string;
  method_id: string;
  method_title: string;
  method_description: string;
  settings: {
    title?: {
      value: string;
      default: string;
    };
    cost?: {
      value: string;
      default: string;
    };
    class_cost?: {
      value: string;
      default: string;
    };
    estimated_delivery?: {
      value: string;
      default: string;
    };
    [key: string]:
      | {
          value?: string;
          default?: string;
        }
      | undefined;
  };
  zone_id: number;
  zone_name?: string;
}

export interface WooShippingRate {
  method_id: string;
  method_title: string;
  cost: string;
  estimated_delivery?: string;
}

export interface WooShippingCalculation {
  zone_id: number;
  zone_name: string;
  rates: WooShippingRate[];
  total_weight: string;
}

// Cart Types
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Stripe Types
export interface StripeCheckoutSession {
  id: string;
  url: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Blog Types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  tags: string[];
  category: string;
  featuredImage: string;
  seoKeywords: string[];
}

// API Response Types - Standard Error Response
export interface ErrorApiResponse {
  error: string;
  details?: string;
}

// API Response Types - Checkout
export interface CheckoutApiResponse {
  clientSecret: string;
  sessionId: string;
  taxEnabled: boolean;
  taxStatus?: string | null;
}

// API Response Types - Checkout Session
export interface CheckoutSessionApiResponse {
  id: string;
  payment_status: string;
  status: string | null;
  amount_total: number | null;
  amount_subtotal: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_details: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
      country?: string | null;
    } | null;
  } | null;
  line_items:
    | {
        data?: Array<{
          id?: string;
          description?: string | null;
          amount_total?: number;
          quantity?: number;
          price?: {
            id?: string;
            unit_amount?: number;
            currency?: string;
          };
        }>;
      }
    | null
    | undefined;
  metadata: Record<string, string> | null;
  total_details: {
    amount_discount: number;
    amount_shipping: number | null;
    amount_tax: number;
  } | null;
  payment_intent: string | null;
}

// API Response Types - Inventory
export interface InventoryApiResponse {
  stock_status: "instock" | "outofstock" | "onbackorder";
  stock_quantity: number | null;
  on_sale: boolean;
  price: string;
  regular_price: string;
  sale_price: string;
}

// API Response Types - Products
export interface ProductsApiResponse {
  data: WooProduct[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

export interface FeaturedProductsApiResponse extends Array<WooProduct> {}

// API Response Types - Product Reviews
export interface ProductReviewsApiResponse extends Array<WooReview> {}

export interface ReviewSubmissionApiResponse {
  success: boolean;
  message: string;
  review: WooReview;
}

// API Response Types - Shipping Calculation
export interface ShippingCalculationApiResponse {
  zone_id: number;
  zone_name: string;
  rates: WooShippingRate[];
  total_weight: string;
}

// API Response Types - Webhook
export interface WebhookApiResponse {
  received: boolean;
}
