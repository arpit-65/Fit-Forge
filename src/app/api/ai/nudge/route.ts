import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { InterventionType, RiskBand } from "@prisma/client";
import {
  generateNudge,
  aiRateLimiter,
  StudentNudgeContext,
  RiskFactorsContext,
} from "@/lib/ai";
import { isAuthorized } from "@/app/api/risk/recompute/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NudgeRequestSchema = z.object({
  student: z.object({
    name: z.string().min(1, "Student name is required").max(50),
    squadName: z.string().max(50).nullable().optional(),
    streak: z.number().int().nonnegative().optional(),
    department: z.string().max(50).optional(),
    college: z.string().max(100).optional(),
  }),
  riskFactors: z.object({
    score: z.number().min(0).max(1).nullable().optional(),
    band: z.nativeEnum(RiskBand).or(z.string()).nullable().optional(),
    topReason: z.string().max(150).default("Workout frequency decline"),
    daysSinceLastActivity: z.number().int().nonnegative().optional(),
    completionRateLast7Days: z.number().min(0).max(1).optional(),
    consecutiveMisses: z.number().int().nonnegative().optional(),
    challengeMissCount: z.number().int().nonnegative().optional(),
  }),
  ladderLevel: z.nativeEnum(InterventionType).default(InterventionType.NUDGE),
});

/**
 * POST /api/ai/nudge
 * Protected endpoint for generating personalized, empathetic intervention messages.
 */
export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorized(req);
    if (!authorized) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized. Valid CRON_SECRET Bearer token or active Supabase session required.",
          },
        },
        { status: 401 }
      );
    }

    // Check in-memory rate limiter
    if (!aiRateLimiter.isAllowed()) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too Many Requests. AI rate limit reached (30 req/min).",
          },
        },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Invalid JSON in request body",
          },
        },
        { status: 400 }
      );
    }

    const validation = NudgeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error.issues[0]?.message || "Validation failed",
          },
        },
        { status: 400 }
      );
    }

    const { student, riskFactors, ladderLevel } = validation.data;

    const apiKey = process.env.GEMINI_API_KEY;
    const isGeminiAvailable = Boolean(
      apiKey && apiKey.trim() !== "" && apiKey !== "your-gemini-api-key"
    );

    const message = await generateNudge(
      student as StudentNudgeContext,
      riskFactors as RiskFactorsContext,
      ladderLevel
    );

    return NextResponse.json({
      data: {
        message,
        provider: isGeminiAvailable ? "gemini" : "template_fallback",
        ladderLevel,
        remainingRateLimit: aiRateLimiter.getRemaining(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[FitForge AI] Error in POST /api/ai/nudge:", error);
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
