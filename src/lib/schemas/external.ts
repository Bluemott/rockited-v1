import { z } from "zod";

const wooImageSchema = z.object({
  id: z.number(),
  src: z.string(),
  name: z.string().optional().default(""),
  alt: z.string().optional().default(""),
});

const wooCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

export const wooProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  price: z.string(),
  regular_price: z.string().optional().default(""),
  sale_price: z.string().optional().default(""),
  stock_status: z.enum(["instock", "outofstock", "onbackorder"]),
  stock_quantity: z.number().nullable().optional(),
  weight: z.string().optional().default("0"),
  images: z.array(wooImageSchema).default([]),
  categories: z.array(wooCategorySchema).default([]),
});

export const wooProductsSchema = z.array(wooProductSchema);

const wooShippingLocationSchema = z.object({
  code: z.string(),
  type: z.enum(["country", "state", "postcode", "continent"]),
});

export const wooShippingZoneSchema = z.object({
  id: z.number(),
  name: z.string(),
  order: z.number().optional().default(0),
  locations: z.array(wooShippingLocationSchema).default([]),
});

export const wooShippingZonesSchema = z.array(wooShippingZoneSchema);

const wooShippingSettingValueSchema = z
  .object({
    value: z.string().optional(),
    default: z.string().optional(),
  })
  .optional();

export const wooShippingMethodSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  instance_id: z.number(),
  title: z.string(),
  method_id: z.string(),
  method_title: z.string(),
  method_description: z.string().optional().default(""),
  settings: z
    .object({
      title: wooShippingSettingValueSchema,
      cost: wooShippingSettingValueSchema,
      class_cost: wooShippingSettingValueSchema,
      estimated_delivery: wooShippingSettingValueSchema,
    })
    .catchall(wooShippingSettingValueSchema)
    .default({}),
  zone_id: z.number().optional().default(0),
  zone_name: z.string().optional(),
});

export const wooShippingMethodsSchema = z.array(wooShippingMethodSchema);

const wpRenderedSchema = z.object({ rendered: z.string() });

export const wpPostSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: wpRenderedSchema,
  excerpt: wpRenderedSchema,
  content: wpRenderedSchema,
  date: z.string(),
  modified: z.string(),
  author: z.number().optional().default(0),
  featured_media: z.number().optional().default(0),
  categories: z.array(z.number()).default([]),
  tags: z.array(z.number()).default([]),
  _embedded: z
    .object({
      author: z.array(z.object({ name: z.string() })).optional(),
      "wp:featuredmedia": z
        .array(z.object({ source_url: z.string(), alt_text: z.string().optional().default("") }))
        .optional(),
      "wp:term": z
        .array(
          z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              slug: z.string(),
              taxonomy: z.string(),
            })
          )
        )
        .optional(),
    })
    .optional(),
});

export const wpPostsSchema = z.array(wpPostSchema);

export const wpCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  count: z.number(),
});

export const wpCategoriesSchema = z.array(wpCategorySchema);
export const wpTagsSchema = z.array(wpCategorySchema);

export const wpMediaSchema = z.object({
  id: z.number(),
  source_url: z.string(),
  alt_text: z.string().optional().default(""),
});
