import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JoinSquadSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  squadId: z.string().min(1, "Squad ID is required"),
});

/**
 * POST /api/squads/join
 * Assigns or switches a student to a squad in Neon DB.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = JoinSquadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid squad join payload",
          },
        },
        { status: 400 }
      );
    }

    const { userId, squadId } = parsed.data;

    const [user, squad] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
      prisma.squad.findUnique({
        where: { id: squadId },
        include: { _count: { select: { members: true } } },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Student not found" } },
        { status: 404 }
      );
    }

    if (!squad) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Squad not found" } },
        { status: 404 }
      );
    }

    // Check capacity
    if (squad._count.members >= squad.maxSize) {
      // Check if already a member
      const existing = await prisma.squadMember.findUnique({
        where: { squadId_userId: { squadId, userId } },
      });
      if (!existing) {
        return NextResponse.json(
          { error: { code: "SQUAD_FULL", message: "This squad is currently at maximum capacity (10 athletes)." } },
          { status: 400 }
        );
      }
    }

    // Remove previous squad memberships for this user to maintain single primary squad
    await prisma.squadMember.deleteMany({
      where: { userId },
    });

    // Create new membership
    const membership = await prisma.squadMember.create({
      data: {
        userId,
        squadId,
        role: "member",
      },
    });

    return NextResponse.json({
      data: {
        membership,
        squadName: squad.name,
        message: `${user.name} is now an active member of ${squad.name}!`,
      },
    });
  } catch (error: unknown) {
    console.error("[Squad Join API Error]", error);
    return NextResponse.json(
      { error: { code: "JOIN_FAILED", message: "Failed to join squad" } },
      { status: 500 }
    );
  }
}
