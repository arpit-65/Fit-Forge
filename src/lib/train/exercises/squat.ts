import { angle, distance, verticalAngle } from "../geometry";
import { ExerciseConfig } from "./types";

export const squatConfig: ExerciseConfig = {
  id: "squat",
  name: "Squats",
  category: "reps",
  cameraView: "side",
  keyJoints: [11, 12, 23, 24, 25, 26, 27, 28],
  repPhases: {
    primaryJoint: "Knee (Hip-Knee-Ankle)",
    downThreshold: 100, // Below 100° enters bottom phase
    upThreshold: 160,   // Above 160° completes rep standing upright
    minHoldFrames: 3,   // 3 consecutive frames below downThreshold
    minRepDurationMs: 600,
    getPrimaryAngle: (landmarks) => {
      // Prioritize left side, fallback to right side
      const leftHip = landmarks[23];
      const leftKnee = landmarks[25];
      const leftAnkle = landmarks[27];

      if (leftHip && leftKnee && leftAnkle) {
        return angle(leftHip, leftKnee, leftAnkle);
      }

      const rightHip = landmarks[24];
      const rightKnee = landmarks[26];
      const rightAnkle = landmarks[28];
      return angle(rightHip, rightKnee, rightAnkle);
    },
  },
  checks: [
    {
      id: "depth",
      name: "Squat Depth",
      metric: "knee_angle_deg",
      severity: "warning",
      cue: "Go deeper",
      defaultThreshold: 110, // Bottom angle > 110° means too shallow
      description: "Ensure hips sink low enough so knee angle reaches parallel or deeper (<= 110°).",
      evaluate: (landmarks, threshold) => {
        const hip = landmarks[23] || landmarks[24];
        const knee = landmarks[25] || landmarks[26];
        const ankle = landmarks[27] || landmarks[28];
        const kneeAngle = angle(hip, knee, ankle);

        if (kneeAngle === 0) {
          return { passed: true, metricValue: 0, threshold };
        }

        // Passed if knee angle reaches at least threshold (<= threshold degrees)
        const passed = kneeAngle <= threshold;
        return {
          passed,
          metricValue: kneeAngle,
          threshold,
          cue: passed ? undefined : "Go deeper",
          details: `Knee inflection ${kneeAngle}° (target <= ${threshold}°)`,
        };
      },
    },
    {
      id: "torso_lean",
      name: "Torso Lean",
      metric: "torso_vertical_angle_deg",
      severity: "warning",
      cue: "Chest up",
      defaultThreshold: 55, // Lean > 55° relative to vertical means excessive collapse
      description: "Keep torso upright; forward lean relative to vertical should not exceed 55°.",
      evaluate: (landmarks, threshold) => {
        const shoulder = landmarks[11] || landmarks[12];
        const hip = landmarks[23] || landmarks[24];
        const lean = verticalAngle(shoulder, hip);

        if (!shoulder || !hip) {
          return { passed: true, metricValue: 0, threshold };
        }

        const passed = lean <= threshold;
        return {
          passed,
          metricValue: lean,
          threshold,
          cue: passed ? undefined : "Chest up",
          details: `Torso lean ${lean}° (max allowed ${threshold}°)`,
        };
      },
    },
    {
      id: "knee_cave",
      name: "Knee Cave (Valgus)",
      metric: "knee_to_ankle_ratio",
      severity: "error",
      cue: "Knees out",
      defaultThreshold: 0.75, // Knee distance / ankle distance < 0.75 at bottom
      description: "Prevent knees from collapsing inward during descent and ascent.",
      evaluate: (landmarks, threshold) => {
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
          return { passed: true, metricValue: 1.0, threshold };
        }

        const kneeDist = distance(leftKnee, rightKnee);
        const ankleDist = distance(leftAnkle, rightAnkle);

        if (ankleDist < 0.05) {
          return { passed: true, metricValue: 1.0, threshold };
        }

        const ratio = Math.round((kneeDist / ankleDist) * 100) / 100;
        const passed = ratio >= threshold;

        return {
          passed,
          metricValue: ratio,
          threshold,
          cue: passed ? undefined : "Knees out",
          details: `Knee/ankle separation ratio ${ratio} (minimum ${threshold})`,
        };
      },
    },
  ],
};
