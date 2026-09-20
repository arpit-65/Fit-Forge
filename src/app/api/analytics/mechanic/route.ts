import { NextResponse } from "next/server";
import { getMechanicExample } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mechanic = await getMechanicExample();
    return NextResponse.json({
      data: mechanic,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch mechanic example";
    console.error("Error in GET /api/analytics/mechanic:", error);
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
