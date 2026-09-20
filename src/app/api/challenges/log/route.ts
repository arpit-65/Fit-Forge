import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LogChallengeMinutesSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  challengeId: z.string().min(1, "Challenge ID is required"),
  minutes: z.number().int().min(5).max(300),
  workoutType: z.enum(["gym", "run", "hiit", "yoga", "sport", "swim", "walk"]).default("gym"),
});

/**
 * POST /api/challenges/log
 * Logs minutes toward a challenge for a student in Neon DB,
 * creating an Activity record and updating the participant's progress.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LogChallengeMinutesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid challenge log payload",
          },
        },
        { status: 400 }
      );
    }

    const { userId, challengeId, minutes, workoutType } = parsed.data;

    const [user, challenge] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { streak: true } }),
      prisma.challenge.findUnique({ where: { id: challengeId } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Student not found" } },
        { status: 404 }
      );
    }

    if (!challenge) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Challenge not found" } },
        { status: 404 }
      );
    }

    const now = new Date();

    // 1. Ensure participant record exists
    const participant = await prisma.challengeParticipant.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
    });

    const currentMinutes = participant?.minutesLogged || 0;
    const newTotalMinutes = currentMinutes + minutes;
    const isCompleted = newTotalMinutes >= challenge.targetMinutes;

    const updatedParticipant = await prisma.challengeParticipant.upsert({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
      update: {
        minutesLogged: newTotalMinutes,
        completed: isCompleted,
        status: isCompleted ? "COMPLETED" : (participant?.status || "ACTIVE"),
      },
      create: {
        userId,
        challengeId,
        minutesLogged: newTotalMinutes,
        completed: isCompleted,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
      },
    });

    // 2. Create activity record
    const activity = await prisma.activity.create({
      data: {
        userId,
        type: workoutType,
        durationMinutes: minutes,
        notes: `Logged for challenge: ${challenge.title}`,
        date: now,
      },
    });

    // 3. Update streak
    const lastActive = user.streak?.lastActiveDate;
    let newStreak = 1;
    if (lastActive) {
      const diffHours = (now.getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60);
      if (diffHours < 36) {
        newStreak = (user.streak?.currentStreak || 0) + 1;
      }
    }

    await prisma.streak.upsert({
      where: { userId },
      update: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, user.streak?.longestStreak || 0),
        lastActiveDate: now,
      },
      create: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: now,
      },
    });

    // 4. Award points
    await prisma.pointsLedger.create({
      data: {
        userId,
        points: isCompleted ? 50 : 15,
        reason: isCompleted
          ? `Completed challenge "${challenge.title}"!`
          : `Logged ${minutes}m for challenge "${challenge.title}"`,
        date: now,
      },
    });

    return NextResponse.json({
      data: {
        minutesLogged: newTotalMinutes,
        targetMinutes: challenge.targetMinutes,
        completed: isCompleted,
        activityId: activity.id,
        currentStreak: newStreak,
        message: isCompleted
          ? `🎉 Challenge "${challenge.title}" Completed! 50 bonus points awarded.`
          : `Logged ${minutes} minutes! Total progress: ${newTotalMinutes}/${challenge.targetMinutes} min.`,
      },
    });
  } catch (error: unknown) {
    console.error("[Challenge Log API Error]", error);
    return NextResponse.json(
      { error: { code: "LOG_FAILED", message: "Failed to record challenge progress" } },
      { status: 500 }
    );
  }
}
