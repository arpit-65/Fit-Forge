import { Point } from "./geometry";
import { CheckEvaluation, ExerciseConfig, FormCheckRule } from "./exercises/types";

export type RepPhase = "ready" | "descending" | "bottom" | "ascending";

export interface CompletedRep {
  repNumber: number;
  good: boolean;
  minAngle: number;
  durationMs: number;
  faults: string[];
  evaluations: CheckEvaluation[];
  timestamp: number;
}

export interface RepCounterState {
  phase: RepPhase;
  repCount: number;
  goodReps: number;
  currentAngle: number;
  minAngleInRep: number;
  consecutiveBelowDownFrames: number;
  activeFeedback: {
    type: "info" | "warning" | "error" | "success";
    message: string;
    cue?: string;
  };
  lastCompletedRep?: CompletedRep;
  // For hold-based exercises (like Plank)
  isHolding: boolean;
  holdSeconds: number;
}

export interface ThresholdOverrides {
  downThreshold?: number;
  upThreshold?: number;
  checkThresholds?: Record<string, number>;
}

export class RepCounter {
  private config: ExerciseConfig;
  private downThreshold: number;
  private upThreshold: number;
  private minHoldFrames: number;
  private minRepDurationMs: number;
  private checkThresholds: Record<string, number> = {};

  // Rep State
  private phase: RepPhase = "ready";
  private repCount = 0;
  private goodReps = 0;
  private consecutiveBelowFrames = 0;
  private repStartTime = 0;
  private minAngleInRep = 180;
  private bottomEvaluations: CheckEvaluation[] = [];
  private repFaults: Set<string> = new Set();
  private lastCompletedRepTime = 0;
  private lastCompletedRep?: CompletedRep;

  // Hold State (for plank)
  private isHolding = false;
  private holdTimeAccumulatorMs = 0;
  private lastFrameTime = 0;

  constructor(config: ExerciseConfig, overrides?: ThresholdOverrides) {
    this.config = config;
    this.downThreshold =
      overrides?.downThreshold ?? config.repPhases?.downThreshold ?? 100;
    this.upThreshold =
      overrides?.upThreshold ?? config.repPhases?.upThreshold ?? 160;
    this.minHoldFrames = config.repPhases?.minHoldFrames ?? 3;
    this.minRepDurationMs = config.repPhases?.minRepDurationMs ?? 600;

    // Initialize check thresholds
    config.checks.forEach((chk) => {
      this.checkThresholds[chk.id] =
        overrides?.checkThresholds?.[chk.id] ?? chk.defaultThreshold;
    });
  }

  /**
   * Update thresholds dynamically (e.g. from debug panel)
   */
  public updateThresholds(overrides: ThresholdOverrides) {
    if (overrides.downThreshold !== undefined) {
      this.downThreshold = overrides.downThreshold;
    }
    if (overrides.upThreshold !== undefined) {
      this.upThreshold = overrides.upThreshold;
    }
    if (overrides.checkThresholds) {
      Object.assign(this.checkThresholds, overrides.checkThresholds);
    }
  }

  public getThresholds(): {
    downThreshold: number;
    upThreshold: number;
    checkThresholds: Record<string, number>;
  } {
    return {
      downThreshold: this.downThreshold,
      upThreshold: this.upThreshold,
      checkThresholds: { ...this.checkThresholds },
    };
  }

  public reset() {
    this.phase = "ready";
    this.repCount = 0;
    this.goodReps = 0;
    this.consecutiveBelowFrames = 0;
    this.repStartTime = 0;
    this.minAngleInRep = 180;
    this.bottomEvaluations = [];
    this.repFaults.clear();
    this.lastCompletedRep = undefined;
    this.isHolding = false;
    this.holdTimeAccumulatorMs = 0;
    this.lastFrameTime = 0;
  }

  /**
   * Process a single video frame of pose landmarks.
   */
  public processFrame(
    landmarks: Record<number, Point>,
    timestamp: number = (typeof performance !== "undefined" ? performance.now() : Date.now())
  ): RepCounterState {
    const dt = this.lastFrameTime > 0 ? Math.max(0, timestamp - this.lastFrameTime) : 0;
    this.lastFrameTime = timestamp;

    if (this.config.category === "hold") {
      return this.processHoldFrame(landmarks, dt);
    }

    return this.processRepetitionFrame(landmarks, timestamp);
  }

