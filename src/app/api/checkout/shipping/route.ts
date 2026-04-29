import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Legacy checkout shipping endpoint has been retired. Use /api/address/validate and /api/shipping/calculate.",
    },
    { status: 410 }
  );
}
