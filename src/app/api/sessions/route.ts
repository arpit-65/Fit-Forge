import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getRecentActivities } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LogSessionSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: z.enum(["gym", "run", "hiit", "yoga", "sport", "swim", "walk"]).default("gym"),
  durationMinutes: z.number().int().min(5).max(300),
  notes: z.string().max(250).optional(),
});

/**
 * GET /api/sessions
 * Returns logged workout sessions from database.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const activities = await getRecentActivities({
      userId,
      limit,
    });

    return NextResponse.json({
      data: activities,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/sessions:", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch workout sessions" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 * Logs a new workout session and updates the student's active streak.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LogSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid session data",
          },
        },
        { status: 400 }
      );
    }

    const { userId, type, durationMinutes, notes } = parsed.data;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { streak: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const now = new Date();

    // 1. Create activity
    const activity = await prisma.activity.create({
      data: {
        userId,
        type,
        durationMinutes,
        notes: notes || null,
        date: now,
      },
    });

    // 2. Update streak
    const lastActive = user.streak?.lastActiveDate;
    let newCurrentStreak = 1;

    if (lastActive) {
      const diffHours = (now.getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60);
      if (diffHours < 36) {
        newCurrentStreak = (user.streak?.currentStreak || 0) + 1;
      }
    }

    const newLongest = Math.max(newCurrentStreak, user.streak?.longestStreak || 0);

    await prisma.streak.upsert({
      where: { userId },
      update: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongest,
        lastActiveDate: now,
      },
      create: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: now,
      },
    });

    // 3. Award points in ledger (10 points per workout)
    await prisma.pointsLedger.create({
      data: {
        userId,
        points: 10,
        reason: `Completed ${durationMinutes}m ${type} session`,
        date: now,
      },
    });

    return NextResponse.json(
      {
        data: {
          activityId: activity.id,
          type: activity.type,
          durationMinutes: activity.durationMinutes,
          currentStreak: newCurrentStreak,
          pointsEarned: 10,
          message: `Logged ${durationMinutes} minutes of ${type}! Active streak: ${newCurrentStreak} days.`,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error in POST /api/sessions:", error);
    return NextResponse.json(
      { error: { code: "LOG_FAILED", message: "Failed to record workout session" } },
      { status: 500 }
    );
  }
}
