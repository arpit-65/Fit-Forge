import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DowngradeSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
  userId: z.string().optional(),
});

/**
 * POST /api/challenges/downgrade
 * Executes FitForge's core habit-retention formula:
 * targetMinutes = max(10, Math.round(currentTarget / 3))
 * Reduces friction to avoid dropout during academic stress or fatigue.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DowngradeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid downgrade payload",
          },
        },
        { status: 400 }
      );
    }

    const { challengeId, userId } = parsed.data;

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Challenge not found" } },
        { status: 404 }
      );
    }

    // Preserve original target if not already preserved
    const originalTarget = challenge.originalTargetMinutes || challenge.targetMinutes;
    const newTarget = Math.max(10, Math.round(challenge.targetMinutes / 3));

    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        originalTargetMinutes: originalTarget,
        targetMinutes: newTarget,
        status: "DOWNGRADED",
      },
    });

    // If userId provided, log a GOAL_DOWNGRADE intervention
    if (userId) {
      await prisma.intervention.create({
        data: {
          userId,
          type: "GOAL_DOWNGRADE",
          message: `Goal eased from ${originalTarget}m to ${newTarget}m to eliminate friction and sustain habit consistency.`,
          firedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      data: {
        challengeId: updated.id,
        originalTargetMinutes: originalTarget,
        downgradedTargetMinutes: newTarget,
        status: updated.status,
        formula: "max(10, Math.round(target / 3))",
        message: `Friction reduced! Goal adjusted from ${originalTarget} min to ${newTarget} min. Momentum preserved!`,
      },
    });
  } catch (error: unknown) {
    console.error("[Challenge Downgrade API Error]", error);
    return NextResponse.json(
      { error: { code: "DOWNGRADE_FAILED", message: "Failed to apply goal downgrade" } },
      { status: 500 }
    );
  }
}
