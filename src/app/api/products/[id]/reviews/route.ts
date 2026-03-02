import { NextRequest, NextResponse } from "next/server";

import { getProductReviews, createProductReview } from "@/lib/woocommerce";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");

    const reviews = await getProductReviews(productId, {
      page,
      per_page: perPage,
    });

    return NextResponse.json(reviews);
  } catch (error: unknown) {
    console.error("Product reviews API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch product reviews";
    const statusCode =
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof (error as { response?: { status?: number } }).response?.status === "number"
        ? (error as { response: { status: number } }).response.status
        : 500;

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }    const body = await request.json();
    const { reviewer, reviewer_email, review, rating } = body;    // Validation
    if (!reviewer || typeof reviewer !== "string" || reviewer.trim().length === 0) {
      return NextResponse.json({ error: "Reviewer name is required" }, { status: 400 });
    }    if (
      !reviewer_email ||
      typeof reviewer_email !== "string" ||
      reviewer_email.trim().length === 0
    ) {
      return NextResponse.json({ error: "Reviewer email is required" }, { status: 400 });
    }    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reviewer_email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }    // Review text is optional, but if provided, sanitize it
    const reviewText = review && typeof review === "string" ? review.trim() : "";    // Create the review
    const newReview = await createProductReview(productId, {
      reviewer: reviewer.trim(),
      reviewer_email: reviewer_email.trim(),
      review: reviewText,
      rating: rating,
    });    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully. It will be published after moderation.",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Product review creation API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit review";
    const statusCode =
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof (error as { response?: { status?: number } }).response?.status === "number"
        ? (error as { response: { status: number } }).response.status
        : 500;
    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: statusCode }
    );
  }
}