import { RiskBand, InterventionType } from "@prisma/client";

export interface LadderEvaluationInput {
  score: number;
  band: RiskBand;
  hasSquad: boolean;
  highRiskConsecutiveDays?: number; // Days student has continuously stayed in HIGH risk
  currentChallengeTargetMinutes?: number | null;
}

export interface LadderAction {
  shouldTrigger: boolean;
  type: InterventionType | null;
  message: string;
  downgradeAction?: {
    newTargetMinutes: number;
    originalTargetMinutes: number;
  };
}

/**
 * Calculates the downgraded challenge target for high-risk students.
 * Formula: max(10, Math.round(target / 3)), keeping the original target.
 */
export function calculateDowngradeTarget(currentTargetMinutes: number): {
  targetMinutes: number;
  originalTargetMinutes: number;
} {
  const newTarget = Math.max(10, Math.round(currentTargetMinutes / 3));
  return {
    targetMinutes: newTarget,
    originalTargetMinutes: currentTargetMinutes,
  };
}

/**
 * FitForge Intervention Ladder (Rule-Based Progressive Interventions)
 * - MID: NUDGE (or SQUAD_NUDGE if squad exists)
 * - HIGH: GOAL_DOWNGRADE (new target = max(10, target / 3), keep originalTargetMinutes)
 * - HIGH for 3+ days: MENTOR_CHECKIN
 */
export function evaluateInterventionLadder(
  input: LadderEvaluationInput
): LadderAction {
  const {
    band,
    hasSquad,
    highRiskConsecutiveDays = 0,
    currentChallengeTargetMinutes,
  } = input;

  // 1. Critical Escalation: HIGH risk for 3+ days triggers human mentor intervention
  if (band === RiskBand.HIGH && highRiskConsecutiveDays >= 3) {
    return {
      shouldTrigger: true,
      type: InterventionType.MENTOR_CHECKIN,
      message:
        "High dropout risk persistent for 3+ days. Campus fitness coordinator notified for 1-on-1 mentor check-in.",
    };
  }

  // 2. High Risk Immediate Action: Downgrade goal to lower cognitive barrier
  if (band === RiskBand.HIGH) {
    let downgradeAction: { newTargetMinutes: number; originalTargetMinutes: number } | undefined;

    if (currentChallengeTargetMinutes && currentChallengeTargetMinutes > 10) {
      const calculation = calculateDowngradeTarget(currentChallengeTargetMinutes);
      downgradeAction = {
        newTargetMinutes: calculation.targetMinutes,
        originalTargetMinutes: calculation.originalTargetMinutes,
      };
    }

    return {
      shouldTrigger: true,
      type: InterventionType.GOAL_DOWNGRADE,
      message: downgradeAction
        ? `Target volume downgraded from ${downgradeAction.originalTargetMinutes}m to ${downgradeAction.newTargetMinutes}m to prevent dropout and rebuild workout consistency.`
        : "Goal requirement eased to reduce friction and encourage workout resumption.",
      downgradeAction,
    };
  }

  // 3. Moderate Risk: Send peer or automated nudge
  if (band === RiskBand.MID) {
    if (hasSquad) {
      return {
        shouldTrigger: true,
        type: InterventionType.SQUAD_NUDGE,
        message:
          "Your squad noticed you missed recent workouts! A peer motivation nudge was sent to your squad channel.",
      };
    }

    return {
      shouldTrigger: true,
      type: InterventionType.NUDGE,
      message:
        "Gentle reminder: You haven't checked in for campus fitness recently. A quick 15-minute walk or workout counts!",
    };
  }

  // 4. Low Risk: On track
  return {
    shouldTrigger: false,
    type: null,
    message: "Student is engaged and on track. No intervention required.",
  };
}
