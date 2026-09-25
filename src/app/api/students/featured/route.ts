import { NextResponse } from "next/server";
import { getFeaturedStudents } from "@/lib/queries";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const students = await getFeaturedStudents();
    return NextResponse.json(
      {
        data: students,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch featured students";
    console.error("Error in GET /api/students/featured:", error);
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
