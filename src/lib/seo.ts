import type { Metadata } from "next";

import {
  getStructuredMetadata,
  getSEOMetaDescription,
  getCustomOGImage,
  getBrandFromMetadata,
  getSEOKeywords,
} from "./productMetadata";
import { optimizeMetaDescription } from "./seoUtils";
import { WooProduct } from "./types";
import { normalizeImageUrl } from "./utils";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rockited4d.com";
const siteName = "ROCK IT ED";
const defaultDescription = optimizeMetaDescription(
  "Discover premium products with quality, style, and innovation. Shop the best selection online."
);

/**
 * Generate metadata for the homepage
 */
export function generateHomeMetadata(): Metadata {
  return {
    title: {
      default: `${siteName} - Premium Products`,
      template: `%s | ${siteName}`,
    },
    description: defaultDescription,
    keywords: [
      "premium products",
      "quality",
      "style",
      "innovation",
      "online shopping",
      "ROCK IT ED",
    ],
    openGraph: {
      title: `${siteName} - Premium Products`,
      description: defaultDescription,
      type: "website",
      url: siteUrl,
      siteName,
      locale: "en_US",
      images: [
        {
          url: `${siteUrl}/Rockited4D_New_Hero_Image.webp`,
          width: 1920,
          height: 1080,
          alt: `${siteName} - Premium Products`,
        },
        {
          url: `${siteUrl}/Rock_it_ed_Comp.png`,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} - Premium Products`,
      description: defaultDescription,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: siteUrl,
    },
    metadataBase: new URL(siteUrl),
  };
}

/**
 * Generate metadata for product pages
 */
export function generateProductMetadata(product: WooProduct): Metadata {
  const productUrl = `${siteUrl}/products/${product.slug}`;

  // Get custom metadata
  const metadata = getStructuredMetadata(product);
  const customOGImage = getCustomOGImage(product);
  const seoDescription = getSEOMetaDescription(product);
  const brand = getBrandFromMetadata(product);
  const keywords = getSEOKeywords(product);

  // Use custom SEO description if available, otherwise use short description
  const rawDescription =
    seoDescription ||
    (product.short_description
      ? product.short_description
      : `Shop ${product.name} at ${siteName}. ${defaultDescription}`);

  // Optimize description to 150-160 characters
  const productDescription = optimizeMetaDescription(rawDescription);

  // Use custom OG image if available, otherwise use first product image
  const productImage = normalizeImageUrl(
    customOGImage || product.images[0]?.src || `${siteUrl}/placeholder-product.jpg`
  );

  // Get all product images for Open Graph
  const productImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => ({
          url: normalizeImageUrl(img.src),
          width: 1200,
          height: 1200,
          alt: img.alt || product.name,
        }))
      : [
          {
            url: productImage,
            width: 1200,
            height: 1200,
            alt: product.name,
          },
        ];

  const price = parseFloat(product.price);
  const currency = "USD";

  // Build other metadata
  const otherMetadata: Record<string, string> = {
    "product:price:amount": price.toString(),
    "product:price:currency": currency,
    "product:availability": product.stock_status === "instock" ? "in stock" : "out of stock",
    "product:condition": metadata.condition || "new",
    "product:retailer": siteName,
  };

  // Add brand if available
  if (brand) {
    otherMetadata["product:brand"] = brand;
  }

  // Add weight if available
  if (product.weight && parseFloat(product.weight) > 0) {
    otherMetadata["product:weight:value"] = product.weight;
    otherMetadata["product:weight:units"] = "lbs";
  }

  // Add dimensions if available
  if (product.dimensions) {
    const dims = product.dimensions;
    if (parseFloat(dims.length) > 0 || parseFloat(dims.width) > 0 || parseFloat(dims.height) > 0) {
      otherMetadata["product:dimensions:length"] = dims.length || "0";
      otherMetadata["product:dimensions:width"] = dims.width || "0";
      otherMetadata["product:dimensions:height"] = dims.height || "0";
      otherMetadata["product:dimensions:units"] = "in";
    }
  }

  // Add rating if available
  if (product.average_rating && parseFloat(product.average_rating) > 0) {
    otherMetadata["product:rating:value"] = product.average_rating;
    otherMetadata["product:rating:scale"] = "5";
    if (product.rating_count) {
      otherMetadata["product:rating:count"] = product.rating_count.toString();
    }
  }

  return {
    title: `${product.name} | ${siteName}`,
    description: productDescription,
    keywords:
      keywords.length > 0
        ? keywords
        : [
            product.name,
            ...(product.categories?.map((cat) => cat.name) || []),
            ...(product.tags?.map((tag) => tag.name) || []),
            "premium products",
            "online shopping",
          ],
    openGraph: {
      title: product.name,
      description: productDescription,
      type: "website",
      url: productUrl,
      siteName,
      images: productImages,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: productDescription,
      images: [productImage],
    },
    alternates: {
      canonical: productUrl,
    },
    other: otherMetadata,
  };
}

/**
 * Generate metadata for products listing page
 */
export function generateProductsPageMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Browse our complete collection of premium products. Discover quality, style, and innovation in every item."
  );
  return {
    title: `All Products | ${siteName}`,
    description,
    openGraph: {
      title: `All Products | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/products`,
      siteName,
      locale: "en_US",
      images: [
        {
          url: `${siteUrl}/Rockited4D_New_Hero_Image.webp`,
          width: 1920,
          height: 1080,
          alt: `${siteName} - All Products`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `All Products | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/products`,
    },
  };
}

/**
 * Generate canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${cleanPath}`;
}

/**
 * Generate metadata for 404 not found page
 */
export function generateNotFoundMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "The page you are looking for could not be found. Return to our homepage or browse our products."
  );
  return {
    title: `Page Not Found | ${siteName}`,
    description,
    keywords: ["404", "page not found", "error", siteName],
    openGraph: {
      title: `Page Not Found | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/404`,
      siteName,
      locale: "en_US",
      images: [
        {
          url: `${siteUrl}/Rockited4D_New_Hero_Image.webp`,
          width: 1920,
          height: 1080,
          alt: `${siteName} - Page Not Found`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `Page Not Found | ${siteName}`,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/404`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Generate metadata for error page
 */
export function generateErrorMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "An unexpected error occurred. Please try again or return to our homepage."
  );
  return {
    title: `Something Went Wrong | ${siteName}`,
    description,
    keywords: ["error", "server error", siteName],
    openGraph: {
      title: `Something Went Wrong | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/error`,
      siteName,
      locale: "en_US",
      images: [
        {
          url: `${siteUrl}/Rockited4D_New_Hero_Image.webp`,
          width: 1920,
          height: 1080,
          alt: `${siteName} - Error`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `Something Went Wrong | ${siteName}`,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/error`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Get default OG image configuration
 */
function getDefaultOGImage() {
  return [
    {
      url: `${siteUrl}/Rockited4D_New_Hero_Image.webp`,
      width: 1920,
      height: 1080,
      alt: siteName,
    },
  ];
}

/**
 * Generate metadata for About page
 */
export function generateAboutMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Learn more about ROCK IT ED - our mission, values, and commitment to providing premium products with exceptional quality and customer service."
  );
  return {
    title: `About Us | ${siteName}`,
    description,
    keywords: ["about", "company", "mission", "values", siteName],
    openGraph: {
      title: `About Us | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/about`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `About Us | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/about`,
    },
  };
}

/**
 * Generate metadata for Customer Service page
 */
export function generateCustomerServiceMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Get help with your orders, product questions, returns, and more. Our dedicated customer service team is here to assist you."
  );
  return {
    title: `Customer Service | ${siteName}`,
    description,
    keywords: ["customer service", "support", "help", "contact", siteName],
    openGraph: {
      title: `Customer Service | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/about/customer-service`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Customer Service | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/about/customer-service`,
    },
  };
}

/**
 * Generate metadata for Returns page
 */
export function generateReturnsMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Learn about our return and exchange policy. We offer hassle-free returns within 30 days of purchase."
  );
  return {
    title: `Returns & Exchanges | ${siteName}`,
    description,
    keywords: ["returns", "exchanges", "refund policy", "return policy", siteName],
    openGraph: {
      title: `Returns & Exchanges | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/about/returns`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Returns & Exchanges | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/about/returns`,
    },
  };
}

/**
 * Generate metadata for FAQ page
 */
export function generateFAQMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Find answers to common questions about our products, shipping, returns, payments, and more."
  );
  return {
    title: `Frequently Asked Questions | ${siteName}`,
    description,
    keywords: ["FAQ", "frequently asked questions", "help", "questions", siteName],
    openGraph: {
      title: `Frequently Asked Questions | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/about/faq`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Frequently Asked Questions | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/about/faq`,
    },
  };
}

/**
 * Generate metadata for Privacy Policy page
 */
export function generatePrivacyMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Read our privacy policy to understand how we collect, use, and protect your personal information."
  );
  return {
    title: `Privacy Policy | ${siteName}`,
    description,
    keywords: ["privacy policy", "privacy", "data protection", "personal information", siteName],
    openGraph: {
      title: `Privacy Policy | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/about/privacy`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Privacy Policy | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/about/privacy`,
    },
  };
}

