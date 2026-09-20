import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EnrollSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  challengeId: z.string().min(1, "Challenge ID is required"),
});

/**
 * POST /api/challenges/enroll
 * Enrolls a student in a fitness challenge in Neon PostgreSQL.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EnrollSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid enrollment payload",
          },
        },
        { status: 400 }
      );
    }

    const { userId, challengeId } = parsed.data;

    // Verify user and challenge exist
    const [user, challenge] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
      prisma.challenge.findUnique({ where: { id: challengeId }, select: { id: true, title: true, targetMinutes: true } }),
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

    // Upsert enrollment
    const participant = await prisma.challengeParticipant.upsert({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
      update: {},
      create: {
        userId,
        challengeId,
        minutesLogged: 0,
        completed: false,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      data: {
        participant,
        message: `${user.name} successfully enrolled in "${challenge.title}"! Target: ${challenge.targetMinutes} minutes.`,
      },
    });
  } catch (error: unknown) {
    console.error("[Challenge Enroll API Error]", error);
    return NextResponse.json(
      { error: { code: "ENROLL_FAILED", message: "Failed to enroll in challenge" } },
      { status: 500 }
    );
  }
}
