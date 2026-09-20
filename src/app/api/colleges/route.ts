import "server-only";
import { NextResponse } from "next/server";
import { getCollegesList } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const colleges = await getCollegesList();
    return NextResponse.json({ data: colleges });
  } catch (error: unknown) {
    console.error("[Colleges API Error]", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch colleges" } },
      { status: 500 }
    );
  }
}