/**
 * Generate metadata for Terms of Service page
 */
export function generateTermsMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Read our terms of service to understand the rules and regulations for using our website and services."
  );
  return {
    title: `Terms of Service | ${siteName}`,
    description,
    keywords: ["terms of service", "terms", "legal", "agreement", siteName],
    openGraph: {
      title: `Terms of Service | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/about/terms`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Terms of Service | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/about/terms`,
    },
  };
}

/**
 * Generate metadata for Shipping Info page
 */
export function generateShippingMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Learn about our shipping options, delivery times, shipping costs, and tracking information."
  );
  return {
    title: `Shipping Information | ${siteName}`,
    description,
    keywords: ["shipping", "delivery", "shipping options", "tracking", siteName],
    openGraph: {
      title: `Shipping Information | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/about/shipping`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Shipping Information | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/about/shipping`,
    },
  };
}

/**
 * Generate metadata for Contact page
 */
export function generateContactMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Get in touch with ROCK IT ED. Contact our team for product inquiries, order support, or general questions."
  );
  return {
    title: `Contact Us | ${siteName}`,
    description,
    keywords: ["contact", "contact us", "customer service", "support", siteName],
    openGraph: {
      title: `Contact Us | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/about/contact`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Contact Us | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/about/contact`,
    },
  };
}

/**
 * Generate metadata for category pages
 */
export function generateCategoryMetadata(category: {
  name: string;
  slug: string;
  description?: string;
}): Metadata {
  const categoryUrl = `${siteUrl}/products/category/${category.slug}`;
  const categoryDescription = category.description
    ? optimizeMetaDescription(category.description)
    : optimizeMetaDescription(
        `Browse ${category.name} products at ${siteName}. Discover quality, style, and innovation.`
      );

  return {
    title: `${category.name} | ${siteName}`,
    description: categoryDescription,
    keywords: [category.name, "products", "category", siteName],
    openGraph: {
      title: `${category.name} | ${siteName}`,
      description: categoryDescription,
      type: "website",
      url: categoryUrl,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | ${siteName}`,
      description: categoryDescription,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: categoryUrl,
    },
  };
}

