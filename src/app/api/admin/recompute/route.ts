import "server-only";
import { NextResponse } from "next/server";
import { runRiskRecompute } from "@/app/api/risk/recompute/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/recompute
 * Internal Admin endpoint to trigger on-demand campus risk recomputations
 * across all participating Uttarakhand colleges.
 */
export async function POST() {
  try {
    const summary = await runRiskRecompute();
    return NextResponse.json({ data: summary });
  } catch (error: unknown) {
    console.error("[Admin Recompute API Error]", error);
    const message = error instanceof Error ? error.message : "Failed to run risk recompute";
    return NextResponse.json(
      { error: { code: "RECOMPUTE_FAILED", message } },
      { status: 500 }
    );
  }
}
