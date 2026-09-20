import { NextRequest, NextResponse } from "next/server";
import { runRiskRecompute, isAuthorized } from "@/app/api/risk/recompute/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/recompute
 *
 * Endpoint called by Vercel Cron (configured in vercel.json).
 * Requires Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorized(req);
    if (!authorized) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized. Valid CRON_SECRET Bearer token required.",
          },
        },
        { status: 401 }
      );
    }

    const summary = await runRiskRecompute();

    return NextResponse.json({
      data: summary,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Cron risk recomputation failed";
    console.error("Error in GET /api/cron/recompute:", error);

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
