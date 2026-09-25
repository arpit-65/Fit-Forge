import { angle, pointToLineOffset } from "../geometry";
import { ExerciseConfig } from "./types";

export const plankConfig: ExerciseConfig = {
  id: "plank",
  name: "Plank Hold",
  category: "hold",
  cameraView: "side",
  keyJoints: [11, 12, 23, 24, 27, 28],
  checks: [
    {
      id: "body_line",
      name: "Plank Body Line",
      metric: "body_line_angle_deg",
      severity: "error",
      cue: "Hips sagging",
      defaultThreshold: 165, // >= 165° required for hold timer to accumulate
      description: "Body line (shoulder-hip-ankle) must remain >= 165° for the hold timer to count.",
      evaluate: (landmarks, threshold) => {
        const shoulder = landmarks[11] || landmarks[12];
        const hip = landmarks[23] || landmarks[24];
        const ankle = landmarks[27] || landmarks[28];

        if (!shoulder || !hip || !ankle) {
          return {
            passed: false,
            metricValue: 0,
            threshold,
            cue: "Body not fully visible",
            details: "Ensure shoulders, hips, and ankles are in camera frame.",
          };
        }

        const bodyAngle = angle(shoulder, hip, ankle);

        if (bodyAngle >= threshold) {
          return {
            passed: true,
            metricValue: bodyAngle,
            threshold,
            details: `Plank line locked at ${bodyAngle}°`,
          };
        }

        const { signedOffset } = pointToLineOffset(hip, shoulder, ankle);
        const isSagging = signedOffset >= 0;
        const cue = isSagging ? "Hips sagging" : "Hips too high";

        return {
          passed: false,
          metricValue: bodyAngle,
          threshold,
          cue,
          details: `Hold paused at ${bodyAngle}° (${cue})`,
        };
      },
    },
  ],
};