/**
 * Generate metadata for Resources page
 */
export function generateResourcesMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Find recovery resources, support groups, treatment centers, and helpful organizations for addiction recovery and 12-step programs."
  );
  return {
    title: `Resources & Blog | ${siteName}`,
    description,
    keywords: [
      "recovery resources",
      "support groups",
      "treatment centers",
      "12-step programs",
      "recovery blog",
      siteName,
    ],
    openGraph: {
      title: `Resources & Blog | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/resources`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Resources & Blog | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/resources`,
    },
  };
}

/**
 * Generate metadata for individual blog posts
 */
export function generateBlogPostMetadata(post: {
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string;
  seoKeywords?: string[];
  publishedAt: Date;
  author: string;
}): Metadata {
  const postUrl = `${siteUrl}/resources/blog/${post.slug}`;
  const description = optimizeMetaDescription(post.excerpt || `Read ${post.title} on ${siteName}.`);
  const featuredImage = post.featuredImage
    ? post.featuredImage.startsWith("http")
      ? post.featuredImage
      : `${siteUrl}${post.featuredImage}`
    : `${siteUrl}/Rockited4D_New_Hero_Image.webp`;

  const keywords =
    post.seoKeywords && post.seoKeywords.length > 0
      ? [...post.seoKeywords, "recovery", "blog", siteName]
      : ["recovery", "blog", post.title, siteName];

  return {
    title: `${post.title} | ${siteName}`,
    description,
    keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: postUrl,
      siteName,
      locale: "en_US",
      publishedTime: post.publishedAt.toISOString(),
      authors: [post.author],
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [featuredImage],
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

/**
 * Generate metadata for blog listing page
 */
export function generateBlogListingMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Read recovery-related articles, guides, and resources to support your journey. Expert insights, personal stories, and helpful information."
  );
  return {
    title: `Blog Articles | ${siteName}`,
    description,
    keywords: [
      "recovery blog",
      "recovery articles",
      "recovery guides",
      "addiction recovery",
      siteName,
    ],
    openGraph: {
      title: `Blog Articles | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/resources?tab=blog`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Blog Articles | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/resources?tab=blog`,
    },
  };
}

