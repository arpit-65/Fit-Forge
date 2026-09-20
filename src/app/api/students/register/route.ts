import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Please provide a valid college email"),
  rollNo: z.string().min(3, "Roll number is required").max(30),
  department: z.string().min(2, "Department is required").max(50),
  year: z.number().int().min(1).max(4),
  collegeId: z.string().min(1, "College selection is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid registration data",
          },
        },
        { status: 400 }
      );
    }

    const { name, email, rollNo, department, year, collegeId } = parsed.data;

    // Verify college exists (match by id, code, or slug)
    const college = await prisma.college.findFirst({
      where: {
        OR: [
          { id: collegeId },
          { code: collegeId.toUpperCase() },
          { slug: collegeId.toLowerCase() },
        ],
      },
      include: {
        squads: { take: 1 },
        leagues: { where: { tier: "Bronze" }, take: 1 },
      },
    });

    if (!college) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Selected college not found." } },
        { status: 404 }
      );
    }

    // Upsert student record
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        rollNo,
        department,
        year,
        collegeId: college.id,
      },
      create: {
        name,
        email,
        rollNo,
        department,
        year,
        collegeId: college.id,
      },
    });

    // Initialize streak if not already existing
    await prisma.streak.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(),
      },
    });

    // Assign to first squad of the college
    const squad = college.squads[0];
    if (squad) {
      await prisma.squadMember.upsert({
        where: {
          squadId_userId: {
            squadId: squad.id,
            userId: user.id,
          },
        },
        update: {},
        create: {
          squadId: squad.id,
          userId: user.id,
          role: "member",
        },
      });
    }

    // Join Bronze league
    const bronzeLeague = college.leagues[0];
    if (bronzeLeague) {
      await prisma.leagueMember.upsert({
        where: {
          leagueId_userId: {
            leagueId: bronzeLeague.id,
            userId: user.id,
          },
        },
        update: {},
        create: {
          leagueId: bronzeLeague.id,
          userId: user.id,
          points: 50, // Welcome points
        },
      });
    }

    // Join active challenge if present
    const activeChallenge = await prisma.challenge.findFirst({
      where: { status: "ACTIVE" },
    });

    if (activeChallenge) {
      await prisma.challengeParticipant.upsert({
        where: {
          userId_challengeId: {
            userId: user.id,
            challengeId: activeChallenge.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          challengeId: activeChallenge.id,
          minutesLogged: 0,
        },
      });
    }

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          college: college.name,
          squad: squad?.name || "Campus Cohort",
        },
        message: `Welcome to FitForge, ${user.name}! You have been enrolled into ${squad?.name || "your campus squad"}.`,
      },
    });
  } catch (error: unknown) {
    console.error("[Register API Error]", error);
    const message = error instanceof Error ? error.message : "Failed to register student";
    return NextResponse.json(
      { error: { code: "REGISTRATION_FAILED", message } },
      { status: 500 }
    );
  }
}
