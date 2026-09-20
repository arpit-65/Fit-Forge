import { RiskBand } from "@prisma/client";

export interface ActivityInput {
  date: Date | string;
  durationMinutes: number;
}

export interface ChallengeHistoryInput {
  challengeId: string;
  status: string; // "ACTIVE" | "COMPLETED" | "DOWNGRADED" | "EXPIRED"
  completed: boolean;
  minutesLogged?: number;
}

export interface StreakInput {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date | string | null;
}

export interface RiskEngineInput {
  daysSinceRegistration: number;
  activities: ActivityInput[];
  streak: StreakInput;
  challengeHistory?: ChallengeHistoryInput[];
  now?: Date;
}

export interface RiskEngineOutput {
  score: number | null;
  band: RiskBand | null;
  topReason: string;
  bootstrapActive: boolean;
  features?: {
    completionRateLast7Days: number;
    completionRatePrev7Days: number;
    consecutiveMisses: number;
    daysSinceLastActivity: number;
    streakBroken: boolean;
    minutesTrendPercent: number;
    challengeMissCount: number;
  };
}

/**
 * FitForge Explainable Rule-Based Dropout Risk Engine.
 * Implements SIH PS 26196 dropout prevention logic without black-box ML/LLMs.
 */
export function calculateRiskScore(input: RiskEngineInput): RiskEngineOutput {
  const { daysSinceRegistration, activities, streak, challengeHistory = [] } = input;
  const now = input.now ? new Date(input.now) : new Date();

  // 1. Cold Start Gate: If student is enrolled under 7 days, activate bootstrap mode
  if (daysSinceRegistration < 7) {
    return {
      score: null,
      band: null,
      topReason: `Cold start active — student has been enrolled for ${daysSinceRegistration} days (requires 7 days for risk baseline)`,
      bootstrapActive: true,
    };
  }

  // 2. Feature Extraction
  const MS_PER_DAY = 86400000;

  // Split activities into Last 7 Days (0–6 days ago) and Previous 7 Days (7–13 days ago)
  let minutesLast7Days = 0;
  let activeDaysLast7 = 0;
  let minutesPrev7Days = 0;
  let activeDaysPrev7 = 0;

  const daysWithActivityLast7 = new Set<number>();
  const daysWithActivityPrev7 = new Set<number>();

  let latestActivityDate: Date | null = null;

  for (const act of activities) {
    const actDate = new Date(act.date);
    const diffDays = (now.getTime() - actDate.getTime()) / MS_PER_DAY;

    if (diffDays >= 0 && diffDays < 14) {
      if (!latestActivityDate || actDate > latestActivityDate) {
        latestActivityDate = actDate;
      }

      const dayBucket = Math.floor(diffDays);

      if (diffDays < 7) {
        minutesLast7Days += act.durationMinutes;
        daysWithActivityLast7.add(dayBucket);
      } else {
        minutesPrev7Days += act.durationMinutes;
        daysWithActivityPrev7.add(dayBucket);
      }
    }
  }

  activeDaysLast7 = daysWithActivityLast7.size;
  activeDaysPrev7 = daysWithActivityPrev7.size;

  // Feature 1: Completion rates (based on recommended 4 sessions/week target)
  const completionRateLast7 = Math.min(1, activeDaysLast7 / 4);
  const completionRatePrev7 = Math.min(1, activeDaysPrev7 / 4);

  // Feature 2: Days since last activity
  let daysSinceLastActivity = 14;
  if (latestActivityDate) {
    daysSinceLastActivity = Math.max(
      0,
      Math.floor((now.getTime() - latestActivityDate.getTime()) / MS_PER_DAY)
    );
  } else if (streak.lastActiveDate) {
    daysSinceLastActivity = Math.max(
      0,
      Math.floor((now.getTime() - new Date(streak.lastActiveDate).getTime()) / MS_PER_DAY)
    );
  }

  // Feature 3: Consecutive misses (days without activity counting backwards from today)
  const consecutiveMisses = daysSinceLastActivity;

  // Feature 4: Streak Break
  const streakBroken = streak.currentStreak === 0 && streak.longestStreak >= 3;

  // Feature 5: Trend in active minutes (drop percentage)
  let minutesTrendDrop = 0;
  let minutesTrendPercent = 0;
  if (minutesPrev7Days > 0) {
    minutesTrendPercent = Math.round(
      ((minutesLast7Days - minutesPrev7Days) / minutesPrev7Days) * 100
    );
    if (minutesLast7Days < minutesPrev7Days) {
      minutesTrendDrop = (minutesPrev7Days - minutesLast7Days) / minutesPrev7Days;
    }
  } else if (minutesLast7Days === 0) {
    minutesTrendDrop = 1.0;
    minutesTrendPercent = -100;
  }

  // Feature 6: Challenge History misses
  const challengeMissCount = challengeHistory.filter(
    (c) => !c.completed || c.status === "EXPIRED"
  ).length;

  // 3. Transparent Weighted Risk Scoring (0.0 to 1.0)
  // Weights reflect early indicators of dropout in college fitness:
  // - Inactivity / Consecutive misses: 35%
  // - Drop in workout frequency vs prior week: 25%
  // - Current weekly completion deficit: 20%
  // - Streak break penalty: 10%
  // - Challenge failures: 10%

  let rawScore = 0;

  // Component A: Inactivity penalty (0 to 0.35)
  // Up to 7 days of inactivity scales linearly
  const inactivityComponent = Math.min(0.35, (consecutiveMisses / 7) * 0.35);

  // Component B: Decline trend component (0 to 0.25)
  const declineComponent = minutesTrendDrop * 0.25;

  // Component C: Current week deficit (0 to 0.20)
  const deficitComponent = (1 - completionRateLast7) * 0.20;

  // Component D: Broken streak penalty (0 or 0.10)
  const streakComponent = streakBroken ? 0.10 : 0;

  // Component E: Challenge miss component (0 to 0.10)
  const challengeComponent = Math.min(0.10, challengeMissCount * 0.025);

  rawScore =
    (isNaN(inactivityComponent) ? 0 : inactivityComponent) +
    (isNaN(declineComponent) ? 0 : declineComponent) +
    (isNaN(deficitComponent) ? 0 : deficitComponent) +
    (isNaN(streakComponent) ? 0 : streakComponent) +
    (isNaN(challengeComponent) ? 0 : challengeComponent);

  if (isNaN(rawScore) || !isFinite(rawScore)) {
    rawScore = 0.05;
  }

  // Normalization & Clamping strictly between 0.0 and 1.0 (no NaN, no overflow)
  let score = Math.max(0.0, Math.min(1.0, rawScore));
  score = Math.round(score * 100) / 100; // 2 decimal precision

  // 4. Band Allocation
  // LOW < 0.30, MID 0.30 - 0.60, HIGH >= 0.60
  let band: RiskBand = RiskBand.LOW;
  if (score >= 0.60) {
    band = RiskBand.HIGH;
  } else if (score >= 0.30) {
    band = RiskBand.MID;
  }

  // 5. Plain-Words Top Reason (Strongest Driver)
  let topReason = "Consistent daily workouts and strong squad engagement";

  if (consecutiveMisses >= 7) {
    topReason = `Zero workout activity logged in the past ${consecutiveMisses} days`;
  } else if (challengeMissCount >= 4) {
    topReason = `Missed ${challengeMissCount} consecutive challenges`;
  } else if (minutesTrendDrop >= 0.5) {
    topReason = `Workout volume dropped by ${Math.abs(minutesTrendPercent)}% compared to the previous week`;
  } else if (consecutiveMisses >= 3) {
    topReason = `Missed ${consecutiveMisses} consecutive days of scheduled workouts`;
  } else if (streakBroken) {
    topReason = `Active streak of ${streak.longestStreak} days broken with no recent check-in`;
  } else if (completionRateLast7 < 0.5) {
    topReason = "Weekly session completion rate fell below 50% target";
  }

  return {
    score,
    band,
    topReason,
    bootstrapActive: false,
    features: {
      completionRateLast7Days: completionRateLast7,
      completionRatePrev7Days: completionRatePrev7,
      consecutiveMisses,
      daysSinceLastActivity,
      streakBroken,
      minutesTrendPercent,
      challengeMissCount,
    },
  };
}
