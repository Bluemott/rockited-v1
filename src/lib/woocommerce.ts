import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { env } from './env';

// Initialize WooCommerce API client
export const wooApi = new WooCommerceRestApi({
  url: env.WOOCOMMERCE_URL,
  consumerKey: env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: env.WOOCOMMERCE_CONSUMER_SECRET,
  version: 'wc/v3',
  queryStringAuth: true, // Force Basic Authentication as query string true and using under HTTPS
});

// Product API functions
export const getProducts = async (params: any = {}) => {
  try {
    const response = await wooApi.get('products', {
      per_page: params.per_page || 10,
      page: params.page || 1,
      status: 'publish',
      ...params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProduct = async (id: number) => {
  try {
    const response = await wooApi.get(`products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

export const getProductBySlug = async (slug: string) => {
  try {
    const response = await wooApi.get('products', {
      slug,
      status: 'publish',
    });
    return response.data[0] || null;
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    throw error;
  }
};

// Categories API functions
export const getCategories = async (params: any = {}) => {
  try {
    const response = await wooApi.get('products/categories', {
      per_page: params.per_page || 100,
      ...params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getCategoryBySlug = async (slug: string) => {
  try {
    const response = await wooApi.get('products/categories', {
      slug,
    });
    return response.data[0] || null;
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    throw error;
  }
};

// Featured products API function
export const getFeaturedProducts = async (limit: number = 3) => {
  try {
    const response = await wooApi.get('products', {
      per_page: limit,
      page: 1,
      status: 'publish',
      featured: true,
      orderby: 'menu_order',
      order: 'asc',
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

// Real-time inventory check
export const checkInventory = async (productId: number) => {
  try {
    const product = await getProduct(productId);
    return {
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity,
      on_sale: product.on_sale,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
    };
  } catch (error) {
    console.error(`Error checking inventory for product ${productId}:`, error);
    throw error;
  }
};

// Product Reviews API functions
export const getProductReviews = async (productId: number, params: any = {}) => {
  try {
    // Try the product-specific reviews endpoint first
    const response = await wooApi.get(`products/${productId}/reviews`, {
      per_page: params.per_page || 10,
      page: params.page || 1,
      status: 'approved',
      ...params,
    });
    return response.data || [];
  } catch (error: any) {
    // If the product-specific endpoint fails, try the general reviews endpoint
    try {
      const response = await wooApi.get('products/reviews', {
        product: productId,
        per_page: params.per_page || 10,
        page: params.page || 1,
        status: 'approved',
        ...params,
      });
      return response.data || [];
    } catch (fallbackError: any) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      // If both endpoints fail, return empty array instead of throwing
      // This allows the component to gracefully handle no reviews
      if (error?.response?.status === 404 || fallbackError?.response?.status === 404) {
        console.warn(`Reviews endpoint not available for product ${productId}, returning empty array`);
        return [];
      }
      throw error;
    }
  }
};

export const createProductReview = async (
  productId: number,
  reviewData: {
    reviewer: string;
    reviewer_email: string;
    review: string;
    rating: number;
  }
) => {
  try {
    // Validate rating
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Prepare review payload
    const reviewPayload: any = {
      product_id: productId,
      reviewer: reviewData.reviewer.trim(),
      reviewer_email: reviewData.reviewer_email.trim(),
      review: reviewData.review.trim() || '',
      rating: reviewData.rating,
      status: 'hold', // Always start as pending moderation
    };

    // Flag negative reviews (1-2 stars) for extra review
    if (reviewData.rating <= 2) {
      reviewPayload.meta_data = [
        {
          key: '_needs_extra_review',
          value: 'yes',
        },
      ];
    }

    // Create review via WooCommerce API
    const response = await wooApi.post(`products/${productId}/reviews`, reviewPayload);
    
    return response.data;
  } catch (error: any) {
    console.error(`Error creating review for product ${productId}:`, error);
    
    // Provide more specific error messages
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    if (error?.response?.status === 400) {
      throw new Error('Invalid review data. Please check your input.');
    }
    
    if (error?.response?.status === 404) {
      throw new Error('Product not found or reviews not enabled for this product.');
    }
    
    throw new Error(error?.message || 'Failed to submit review. Please try again.');
  }
};

// Product Variations API functions
export const getProductVariations = async (productId: number, params: any = {}) => {
  try {
    const response = await wooApi.get(`products/${productId}/variations`, {
      per_page: params.per_page || 100,
      page: params.page || 1,
      ...params,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching variations for product ${productId}:`, error);
    throw error;
  }
};

export const getProductVariation = async (productId: number, variationId: number) => {
  try {
    const response = await wooApi.get(`products/${productId}/variations/${variationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching variation ${variationId} for product ${productId}:`, error);
    throw error;
  }
};

// Shipping Zones API functions
export const getShippingZones = async () => {
  try {
    const response = await wooApi.get('shipping/zones');
    return response.data;
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    throw error;
  }
};

export const getShippingZoneMethods = async (zoneId: number) => {
  try {
    const response = await wooApi.get(`shipping/zones/${zoneId}/methods`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching shipping methods for zone ${zoneId}:`, error);
    throw error;
  }
};

// Shipping calculation function
export const calculateShipping = async (params: {
  country: string;
  state?: string;
  postcode?: string;
  city?: string;
  products: Array<{ id: number; quantity: number }>;
}) => {
  try {
    // First, get product details to calculate total weight and dimensions
    const productDetails = await Promise.all(
      params.products.map(async (item) => {
        const product = await getProduct(item.id);
        return {
          ...product,
          quantity: item.quantity,
        };
      })
    );

    // Calculate total weight
    const totalWeight = productDetails.reduce((sum, item) => {
      const weight = parseFloat(item.weight || '0');
      return sum + weight * item.quantity;
    }, 0);

    // Get shipping zones
    const zones = await getShippingZones();
    
    // Find matching zone based on location
    const matchingZone = zones.find((zone: any) => {
      if (zone.locations) {
        return zone.locations.some((location: any) => {
          if (location.type === 'country' && location.code === params.country) {
            return true;
          }
          if (location.type === 'state' && location.code === `${params.country}:${params.state}`) {
            return true;
          }
          return false;
        });
      }
      return false;
    }) || zones.find((zone: any) => zone.id === 0); // Fallback to default zone

    if (!matchingZone) {
      throw new Error('No matching shipping zone found');
    }

    // Get shipping methods for the zone
    const methods = await getShippingZoneMethods(matchingZone.id);

    // Calculate shipping rates based on methods
    const rates = methods.map((method: any) => {
      let cost = '0.00';
      
      // Calculate cost based on method type
      if (method.settings && method.settings.cost) {
        const baseCost = parseFloat(method.settings.cost.value || '0');
        
        // For weight-based shipping, add weight cost
        if (method.settings.class_cost && totalWeight > 0) {
          // This is a simplified calculation - actual implementation may vary
          const weightCost = totalWeight * parseFloat(method.settings.class_cost.value || '0');
          cost = (baseCost + weightCost).toFixed(2);
        } else {
          cost = baseCost.toFixed(2);
        }
      }

      return {
        method_id: method.method_id,
        method_title: method.method_title || method.title || 'Standard Shipping',
        cost: cost,
        estimated_delivery: method.settings?.estimated_delivery?.value || '3-5 business days',
      };
    });

    return {
      zone_id: matchingZone.id,
      zone_name: matchingZone.name,
      rates,
      total_weight: totalWeight.toFixed(2),
    };
  } catch (error) {
    console.error('Error calculating shipping:', error);
    throw error;
  }
};

// Get shipping methods (all available methods)
export const getShippingMethods = async () => {
  try {
    const zones = await getShippingZones();
    const allMethods: any[] = [];

    for (const zone of zones) {
      try {
        const methods = await getShippingZoneMethods(zone.id);
        allMethods.push(...methods.map((method: any) => ({
          ...method,
          zone_id: zone.id,
          zone_name: zone.name,
        })));
      } catch (error) {
        console.error(`Error fetching methods for zone ${zone.id}:`, error);
      }
    }

    return allMethods;
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    throw error;
  }
};