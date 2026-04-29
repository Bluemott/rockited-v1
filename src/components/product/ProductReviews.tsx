"use client";

import { Star, MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WooProduct, WooReview } from "@/lib/types";

import ReviewForm from "./ReviewForm";

interface ProductReviewsProps {
  product: WooProduct;
}

export default function ProductReviews({ product }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<WooReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!product.reviews_allowed || !product.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${product.id}/reviews`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch reviews (${response.status})`);
      }

      const data = await response.json();
      setReviews(data);
      setError(null);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error("Error fetching reviews:", err);
      setError(errorObj?.message || "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  }, [product.id, product.reviews_allowed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReviews();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  if (!product.reviews_allowed) {
    return null;
  }

  const displayReviews = showAll ? reviews : reviews.slice(0, 5);
  const hasMoreReviews = reviews.length > 5;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Review Form - Show above reviews */}
      <ReviewForm product={product} onReviewSubmitted={fetchReviews} />

      {/* Reviews Display */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Customer Reviews
            {product.average_rating && parseFloat(product.average_rating) > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-lg font-bold">
                  {parseFloat(product.average_rating).toFixed(1)}
                </span>
                <div className="flex items-center">
                  {renderStars(Math.round(parseFloat(product.average_rating)))}
                </div>
                <span className="text-sm text-muted-foreground ml-1">
                  ({product.rating_count || 0} {product.rating_count === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error && !error.includes("404") && !error.includes("not available") ? (
            <div className="text-sm text-destructive py-4">
              {error}
              <div className="text-xs text-muted-foreground mt-2">
                Reviews may not be available for this product.
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            <div className="space-y-6">
              {displayReviews.map((review) => (
                <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.reviewer_avatar_urls?.["96"]} />
                      <AvatarFallback>{getInitials(review.reviewer)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{review.reviewer}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(review.date_created)}
                          </div>
                        </div>
                        {review.rating > 0 && (
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        )}
                      </div>
                      {review.verified && (
                        <div className="text-xs text-primary font-medium">Verified Purchase</div>
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {review.review}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {hasMoreReviews && (
                <div className="pt-4">
                  <Button variant="outline" onClick={() => setShowAll(!showAll)} className="w-full">
                    {showAll ? "Show Less" : `Show All ${reviews.length} Reviews`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
