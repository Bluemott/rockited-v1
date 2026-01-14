import { MetadataRoute } from 'next';
import { getProducts, getCategories } from '@/lib/woocommerce';
import { getAllPosts } from '@/lib/blog';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rockited4d.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all products with pagination (needed for lastModified dates)
  let allProducts: any[] = [];
  let page = 1;
  let hasMore = true;
  let mostRecentProductDate: Date | null = null;

  try {
    while (hasMore) {
      const products = await getProducts({
        per_page: 100,
        page,
        status: 'publish',
      });

      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts = [...allProducts, ...products];
        // Track most recent product modification date
        products.forEach((product: any) => {
          if (product.date_modified) {
            const modDate = new Date(product.date_modified);
            if (!mostRecentProductDate || modDate > mostRecentProductDate) {
              mostRecentProductDate = modDate;
            }
          }
        });
        // WooCommerce typically returns max 100 per page
        hasMore = products.length === 100;
        page++;
      }
    }

    // Fetch all categories
    let allCategories: any[] = [];
    try {
      let categoryPage = 1;
      let categoryHasMore = true;
      while (categoryHasMore) {
        const categories = await getCategories({
          per_page: 100,
          page: categoryPage,
        });
        if (categories.length === 0) {
          categoryHasMore = false;
        } else {
          allCategories = [...allCategories, ...categories];
          categoryHasMore = categories.length === 100;
          categoryPage++;
        }
      }
    } catch (error) {
      console.error('Error fetching categories for sitemap:', error);
      // Continue without categories if fetch fails
    }

    // Generate product pages
    const productPages: MetadataRoute.Sitemap = allProducts.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: product.date_modified 
        ? new Date(product.date_modified)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Generate category pages
    // For category lastModified, use the most recent product modification date in that category
    const categoryPages: MetadataRoute.Sitemap = allCategories
      .filter((cat: any) => cat.count > 0) // Only include categories with products
      .map((category: any) => {
        // Find most recent product modification date in this category
        const categoryProducts = allProducts.filter((product: any) =>
          product.categories?.some((cat: any) => cat.id === category.id)
        );
        let categoryLastModified = new Date();
        if (categoryProducts.length > 0) {
          const mostRecentProduct = categoryProducts.reduce((latest: any, product: any) => {
            if (!product.date_modified) return latest;
            const productDate = new Date(product.date_modified);
            if (!latest || productDate > new Date(latest.date_modified || 0)) {
              return product;
            }
            return latest;
          }, null);
          if (mostRecentProduct?.date_modified) {
            categoryLastModified = new Date(mostRecentProduct.date_modified);
          }
        }
        return {
          url: `${siteUrl}/products/category/${category.slug}`,
          lastModified: categoryLastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      });

    // Static pages with improved lastModified dates
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: siteUrl,
        lastModified: new Date(), // Homepage changes frequently, current date is appropriate
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${siteUrl}/products`,
        lastModified: mostRecentProductDate || new Date(), // Use most recent product modification date
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${siteUrl}/resources`,
        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago (weekly frequency)
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${siteUrl}/about`,
        lastModified: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago (monthly frequency)
        changeFrequency: 'monthly',
        priority: 0.7,
      },
    ];

    // Generate blog post pages
    let blogPages: MetadataRoute.Sitemap = [];
    try {
      const blogPosts = getAllPosts();
      blogPages = blogPosts.map((post) => ({
        url: `${siteUrl}/resources/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    } catch (error) {
      console.error('Error fetching blog posts for sitemap:', error);
      // Continue without blog posts if fetch fails
    }

    return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least static pages if product fetch fails
    const fallbackStaticPages: MetadataRoute.Sitemap = [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${siteUrl}/products`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${siteUrl}/resources`,
        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${siteUrl}/about`,
        lastModified: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
    ];
    // Try to include blog posts even in fallback
    let blogPages: MetadataRoute.Sitemap = [];
    try {
      const blogPosts = getAllPosts();
      blogPages = blogPosts.map((post) => ({
        url: `${siteUrl}/resources/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    } catch (error) {
      // Silently fail for blog posts in fallback
    }

    return [...fallbackStaticPages, ...blogPages];
  }
}

