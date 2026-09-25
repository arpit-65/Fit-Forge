import { angle, pointToLineOffset } from "../geometry";
import { ExerciseConfig } from "./types";

export const pushupConfig: ExerciseConfig = {
  id: "pushup",
  name: "Push-ups",
  category: "reps",
  cameraView: "side",
  keyJoints: [11, 12, 13, 14, 15, 16, 23, 24, 27, 28],
  repPhases: {
    primaryJoint: "Elbow (Shoulder-Elbow-Wrist)",
    downThreshold: 95,   // Elbow angle below 95° enters bottom inflection
    upThreshold: 155,    // Elbow angle above 155° completes rep at plank lockout
    minHoldFrames: 3,
    minRepDurationMs: 600,
    getPrimaryAngle: (landmarks) => {
      // Prioritize left side, fallback to right
      const leftShoulder = landmarks[11];
      const leftElbow = landmarks[13];
      const leftWrist = landmarks[15];

      if (leftShoulder && leftElbow && leftWrist) {
        return angle(leftShoulder, leftElbow, leftWrist);
      }

      const rightShoulder = landmarks[12];
      const rightElbow = landmarks[14];
      const rightWrist = landmarks[16];
      return angle(rightShoulder, rightElbow, rightWrist);
    },
  },
  checks: [
    {
      id: "body_line",
      name: "Spine & Hip Alignment",
      metric: "body_line_angle_deg",
      severity: "error",
      cue: "Hips sagging",
      defaultThreshold: 160, // Body line angle < 160° indicates broken plank line
      description: "Maintain a straight, neutral line from shoulder through hip to ankle.",
      evaluate: (landmarks, threshold) => {
        const shoulder = landmarks[11] || landmarks[12];
        const hip = landmarks[23] || landmarks[24];
        const ankle = landmarks[27] || landmarks[28];

        if (!shoulder || !hip || !ankle) {
          return { passed: true, metricValue: 180, threshold };
        }

        const bodyAngle = angle(shoulder, hip, ankle);

        // If body line is straight enough (>= threshold, e.g. 160°), pass
        if (bodyAngle >= threshold) {
          return {
            passed: true,
            metricValue: bodyAngle,
            threshold,
            details: `Body line angle ${bodyAngle}° (solid straight plank)`,
          };
        }

        // Determine if hips are sagging or piked too high
        // Use hip position relative to the shoulder-ankle segment
        const { signedOffset } = pointToLineOffset(hip, shoulder, ankle);

        // In screen coordinates where y is down:
        // signedOffset > 0 indicates hip is lower than the line (sagging down toward floor)
        // signedOffset < 0 indicates hip is higher than the line (piked up in the air)
        const isSagging = signedOffset >= 0;
        const cue = isSagging ? "Hips sagging" : "Hips too high";

        return {
          passed: false,
          metricValue: bodyAngle,
          threshold,
          cue,
          details: `Body angle ${bodyAngle}° (${cue}, offset ${signedOffset})`,
        };
      },
    },
  ],
};
