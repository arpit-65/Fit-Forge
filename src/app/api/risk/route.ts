import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getRecentRiskScores } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/risk
 * Returns recent risk scores, optionally filtered by ?userId=<id> or ?collegeId=<id>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const collegeId = searchParams.get("collegeId") || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const scores = await getRecentRiskScores({
      userId,
      collegeId,
      limit,
    });

    return NextResponse.json({
      data: scores,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/risk:", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch risk scores" } },
      { status: 500 }
    );
  }
}

