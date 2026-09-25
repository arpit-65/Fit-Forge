import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/queries";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const summary = await getAnalyticsSummary();
    return NextResponse.json(
      {
        data: summary,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics summary";
    console.error("Error in GET /api/analytics/summary:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
