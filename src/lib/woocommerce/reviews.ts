import type { WooReview } from "../types";

import { wooApi } from "./client";

// Review query parameters
export interface ReviewQueryParams {
  per_page?: number;
  page?: number;
  status?: string;
  [key: string]: unknown;
}

// Site-wide reviews (homepage testimonials): orderby date = recent, rating = most helpful
export interface SiteReviewsParams {
  per_page?: number;
  page?: number;
  orderby?: "date" | "rating";
  order?: "asc" | "desc";
}

export const getSiteReviews = async (
  params: SiteReviewsParams = {}
): Promise<WooReview[]> => {
  try {
    const response = await wooApi.get("products/reviews", {
      per_page: params.per_page ?? 10,
      page: params.page ?? 1,
      status: "approved",
      orderby: params.orderby ?? "date",
      order: params.order ?? "desc",
    });
    return response.data || [];
  } catch (error: unknown) {
    const errorObj = error as { response?: { status?: number } };
    console.error("Error fetching site reviews:", error);
    if (errorObj?.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

// Product Reviews API functions
export const getProductReviews = async (
  productId: number,
  params: ReviewQueryParams = {}
): Promise<WooReview[]> => {
  try {
    // Try the product-specific reviews endpoint first
    const response = await wooApi.get(`products/${productId}/reviews`, {
      per_page: params.per_page || 10,
      page: params.page || 1,
      status: "approved",
      ...params,
    });
    return response.data || [];
  } catch (error: unknown) {
    const errorObj = error as { response?: { status?: number } };
    // If the product-specific endpoint fails, try the general reviews endpoint
    try {
      const response = await wooApi.get("products/reviews", {
        product: productId,
        per_page: params.per_page || 10,
        page: params.page || 1,
        status: "approved",
        ...params,
      });
      return response.data || [];
    } catch (fallbackError: unknown) {
      const fallbackErrorObj = fallbackError as { response?: { status?: number } };
      console.error(`Error fetching reviews for product ${productId}:`, error);
      // If both endpoints fail, return empty array instead of throwing
      // This allows the component to gracefully handle no reviews
      if (errorObj?.response?.status === 404 || fallbackErrorObj?.response?.status === 404) {
        console.warn(
          `Reviews endpoint not available for product ${productId}, returning empty array`
        );
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
): Promise<WooReview> => {
  try {
    // Validate rating
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Prepare review payload
    const reviewPayload: {
      product_id: number;
      reviewer: string;
      reviewer_email: string;
      review: string;
      rating: number;
      status: string;
      meta_data?: Array<{ key: string; value: string }>;
    } = {
      product_id: productId,
      reviewer: reviewData.reviewer.trim(),
      reviewer_email: reviewData.reviewer_email.trim(),
      review: reviewData.review.trim() || "",
      rating: reviewData.rating,
      status: "hold", // Always start as pending moderation
    };

    // Flag negative reviews (1-2 stars) for extra review
    if (reviewData.rating <= 2) {
      reviewPayload.meta_data = [
        {
          key: "_needs_extra_review",
          value: "yes",
        },
      ];
    }

    // Create review via WooCommerce API
    const response = await wooApi.post(`products/${productId}/reviews`, reviewPayload);

    return response.data;
  } catch (error: unknown) {
    const errorObj = error as {
      response?: {
        status?: number;
        data?: { message?: string };
      };
      message?: string;
    };
    console.error(`Error creating review for product ${productId}:`, error);

    // Provide more specific error messages
    if (errorObj?.response?.data?.message) {
      throw new Error(errorObj.response.data.message);
    }

    if (errorObj?.response?.status === 400) {
      throw new Error("Invalid review data. Please check your input.");
    }

    if (errorObj?.response?.status === 404) {
      throw new Error("Product not found or reviews not enabled for this product.");
    }

    throw new Error(errorObj?.message || "Failed to submit review. Please try again.");
  }
};
