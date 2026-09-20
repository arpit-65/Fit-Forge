import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Returns the health status of the app.
 * Used by Docker HEALTHCHECK and uptime monitors.
 *
 * Response 200:  { status: "ok",  db: "ok",      uptime: <seconds> }
 * Response 503:  { status: "error", db: "error", message: "..." }
 */
export async function GET() {
  const start = Date.now();

  try {
    // Ping the database with a minimal query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        data: {
          status: "ok",
          db: "ok",
          uptime: Math.floor(process.uptime()),
          responseMs: Date.now() - start,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[health] DB ping failed:", err);

    return NextResponse.json(
      {
        error: {
          code: "DATABASE_UNREACHABLE",
          message: "Database unreachable",
        },
      },
      { status: 503 }
    );
  }
}
