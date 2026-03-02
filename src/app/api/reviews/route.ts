import { NextRequest, NextResponse } from "next/server";

import { siteReviewsResponseSchema } from "@/lib/schemas";
import { getSiteReviews } from "@/lib/woocommerce";

const PER_PAGE_DEFAULT = 6;
const PER_PAGE_MAX = 12;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort");
    const orderby = sort === "rating" ? "rating" : "date";
    const perPageParam = searchParams.get("per_page");
    const perPage = Math.min(
      perPageParam ? parseInt(perPageParam, 10) : PER_PAGE_DEFAULT,
      PER_PAGE_MAX
    );
    const safePerPage = Number.isNaN(perPage) || perPage < 1 ? PER_PAGE_DEFAULT : perPage;

    const reviews = await getSiteReviews({
      orderby,
      order: "desc",
      per_page: safePerPage,
      page: 1,
    });

    const parsed = siteReviewsResponseSchema.safeParse(reviews);
    if (!parsed.success) {
      console.error("Reviews API validation failed:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid reviews data" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch reviews";
    console.error("Reviews API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
