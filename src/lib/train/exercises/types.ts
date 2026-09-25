import { Point } from "../geometry";

export type CameraView = "side" | "front" | "any";

export type SeverityLevel = "info" | "warning" | "error";

export interface CheckEvaluation {
  passed: boolean;
  metricValue: number;
  threshold: number;
  cue?: string;
  details?: string;
}

export interface FormCheckRule {
  id: string;
  name: string;
  metric: string;
  severity: SeverityLevel;
  cue: string;
  defaultThreshold: number;
  description: string;
  /**
   * Pure evaluation function.
   * @param landmarks Map of MediaPipe landmark index to Point
   * @param currentThreshold The currently configured threshold (can be dynamically tuned)
   */
  evaluate: (
    landmarks: Record<number, Point>,
    currentThreshold: number
  ) => CheckEvaluation;
}

export interface RepPhaseConfig {
  primaryJoint: string;
  downThreshold: number;
  upThreshold: number;
  minHoldFrames?: number; // Minimum consecutive frames below downThreshold for bottom inflection (default: 3)
  minRepDurationMs?: number; // Minimum time between reps to avoid bounce/false counts (default: 600ms)
  /**
   * Pure function to extract primary joint angle from landmarks.
   */
  getPrimaryAngle: (landmarks: Record<number, Point>) => number;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  category: "reps" | "hold";
  cameraView: CameraView;
  keyJoints: number[];
  repPhases?: RepPhaseConfig;
  checks: FormCheckRule[];
}
