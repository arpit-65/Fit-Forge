import { describe, it, expect } from "vitest";
import { RiskBand, InterventionType } from "@prisma/client";
import { calculateRiskScore } from "../engine";
import {
  evaluateInterventionLadder,
  calculateDowngradeTarget,
} from "../ladder";

describe("FitForge Risk Engine & Intervention Ladder", () => {
  const mockNow = new Date("2026-09-19T12:00:00Z");

  // 1. Cold Start Gate Test
  it("Cold start: activates bootstrap mode for students under 7 days enrolled with no score", () => {
    const result = calculateRiskScore({
      daysSinceRegistration: 5,
      activities: [
        { date: "2026-09-18T10:00:00Z", durationMinutes: 30 },
        { date: "2026-09-17T10:00:00Z", durationMinutes: 30 },
      ],
      streak: { currentStreak: 2, longestStreak: 2 },
      now: mockNow,
    });

    expect(result.bootstrapActive).toBe(true);
    expect(result.score).toBeNull();
    expect(result.band).toBeNull();
    expect(result.topReason).toContain("Cold start active");
  });

  // 2. Low Risk Test (< 0.30)
  it("Low risk: consistent workouts yield score < 0.30, band LOW, and no intervention", () => {
    // 5 workouts in the last 7 days, active streak
    const activities = [
      { date: "2026-09-19T08:00:00Z", durationMinutes: 50 },
      { date: "2026-09-18T08:00:00Z", durationMinutes: 45 },
      { date: "2026-09-17T08:00:00Z", durationMinutes: 60 },
      { date: "2026-09-15T08:00:00Z", durationMinutes: 45 },
      { date: "2026-09-13T08:00:00Z", durationMinutes: 55 },
      { date: "2026-09-11T08:00:00Z", durationMinutes: 50 },
      { date: "2026-09-09T08:00:00Z", durationMinutes: 50 },
    ];

    const result = calculateRiskScore({
      daysSinceRegistration: 30,
      activities,
      streak: { currentStreak: 16, longestStreak: 16, lastActiveDate: mockNow },
      now: mockNow,
    });

    expect(result.bootstrapActive).toBe(false);
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeLessThan(0.3);
    expect(result.band).toBe(RiskBand.LOW);

    const ladderAction = evaluateInterventionLadder({
      score: result.score!,
      band: result.band!,
      hasSquad: true,
    });
    expect(ladderAction.shouldTrigger).toBe(false);
    expect(ladderAction.type).toBeNull();
  });

  // 3. Mid Risk Test (0.30 - 0.60)
  it("Mid risk: drop in activity triggers MID band and NUDGE / SQUAD_NUDGE", () => {
    // 2 workouts in past 7 days, 3 consecutive misses
    const activities = [
      { date: "2026-09-16T08:00:00Z", durationMinutes: 30 },
      { date: "2026-09-15T08:00:00Z", durationMinutes: 30 },
      // Previous week was active
      { date: "2026-09-12T08:00:00Z", durationMinutes: 45 },
      { date: "2026-09-10T08:00:00Z", durationMinutes: 45 },
      { date: "2026-09-08T08:00:00Z", durationMinutes: 45 },
    ];

    const result = calculateRiskScore({
      daysSinceRegistration: 30,
      activities,
      streak: { currentStreak: 0, longestStreak: 4, lastActiveDate: "2026-09-16T08:00:00Z" },
      now: mockNow,
    });

    expect(result.score!).toBeGreaterThanOrEqual(0.3);
    expect(result.score!).toBeLessThan(0.6);
    expect(result.band).toBe(RiskBand.MID);

    // Test squad nudge when squad exists
    const withSquadAction = evaluateInterventionLadder({
      score: result.score!,
      band: result.band!,
      hasSquad: true,
    });
    expect(withSquadAction.shouldTrigger).toBe(true);
    expect(withSquadAction.type).toBe(InterventionType.SQUAD_NUDGE);

    // Test individual nudge when no squad exists
    const withoutSquadAction = evaluateInterventionLadder({
      score: result.score!,
      band: result.band!,
      hasSquad: false,
    });
    expect(withoutSquadAction.shouldTrigger).toBe(true);
    expect(withoutSquadAction.type).toBe(InterventionType.NUDGE);
  });

  // 4. High Risk Test (>= 0.60)
  it("High risk: prolonged absence triggers HIGH band, goal downgrade, and mentor escalation for 3+ days", () => {
    // 0 workouts in last 7 days, 10 days inactive
    const activities = [
      { date: "2026-09-08T08:00:00Z", durationMinutes: 30 },
      { date: "2026-09-06T08:00:00Z", durationMinutes: 30 },
    ];

    const result = calculateRiskScore({
      daysSinceRegistration: 30,
      activities,
      streak: { currentStreak: 0, longestStreak: 7, lastActiveDate: "2026-09-08T08:00:00Z" },
      challengeHistory: [
        { challengeId: "c1", status: "EXPIRED", completed: false },
        { challengeId: "c2", status: "EXPIRED", completed: false },
        { challengeId: "c3", status: "EXPIRED", completed: false },
        { challengeId: "c4", status: "EXPIRED", completed: false },
      ],
      now: mockNow,
    });

    expect(result.score!).toBeGreaterThanOrEqual(0.6);
    expect(result.band).toBe(RiskBand.HIGH);
    expect(result.topReason.length).toBeGreaterThan(5);

    // Immediate HIGH risk triggers GOAL_DOWNGRADE
    const immediateAction = evaluateInterventionLadder({
      score: result.score!,
      band: result.band!,
      hasSquad: true,
      highRiskConsecutiveDays: 1,
      currentChallengeTargetMinutes: 300,
    });
    expect(immediateAction.type).toBe(InterventionType.GOAL_DOWNGRADE);
    expect(immediateAction.downgradeAction?.newTargetMinutes).toBe(100);

    // HIGH risk for 3+ days triggers MENTOR_CHECKIN
    const escalatedAction = evaluateInterventionLadder({
      score: result.score!,
      band: result.band!,
      hasSquad: true,
      highRiskConsecutiveDays: 3,
    });
    expect(escalatedAction.type).toBe(InterventionType.MENTOR_CHECKIN);
  });

  // 5. Downgrade Math Test
  it("Downgrade math: correctly reduces target = max(10, round(target / 3)) and retains original target", () => {
    // 300 min -> 100 min
    const res300 = calculateDowngradeTarget(300);
    expect(res300.targetMinutes).toBe(100);
    expect(res300.originalTargetMinutes).toBe(300);

    // 60 min -> 20 min
    const res60 = calculateDowngradeTarget(60);
    expect(res60.targetMinutes).toBe(20);
    expect(res60.originalTargetMinutes).toBe(60);

    // 20 min -> round(20/3) is 7, floor bounded by max(10, 7) = 10
    const res20 = calculateDowngradeTarget(20);
    expect(res20.targetMinutes).toBe(10);
    expect(res20.originalTargetMinutes).toBe(20);

    // 10 min -> max(10, round(10/3)) = 10
    const res10 = calculateDowngradeTarget(10);
    expect(res10.targetMinutes).toBe(10);
    expect(res10.originalTargetMinutes).toBe(10);
  });

  // 6. Edge Cases & Robustness
  it("Edge cases: handles zero activity, division by zero, all complete, and guarantees no NaN / valid 0-1 range", () => {
    // Zero activity edge case
    const zeroRes = calculateRiskScore({
      daysSinceRegistration: 14,
      activities: [],
      streak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
      challengeHistory: [],
      now: mockNow,
    });

    expect(zeroRes.score).not.toBeNull();
    expect(isNaN(zeroRes.score!)).toBe(false);
    expect(zeroRes.score!).toBeGreaterThanOrEqual(0);
    expect(zeroRes.score!).toBeLessThanOrEqual(1);

    // Extreme high activity (all completed, workouts every day)
    const heavyActivities = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(mockNow.getTime() - i * 86400000),
      durationMinutes: 120,
    }));

    const perfectRes = calculateRiskScore({
      daysSinceRegistration: 60,
      activities: heavyActivities,
      streak: { currentStreak: 30, longestStreak: 30, lastActiveDate: mockNow },
      challengeHistory: [
        { challengeId: "c1", status: "COMPLETED", completed: true, minutesLogged: 1000 },
      ],
      now: mockNow,
    });

    expect(perfectRes.score).not.toBeNull();
    expect(isNaN(perfectRes.score!)).toBe(false);
    expect(perfectRes.score!).toBeGreaterThanOrEqual(0.0);
    expect(perfectRes.score!).toBeLessThan(0.3);
    expect(perfectRes.band).toBe(RiskBand.LOW);

    // Divide by zero edge case: 0 previous minutes, 0 current minutes
    const zeroTrendRes = calculateRiskScore({
      daysSinceRegistration: 20,
      activities: [],
      streak: { currentStreak: 0, longestStreak: 0 },
      now: mockNow,
    });
    expect(isNaN(zeroTrendRes.features?.minutesTrendPercent ?? 0)).toBe(false);
    expect(zeroTrendRes.score).toBeGreaterThanOrEqual(0);
    expect(zeroTrendRes.score).toBeLessThanOrEqual(1);
  });

  // 7. Cold Start Boundary (Day 6 vs Day 7)
  it("Cold start boundary: Day 6 gives no score, Day 7 computes score", () => {
    const day6Result = calculateRiskScore({
      daysSinceRegistration: 6,
      activities: [{ date: "2026-09-18T10:00:00Z", durationMinutes: 30 }],
      streak: { currentStreak: 1, longestStreak: 1 },
      now: mockNow,
    });
    expect(day6Result.bootstrapActive).toBe(true);
    expect(day6Result.score).toBeNull();
    expect(day6Result.band).toBeNull();

    const day7Result = calculateRiskScore({
      daysSinceRegistration: 7,
      activities: [{ date: "2026-09-18T10:00:00Z", durationMinutes: 30 }],
      streak: { currentStreak: 1, longestStreak: 1 },
      now: mockNow,
    });
    expect(day7Result.bootstrapActive).toBe(false);
    expect(day7Result.score).not.toBeNull();
    expect(day7Result.band).not.toBeNull();
  });

  // 8. Downgrade Edge Targets: max(10, Math.round(target / 3))
  it("Downgrade targets: strictly bounded by max(10, Math.round(target / 3))", () => {
    // 0 min -> 10 min
    expect(calculateDowngradeTarget(0).targetMinutes).toBe(10);
    // 5 min -> 10 min
    expect(calculateDowngradeTarget(5).targetMinutes).toBe(10);
    // 15 min -> max(10, 5) = 10 min
    expect(calculateDowngradeTarget(15).targetMinutes).toBe(10);
    // 29 min -> round(29/3) = 10 min
    expect(calculateDowngradeTarget(29).targetMinutes).toBe(10);
    // 45 min -> round(45/3) = 15 min
    expect(calculateDowngradeTarget(45).targetMinutes).toBe(15);
    // 90 min -> round(90/3) = 30 min
    expect(calculateDowngradeTarget(90).targetMinutes).toBe(30);
  });

  // 9. Band Allocation & Ladder Evaluation
  it("Band allocation thresholds: LOW < 0.30, MID 0.30 - 0.59, HIGH >= 0.60", () => {
    // Score 0.29 -> LOW
    const lowLadder = evaluateInterventionLadder({
      score: 0.29,
      band: RiskBand.LOW,
      hasSquad: true,
    });
    expect(lowLadder.shouldTrigger).toBe(false);

    // Score 0.30 -> MID
    const midLadder = evaluateInterventionLadder({
      score: 0.30,
      band: RiskBand.MID,
      hasSquad: true,
    });
    expect(midLadder.shouldTrigger).toBe(true);
    expect(midLadder.type).toBe(InterventionType.SQUAD_NUDGE);

    // Score 0.60 -> HIGH
    const highLadder = evaluateInterventionLadder({
      score: 0.60,
      band: RiskBand.HIGH,
      hasSquad: true,
    });
    expect(highLadder.shouldTrigger).toBe(true);
    expect(highLadder.type).toBe(InterventionType.GOAL_DOWNGRADE);
  });
});