/**
 * Generate metadata for Cart page
 */
export function generateCartMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Review your shopping cart items and proceed to checkout."
  );
  return {
    title: `Shopping Cart | ${siteName}`,
    description,
    keywords: ["cart", "shopping cart", "checkout", siteName],
    openGraph: {
      title: `Shopping Cart | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/cart`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Shopping Cart | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/cart`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Generate metadata for Checkout page
 */
export function generateCheckoutMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Complete your purchase securely with our checkout process."
  );
  return {
    title: `Checkout | ${siteName}`,
    description,
    keywords: ["checkout", "purchase", "payment", siteName],
    openGraph: {
      title: `Checkout | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/checkout`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Checkout | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/checkout`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Generate metadata for Checkout Success page
 */
export function generateCheckoutSuccessMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Thank you for your order! Your purchase has been confirmed and you will receive an email confirmation shortly."
  );
  return {
    title: `Order Confirmation | ${siteName}`,
    description,
    keywords: ["order confirmation", "success", "thank you", siteName],
    openGraph: {
      title: `Order Confirmation | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/checkout/success`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Order Confirmation | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/checkout/success`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Generate metadata for Checkout Cancel page
 */
export function generateCheckoutCancelMetadata(): Metadata {
  const description = optimizeMetaDescription(
    "Your payment was cancelled. You can return to your cart to complete your purchase."
  );
  return {
    title: `Payment Cancelled | ${siteName}`,
    description,
    keywords: ["payment cancelled", "cancelled", "checkout", siteName],
    openGraph: {
      title: `Payment Cancelled | ${siteName}`,
      description,
      type: "website",
      url: `${siteUrl}/checkout/cancel`,
      siteName,
      locale: "en_US",
      images: getDefaultOGImage(),
    },
    twitter: {
      card: "summary_large_image",
      title: `Payment Cancelled | ${siteName}`,
      description,
      images: [`${siteUrl}/Rockited4D_New_Hero_Image.webp`],
    },
    alternates: {
      canonical: `${siteUrl}/checkout/cancel`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Get site configuration
 */
export function getSiteConfig() {
  return {
    url: siteUrl,
    name: siteName,
    description: defaultDescription,
  };
}
