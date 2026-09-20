import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RiskBand, InterventionType } from "@prisma/client";
import { calculateRiskScore } from "@/lib/risk/engine";
import { evaluateInterventionLadder } from "@/lib/risk/ladder";
import { generateNudge } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { getUsersForRiskRecompute } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Checks if a request is authorized via CRON_SECRET Bearer token,
 * x-recompute-secret header, or active Supabase session.
 */
export async function isAuthorized(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-recompute-secret");

  const expectedSecret =
    process.env.CRON_SECRET ||
    process.env.RISK_RECOMPUTE_SECRET;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token && token === expectedSecret) {
      return true;
    }
  }

  if (secretHeader && secretHeader.trim() === expectedSecret) {
    return true;
  }

  // Fallback: active Supabase session
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return true;
    }
  } catch {
    // No active user session
  }

  return false;
}

export interface RecomputeSummary {
  timestamp: string;
  totalUsersEvaluated: number;
  scoresCreated: number;
  scoresUpdated: number;
  interventionsTriggered: number;
  interventionsResolved: number;
  highRiskIdentified: number;
}

/**
 * Core idempotent risk recompute engine.
 * Guarantees no duplicate RiskScore or Intervention rows on the same calendar day.
 * Resolves active interventions when risk score drops.
 */
export async function runRiskRecompute(): Promise<RecomputeSummary> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  // Queries are strictly centralized in lib/queries.ts
  const users = await getUsersForRiskRecompute(fourteenDaysAgo, startOfDay, endOfDay);

  let scoresCreated = 0;
  let scoresUpdated = 0;
  let interventionsTriggered = 0;
  let interventionsResolved = 0;
  let highRiskCount = 0;

  for (const user of users) {
    const daysSinceRegistration = Math.max(
      1,
      Math.floor((now.getTime() - user.createdAt.getTime()) / 86400000)
    );

    const riskResult = calculateRiskScore({
      daysSinceRegistration,
      activities: user.activities,
      streak: {
        currentStreak: user.streak?.currentStreak || 0,
        longestStreak: user.streak?.longestStreak || 0,
        lastActiveDate: user.streak?.lastActiveDate,
      },
      challengeHistory: user.challenges,
      now,
    });

    if (riskResult.score !== null && riskResult.band !== null) {
      if (riskResult.score >= 0.6) {
        highRiskCount++;
      }

      // 1. Idempotent RiskScore: check if a score was already computed today
      const existingTodayScore = user.riskScores.find(
        (r) => r.computedAt >= startOfDay && r.computedAt <= endOfDay
      );

      if (existingTodayScore) {
        await prisma.riskScore.update({
          where: { id: existingTodayScore.id },
          data: {
            score: riskResult.score,
            band: riskResult.band,
            topReason: riskResult.topReason,
            computedAt: now,
          },
        });
        scoresUpdated++;
      } else {
        await prisma.riskScore.create({
          data: {
            userId: user.id,
            score: riskResult.score,
            band: riskResult.band,
            topReason: riskResult.topReason,
            bootstrapActive: false,
            computedAt: now,
          },
        });
        scoresCreated++;
      }

      // 2. Risk Dropped: Resolve active interventions when risk drops
      const previousScore = user.riskScores.find(
        (r) => !existingTodayScore || r.id !== existingTodayScore.id
      );

      const hasRiskDropped =
        previousScore &&
        (riskResult.score < previousScore.score ||
          (previousScore.band === RiskBand.HIGH && riskResult.band !== RiskBand.HIGH));

      if (riskResult.band === RiskBand.LOW && user.interventions.some((i) => i.resolvedAt === null)) {
        const updateRes = await prisma.intervention.updateMany({
          where: {
            userId: user.id,
            resolvedAt: null,
          },
          data: {
            resolvedAt: now,
          },
        });
        interventionsResolved += updateRes.count;
      } else if (
        hasRiskDropped &&
        riskResult.band === RiskBand.MID &&
        previousScore?.band === RiskBand.HIGH
      ) {
        // High risk escalated interventions resolved as risk improved to MID
        const updateRes = await prisma.intervention.updateMany({
          where: {
            userId: user.id,
            resolvedAt: null,
            type: { in: [InterventionType.GOAL_DOWNGRADE, InterventionType.MENTOR_CHECKIN] },
          },
          data: {
            resolvedAt: now,
          },
        });
        interventionsResolved += updateRes.count;
      }

      // 3. Intervention Ladder: Trigger new action if in MID or HIGH risk
      if (riskResult.band === RiskBand.MID || riskResult.band === RiskBand.HIGH) {
        const highRiskConsecutiveDays = user.riskScores.filter(
          (r) => r.band === RiskBand.HIGH
        ).length;

        const ladderAction = evaluateInterventionLadder({
          score: riskResult.score,
          band: riskResult.band,
          hasSquad: user.squadMemberships.length > 0,
          highRiskConsecutiveDays:
            riskResult.band === RiskBand.HIGH ? highRiskConsecutiveDays + 1 : 0,
        });

        if (ladderAction.shouldTrigger && ladderAction.type) {
          // Check if intervention already exists today or is currently active
          const hasExistingActiveOrToday = user.interventions.some(
            (i) =>
              i.type === ladderAction.type &&
              ((i.firedAt >= startOfDay && i.firedAt <= endOfDay) || i.resolvedAt === null)
          );

          if (!hasExistingActiveOrToday) {
            const squadName = user.squadMemberships[0]?.squad.name || null;
            const message = await generateNudge(
              {
                name: user.name,
                squadName,
                streak: user.streak?.currentStreak || 0,
                department: user.department || undefined,
                college: user.college?.name || undefined,
              },
              {
                score: riskResult.score,
                band: riskResult.band,
                topReason: riskResult.topReason,
                consecutiveMisses: user.streak?.currentStreak === 0 ? 3 : 0,
              },
              ladderAction.type
            );

            await prisma.intervention.create({
              data: {
                userId: user.id,
                type: ladderAction.type,
                message: message || ladderAction.message,
                firedAt: now,
              },
            });
            interventionsTriggered++;
          }
        }
      }
    }
  }


  return {
    timestamp: now.toISOString(),
    totalUsersEvaluated: users.length,
    scoresCreated,
    scoresUpdated,
    interventionsTriggered,
    interventionsResolved,
    highRiskIdentified: highRiskCount,
  };
}

/**
 * POST /api/risk/recompute
 * Protected endpoint to run the daily risk recomputation job.
 */
export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorized(req);
    if (!authorized) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized. Valid CRON_SECRET Bearer token or Supabase session required.",
          },
        },
        { status: 401 }
      );
    }

    const summary = await runRiskRecompute();

    return NextResponse.json({
      data: summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Risk recomputation failed";
    console.error("Error in POST /api/risk/recompute:", error);
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