  /**
   * State Machine for Repetition-Based Exercises (Squat, Pushup)
   */
  private processRepetitionFrame(
    landmarks: Record<number, Point>,
    timestamp: number
  ): RepCounterState {
    const primaryAngle =
      this.config.repPhases?.getPrimaryAngle(landmarks) ?? 180;

    let activeFeedback: RepCounterState["activeFeedback"] = {
      type: "info",
      message: "Ready. Begin movement.",
    };

    if (this.phase === "ready") {
      this.minAngleInRep = primaryAngle;

      if (primaryAngle < this.upThreshold - 10) {
        // Initiated descent
        this.phase = "descending";
        this.repStartTime = timestamp;
        this.minAngleInRep = primaryAngle;
        this.bottomEvaluations = [];
        this.repFaults.clear();
        activeFeedback = {
          type: "info",
          message: "Descending...",
        };
      }
    } else if (this.phase === "descending") {
      if (primaryAngle < this.minAngleInRep) {
        this.minAngleInRep = primaryAngle;
      }

      if (primaryAngle <= this.downThreshold) {
        this.consecutiveBelowFrames += 1;
        if (this.consecutiveBelowFrames >= this.minHoldFrames) {
          // Hysteresis met: confirmed at bottom inflection!
          this.phase = "bottom";
          activeFeedback = {
            type: "info",
            message: "Bottom reached. Drive up!",
          };

          // Run checks at bottom phase
          this.evaluateChecks(landmarks);
        }
      } else {
        this.consecutiveBelowFrames = 0;
      }

      // Check if user turned back up before reaching down threshold
      if (primaryAngle > this.minAngleInRep + 15 && this.minAngleInRep > this.downThreshold) {
        this.phase = "ascending";
        // User reversed direction without hitting full downThreshold: mark depth fault
        this.evaluateChecks(landmarks);
      }
    } else if (this.phase === "bottom") {
      if (primaryAngle < this.minAngleInRep) {
        this.minAngleInRep = primaryAngle;
      }

      // Keep checking form while at bottom
      this.evaluateChecks(landmarks);

      if (primaryAngle > this.downThreshold + 8) {
        this.phase = "ascending";
        this.consecutiveBelowFrames = 0;
        activeFeedback = {
          type: "info",
          message: "Ascending...",
        };
      }
    } else if (this.phase === "ascending") {
      if (primaryAngle >= this.upThreshold) {
        // Top lockout reached!
        const repDuration = timestamp - this.repStartTime;

        // Ensure minimum rep time to reject noise/bounces
        if (repDuration >= this.minRepDurationMs) {
          this.repCount += 1;
          const isGoodRep = this.repFaults.size === 0;

          if (isGoodRep) {
            this.goodReps += 1;
            activeFeedback = {
              type: "success",
              message: `Rep ${this.repCount} complete! Perfect form.`,
              cue: `${this.repCount}! Perfect.`,
            };
          } else {
            const firstFault = Array.from(this.repFaults)[0];
            activeFeedback = {
              type: "warning",
              message: `Rep ${this.repCount} complete with form warnings.`,
              cue: firstFault || `${this.repCount}`,
            };
          }

          const completed: CompletedRep = {
            repNumber: this.repCount,
            good: isGoodRep,
            minAngle: this.minAngleInRep,
            durationMs: Math.round(repDuration),
            faults: Array.from(this.repFaults),
            evaluations: [...this.bottomEvaluations],
            timestamp,
          };

          this.lastCompletedRep = completed;
          this.lastCompletedRepTime = timestamp;
        }

        // Reset for next repetition
        this.phase = "ready";
        this.consecutiveBelowFrames = 0;
        this.minAngleInRep = 180;
        this.bottomEvaluations = [];
        this.repFaults.clear();
      }
    }

    // Reflect current fault in active feedback if warning/error occurred
    if (this.repFaults.size > 0 && this.phase !== "ready") {
      const latestFault = Array.from(this.repFaults)[this.repFaults.size - 1];
      activeFeedback = {
        type: "warning",
        message: latestFault,
        cue: latestFault,
      };
    }

    return {
      phase: this.phase,
      repCount: this.repCount,
      goodReps: this.goodReps,
      currentAngle: primaryAngle,
      minAngleInRep: this.minAngleInRep,
      consecutiveBelowDownFrames: this.consecutiveBelowFrames,
      activeFeedback,
      lastCompletedRep: this.lastCompletedRep,
      isHolding: false,
      holdSeconds: 0,
    };
  }

  /**
   * Run all configured check rules for this exercise.
   */
  private evaluateChecks(landmarks: Record<number, Point>) {
    this.config.checks.forEach((rule) => {
      const threshold = this.checkThresholds[rule.id] ?? rule.defaultThreshold;
      const result = rule.evaluate(landmarks, threshold);

      this.bottomEvaluations.push(result);

      if (!result.passed) {
        if (result.cue) {
          this.repFaults.add(result.cue);
        } else if (result.details) {
          this.repFaults.add(result.details);
        }
      }
    });
  }

  /**
   * State Machine for Hold-Based Exercises (Plank)
   */
  private processHoldFrame(
    landmarks: Record<number, Point>,
    dtMs: number
  ): RepCounterState {
    let allChecksPassed = true;
    let failedCue: string | undefined;

    this.config.checks.forEach((rule) => {
      const threshold = this.checkThresholds[rule.id] ?? rule.defaultThreshold;
      const result = rule.evaluate(landmarks, threshold);
      if (!result.passed) {
        allChecksPassed = false;
        failedCue = result.cue || rule.cue;
      }
    });

    if (allChecksPassed) {
      this.isHolding = true;
      this.holdTimeAccumulatorMs += dtMs;
    } else {
      this.isHolding = false;
    }

    const holdSeconds = Math.round((this.holdTimeAccumulatorMs / 1000) * 10) / 10;

    const activeFeedback: RepCounterState["activeFeedback"] = allChecksPassed
      ? {
          type: "success",
          message: `Holding strong! (${holdSeconds}s)`,
          cue: "Hold steady",
        }
      : {
          type: "warning",
          message: failedCue || "Form break: hold timer paused.",
          cue: failedCue,
        };

    return {
      phase: allChecksPassed ? "bottom" : "ready",
      repCount: Math.floor(holdSeconds),
      goodReps: Math.floor(holdSeconds),
      currentAngle: 180,
      minAngleInRep: 180,
      consecutiveBelowDownFrames: allChecksPassed ? 3 : 0,
      activeFeedback,
      isHolding: this.isHolding,
      holdSeconds,
    };
  }
}
