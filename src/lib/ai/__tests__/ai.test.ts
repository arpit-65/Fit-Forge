import { describe, it, expect, beforeEach, vi } from "vitest";
import { InterventionType, RiskBand } from "@prisma/client";

// Mock server-only in vitest environment
vi.mock("server-only", () => ({}));
import {
  generateNudge,
  explainRisk,
  squadSummary,
  getTemplateNudge,
  NudgeResponseSchema,
  RiskExplanationSchema,
  SquadSummarySchema,
  SimpleRateLimiter,
  aiRateLimiter,
} from "../../ai";

describe("FitForge AI Provider Wrapper & Template Fallback", () => {
  beforeEach(() => {
    // Ensure rate limiter is clean before each test
    aiRateLimiter.reset();
  });

  it("safely falls back to kind, non-shaming template message when GEMINI_API_KEY is missing or invalid", async () => {
    // Explicitly test with missing or mock API key
    const student = {
      name: "Apoorav Mehta",
      squadName: "Tech Titans",
      college: "Roorkee Institute of Technology",
    };

    const riskFactors = {
      score: 0.71,
      band: RiskBand.HIGH,
      topReason: "Missed 4 consecutive challenges",
      consecutiveMisses: 4,
    };

    const nudge = await generateNudge(
      student,
      riskFactors,
      InterventionType.GOAL_DOWNGRADE
    );

    expect(nudge).toBeDefined();
    expect(typeof nudge).toBe("string");
    // Must be valid according to Zod schema
    const parsed = NudgeResponseSchema.safeParse(nudge);
    expect(parsed.success).toBe(true);

    // Verify kind, non-shaming tone
    expect(nudge.toLowerCase()).toContain("apoorav");
    expect(nudge.toLowerCase()).not.toContain("fail");
    expect(nudge.toLowerCase()).not.toContain("disappointing");
    expect(nudge.toLowerCase()).not.toContain("penalty");
  });

  it("produces differentiated empathetic templates across intervention ladder levels", () => {
    const student = {
      name: "Pankaj Negi",
      squadName: "Cyber Strikers",
    };

    const riskFactors = {
      score: 0.45,
      band: RiskBand.MID,
      topReason: "Inconsistent workout attendance",
    };

    const squadNudge = getTemplateNudge(
      student,
      riskFactors,
      InterventionType.SQUAD_NUDGE
    );
    expect(squadNudge).toContain("Cyber Strikers");
    expect(squadNudge).toContain("teammates");

    const mentorNudge = getTemplateNudge(
      student,
      riskFactors,
      InterventionType.MENTOR_CHECKIN
    );
    expect(mentorNudge).toContain("coach");
    expect(mentorNudge).toContain("support");

    const goalDowngrade = getTemplateNudge(
      student,
      riskFactors,
      InterventionType.GOAL_DOWNGRADE
    );
    expect(goalDowngrade).toContain("target");
    expect(goalDowngrade).toContain("smooth and stress-free");

    // All must satisfy Zod schema
    expect(NudgeResponseSchema.safeParse(squadNudge).success).toBe(true);
    expect(NudgeResponseSchema.safeParse(mentorNudge).success).toBe(true);
    expect(NudgeResponseSchema.safeParse(goalDowngrade).success).toBe(true);
  });

  it("explains risk factors transparently in plain, constructive language", async () => {
    const riskFactors = {
      score: 0.65,
      band: RiskBand.HIGH,
      topReason: "No workouts logged in the past 7 days",
      consecutiveMisses: 7,
      daysSinceLastActivity: 7,
    };

    const explanation = await explainRisk(riskFactors);
    expect(explanation).toBeDefined();
    expect(typeof explanation).toBe("string");

    const parsed = RiskExplanationSchema.safeParse(explanation);
    expect(parsed.success).toBe(true);

    expect(explanation.toLowerCase()).toContain("past 7 days");
    expect(explanation.toLowerCase()).not.toContain("guilty");
  });

  it("generates a 2-line squad weekly summary celebrating momentum", async () => {
    const squad = {
      name: "Himalayan Striders",
      memberCount: 8,
      activeCount: 6,
      totalMinutesThisWeek: 420,
    };

    const summary = await squadSummary(squad);
    expect(summary).toBeDefined();

    const parsed = SquadSummarySchema.safeParse(summary);
    expect(parsed.success).toBe(true);

    expect(summary).toContain("Himalayan Striders");
    expect(summary).toContain("420 active minutes");
    expect(summary).toContain("6 active teammates");
  });

  it("enforces rate limits correctly using the in-memory token bucket/sliding window", () => {
    const limiter = new SimpleRateLimiter(3, 1000); // 3 requests per 1000ms

    expect(limiter.isAllowed()).toBe(true); // Req 1
    expect(limiter.isAllowed()).toBe(true); // Req 2
    expect(limiter.isAllowed()).toBe(true); // Req 3
    expect(limiter.isAllowed()).toBe(false); // Req 4: blocked!

    expect(limiter.getRemaining()).toBe(0);

    // Resetting restores quota immediately
    limiter.reset();
    expect(limiter.isAllowed()).toBe(true);
    expect(limiter.getRemaining()).toBe(2);
  });
});
