import { getBrandFromMetadata, getStructuredMetadata } from "@/lib/productMetadata";
import { getSiteConfig } from "@/lib/seo";
import { WooProduct } from "@/lib/types";
import { normalizeImageUrl } from "@/lib/utils";

// One year from module load (stable for schema; avoids Date.now() during render)
const PRICE_VALID_UNTIL = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
})();

interface StructuredDataProps {
  type: "organization" | "product" | "breadcrumb" | "website";
  data?: WooProduct | Array<{ name: string; url: string }>;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const siteConfig = getSiteConfig();

  const getStructuredData = () => {
    switch (type) {
      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
          logo: `${siteConfig.url}/Rock_it_ed_Comp.png`,
          description: siteConfig.description,
          sameAs: [
            // Add social media links here when available
          ],
        };

      case "website":
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        };

      case "product":
        if (!data) return null;
        const product = data as WooProduct;
        const price = parseFloat(product.price);

        // Get metadata
        const metadata = getStructuredMetadata(product);
        const brand = getBrandFromMetadata(product) || siteConfig.name;

        // Build product schema
        const productSchema: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.short_description
            ? product.short_description.replace(/<[^>]*>/g, "").substring(0, 500)
            : product.description?.replace(/<[^>]*>/g, "").substring(0, 500) || "",
          image: product.images?.map((img) => normalizeImageUrl(img.src)) || [],
          sku: product.sku || product.id.toString(),
          brand: {
            "@type": "Brand",
            name: brand,
          },
          offers: {
            "@type": "Offer",
            url: `${siteConfig.url}/products/${product.slug}`,
            priceCurrency: "USD",
            price: price.toString(),
            priceValidUntil: PRICE_VALID_UNTIL,
            availability:
              product.stock_status === "instock"
                ? "https://schema.org/InStock"
                : product.stock_status === "outofstock"
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/PreOrder",
            itemCondition: `https://schema.org/${metadata.condition === "new" ? "NewCondition" : metadata.condition === "used" ? "UsedCondition" : "NewCondition"}`,
            seller: {
              "@type": "Organization",
              name: siteConfig.name,
            },
          },
        };

        // Add weight if available
        if (product.weight && parseFloat(product.weight) > 0) {
          productSchema.weight = {
            "@type": "QuantitativeValue",
            value: parseFloat(product.weight),
            unitCode: "LBR", // Pounds
          };
        }

        // Add dimensions if available
        if (
          product.dimensions &&
          (parseFloat(product.dimensions.length) > 0 ||
            parseFloat(product.dimensions.width) > 0 ||
            parseFloat(product.dimensions.height) > 0)
        ) {
          productSchema.dimensions = {
            "@type": "QuantitativeValue",
            length: {
              "@type": "Distance",
              value: parseFloat(product.dimensions.length || "0"),
              unitCode: "INH", // Inches
            },
            width: {
              "@type": "Distance",
              value: parseFloat(product.dimensions.width || "0"),
              unitCode: "INH",
            },
            height: {
              "@type": "Distance",
              value: parseFloat(product.dimensions.height || "0"),
              unitCode: "INH",
            },
          };
        }

        // Add shipping information if available
        if (product.shipping_required && product.shipping_class) {
          productSchema.shippingDetails = {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              currency: "USD",
            },
            shippingDestination: {
              "@type": "DefinedRegion",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
            },
          };
        }

        // Add aggregate rating if available
        if (product.average_rating && parseFloat(product.average_rating) > 0) {
          productSchema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: product.average_rating,
            reviewCount: product.rating_count || 0,
            bestRating: "5",
            worstRating: "1",
          };
        }

        // Add category if available
        if (product.categories && product.categories.length > 0) {
          productSchema.category = product.categories.map((cat) => cat.name).join(", ");
        }

        // Add additional properties from metadata
        if (metadata.warranty) {
          productSchema.warranty = {
            "@type": "WarrantyPromise",
            warrantyScope: "https://schema.org/WarrantyScope",
            description: metadata.warranty,
          };
        }

        return productSchema;

      case "breadcrumb":
        if (!data) return null;
        const breadcrumbs = data as Array<{ name: string; url: string }>;

        // Validate breadcrumb data
        if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
          return null;
        }

        // Filter out invalid breadcrumbs and ensure proper formatting
        const validBreadcrumbs = breadcrumbs
          .filter((crumb) => crumb && crumb.name && crumb.url)
          .map((crumb) => ({
            name: String(crumb.name).trim(),
            url: String(crumb.url).trim(),
          }))
          .filter((crumb) => crumb.name.length > 0 && crumb.url.length > 0);

        if (validBreadcrumbs.length === 0) {
          return null;
        }

        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: validBreadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
          })),
        };

      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
