"use client";

import { Star, Loader2, Quote } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SiteReviewItem } from "@/lib/schemas";

const REVIEW_TRUNCATE_LENGTH = 160;

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${
        i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"
      }`}
    />
  ));
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ReviewCard({
  review,
  expanded,
  onToggleExpand,
}: {
  review: SiteReviewItem;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const needsTruncation =
    review.review.length > REVIEW_TRUNCATE_LENGTH && !expanded;
  const displayText = needsTruncation
    ? `${review.review.slice(0, REVIEW_TRUNCATE_LENGTH)}…`
    : review.review;

  return (
    <article className="h-full">
      <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="pt-6 flex flex-col flex-1">
          <div className="flex items-start gap-3 mb-3">
            <Quote className="h-6 w-6 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              {displayText}
              {needsTruncation && (
                <button
                  type="button"
                  onClick={onToggleExpand}
                  className="ml-1 text-primary hover:underline font-medium"
                >
                  Read more
                </button>
              )}
              {expanded && review.review.length > REVIEW_TRUNCATE_LENGTH && (
                <button
                  type="button"
                  onClick={onToggleExpand}
                  className="ml-1 text-primary hover:underline font-medium"
                >
                  Read less
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
            <Avatar className="h-9 w-9">
              <AvatarImage src={review.reviewer_avatar_urls?.["96"]} />
              <AvatarFallback className="text-xs">
                {getInitials(review.reviewer)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{review.reviewer}</div>
              <div className="flex items-center gap-2 flex-wrap">
                {review.rating > 0 && (
                  <div className="flex items-center gap-0.5">
                    {renderStars(review.rating)}
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.date_created)}
                </span>
                {review.verified && (
                  <span className="text-xs text-primary font-medium">
                    Verified
                  </span>
                )}
              </div>
              <Link
                href={review.product_permalink}
                className="text-xs text-primary hover:underline truncate block mt-0.5"
              >
                {review.product_name}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

export default function TestimonialsSection() {
  const [sort, setSort] = useState<"recent" | "rating">("recent");
  const [reviews, setReviews] = useState<SiteReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchReviews = useCallback(async (sortBy: "recent" | "rating") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews?sort=${sortBy}&per_page=6`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load reviews (${res.status})`);
      }
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReviews(sort);
    }, 0);
    return () => clearTimeout(timer);
  }, [sort, fetchReviews]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <section
      className="py-16 floating-content"
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2
            id="testimonials-heading"
            className="text-3xl md:text-4xl font-bold text-foreground mb-2"
          >
            Customer Reviews
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Recent and most helpful reviews from our customers.
          </p>
        </div>

        <Tabs
          value={sort}
          onValueChange={(v) => setSort(v as "recent" | "rating")}
          className="w-full"
        >
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="rating">Most helpful</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={sort} className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No reviews yet. Check back soon!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    expanded={expandedIds.has(review.id)}
                    onToggleExpand={() => toggleExpand(review.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
