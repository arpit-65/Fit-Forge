import { Point2D, calculateAngle, calculateDistance, calculateVerticalAngle, AngleSmoother } from "./angles";

export type ExerciseType = "squat" | "pushup" | "lunge" | "jumping_jack" | "plank";

export interface PoseLandmarks {
  [index: number]: Point2D;
}

// MediaPipe 33 landmark index constants
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

export interface FormFeedback {
  type: "success" | "warning" | "error" | "info";
  message: string;
  voiceCue?: string;
  metric?: string;
  score: number; // 0–100 form accuracy on this frame
}

export interface WorkoutState {
  exercise: ExerciseType;
  repCount: number;
  goodReps: number;
  currentPhase: "ready" | "down" | "inflection" | "up" | "hold";
  currentAngle: number;
  currentScore: number;
  activeFeedback: FormFeedback;
  faultHistory: string[];
  durationSeconds: number;
}

export class ExerciseAnalyzer {
  private exercise: ExerciseType;
  private repCount = 0;
  private goodReps = 0;
  private phase: "ready" | "down" | "inflection" | "up" | "hold" = "ready";
  private reachedBottom = false;
  private hadFaultInRep = false;
  private faultHistory: string[] = [];
  private smoother = new AngleSmoother(0.6);
  private lastVoiceCueTime = 0;
  private startTime = Date.now();

  constructor(exercise: ExerciseType = "squat") {
    this.exercise = exercise;
  }

  setExercise(exercise: ExerciseType) {
    this.exercise = exercise;
    this.reset();
  }

  reset() {
    this.repCount = 0;
    this.goodReps = 0;
    this.phase = "ready";
    this.reachedBottom = false;
    this.hadFaultInRep = false;
    this.faultHistory = [];
    this.smoother.reset();
    this.startTime = Date.now();
  }

  analyze(landmarks: PoseLandmarks): WorkoutState {
    let feedback: FormFeedback;
    let primaryAngle = 180;

    switch (this.exercise) {
      case "squat":
        ({ feedback, primaryAngle } = this.analyzeSquat(landmarks));
        break;
      case "pushup":
        ({ feedback, primaryAngle } = this.analyzePushup(landmarks));
        break;
      case "plank":
        ({ feedback, primaryAngle } = this.analyzePlank(landmarks));
        break;
      case "jumping_jack":
        ({ feedback, primaryAngle } = this.analyzeJumpingJack(landmarks));
        break;
      default:
        feedback = {
          type: "info",
          message: "Ready. Start exercise motion.",
          score: 100,
        };
    }

    const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);

    return {
      exercise: this.exercise,
      repCount: this.repCount,
      goodReps: this.goodReps,
      currentPhase: this.phase,
      currentAngle: primaryAngle,
      currentScore: feedback.score,
      activeFeedback: feedback,
      faultHistory: Array.from(new Set(this.faultHistory)),
      durationSeconds,
    };
  }

  /**
   * Squat Analysis:
   * Knee Angle (Hip -> Knee -> Ankle), Torso Angle, Knee Valgus Check
   */
  private analyzeSquat(landmarks: PoseLandmarks): { feedback: FormFeedback; primaryAngle: number } {
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];

    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    if (!leftHip || !leftKnee || !leftAnkle) {
      return {
        feedback: {
          type: "info",
          message: "Step back so your full body is visible in camera",
          score: 100,
        },
        primaryAngle: 180,
      };
    }

    // Measure side knee angle with fallback
    const rawKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const kneeAngle = this.smoother.update(rawKneeAngle);

    // Measure torso lean relative to vertical (Shoulder -> Hip)
    const torsoLean = leftShoulder ? calculateVerticalAngle(leftShoulder, leftHip) : 15;

    // Check knee cave / valgus if both knees & ankles visible
    let kneeCaveDetected = false;
    if (rightKnee && rightAnkle) {
      const kneeDist = Math.abs(leftKnee.x - rightKnee.x);
      const ankleDist = Math.abs(leftAnkle.x - rightAnkle.x);
      if (ankleDist > 0.15 && kneeDist < ankleDist * 0.72) {
        kneeCaveDetected = true;
      }
    }

    let feedback: FormFeedback = {
      type: "info",
      message: "Stand upright to begin",
      score: 100,
    };

    // State Machine for Squat Rep Counting & Form Checking
    if (kneeAngle > 155) {
      // Standing upright
      if (this.phase === "up") {
        this.repCount += 1;
        if (!this.hadFaultInRep && this.reachedBottom) {
          this.goodReps += 1;
          feedback = {
            type: "success",
            message: `Rep ${this.repCount} complete! Perfect depth and form.`,
            voiceCue: `${this.repCount}! Perfect.`,
            score: 100,
          };
        } else if (!this.reachedBottom) {
          feedback = {
            type: "warning",
            message: `Rep ${this.repCount} counted, but depth was too shallow.`,
            voiceCue: "Squat deeper next rep",
            score: 70,
          };
        } else {
          feedback = {
            type: "warning",
            message: `Rep ${this.repCount} completed with form warnings.`,
            voiceCue: `${this.repCount}`,
            score: 75,
          };
        }
        this.phase = "ready";
        this.reachedBottom = false;
        this.hadFaultInRep = false;
      } else {
        this.phase = "ready";
        feedback = {
          type: "info",
          message: "Ready. Begin squat descent.",
          score: 100,
        };
      }
    } else if (kneeAngle <= 155 && kneeAngle > 105) {
      // Moving in intermediate range
      if (this.phase === "ready" || this.phase === "down") {
        this.phase = "down";
        feedback = {
          type: "info",
          message: "Squatting down... keep chest proud",
          score: 95,
        };
      } else if (this.phase === "inflection" || this.phase === "up") {
        this.phase = "up";
        feedback = {
          type: "info",
          message: "Driving up through heels...",
          score: 95,
        };
      }
    } else if (kneeAngle <= 105) {
      // In bottom depth zone
      this.phase = "inflection";
      if (kneeAngle <= 95) {
        this.reachedBottom = true;
        feedback = {
          type: "success",
          message: "Great depth! Drive back up.",
          voiceCue: "Good depth",
          score: 98,
        };
      } else {
        feedback = {
          type: "warning",
          message: "Go slightly deeper to reach parallel (90°)",
          voiceCue: "Go deeper",
          score: 80,
        };
      }
    }

    // Biomechanical Fault Overrides:
    if (kneeCaveDetected && kneeAngle < 140) {
      this.hadFaultInRep = true;
      this.faultHistory.push("Knee cave (valgus) on squat");
      feedback = {
        type: "error",
        message: "⚠️ Knees caving in! Push your knees outward over toes.",
        voiceCue: "Push knees out",
        score: 60,
      };
    } else if (torsoLean > 45 && kneeAngle < 140) {
      this.hadFaultInRep = true;
      this.faultHistory.push("Excessive forward torso lean");
      feedback = {
        type: "warning",
        message: "⚠️ Chest collapsing! Keep torso upright & back flat.",
        voiceCue: "Chest up",
        score: 70,
      };
    }

    return { feedback, primaryAngle: kneeAngle };
  }

  /**
   * Pushup Analysis:
   * Elbow Angle (Shoulder -> Elbow -> Wrist), Spine/Plank Line (Shoulder -> Hip -> Ankle)
   */
  private analyzePushup(landmarks: PoseLandmarks): { feedback: FormFeedback; primaryAngle: number } {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];

    if (!leftShoulder || !leftElbow || !leftWrist) {
      return {
        feedback: {
          type: "info",
          message: "Ensure upper body and arms are visible in camera",
          score: 100,
        },
        primaryAngle: 180,
      };
    }

    const rawElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const elbowAngle = this.smoother.update(rawElbowAngle);

    // Core alignment: Shoulder -> Hip -> Ankle (ideal is 165°–180° straight plank)
    let bodyAngle = 175;
    if (leftHip && leftAnkle) {
      bodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    }

    let feedback: FormFeedback = {
      type: "info",
      message: "Assume plank position to start",
      score: 100,
    };

    if (elbowAngle > 150) {
      // Top position
      if (this.phase === "up") {
        this.repCount += 1;
        if (!this.hadFaultInRep && this.reachedBottom) {
          this.goodReps += 1;
          feedback = {
            type: "success",
            message: `Pushup ${this.repCount} complete! Solid form.`,
            voiceCue: `${this.repCount}! Good.`,
            score: 100,
          };
        } else {
          feedback = {
            type: "warning",
            message: `Pushup ${this.repCount} counted. Lower chest more for full range.`,
            voiceCue: "Lower chest more",
            score: 75,
          };
        }
        this.phase = "ready";
        this.reachedBottom = false;
        this.hadFaultInRep = false;
      } else {
        this.phase = "ready";
      }
    } else if (elbowAngle <= 150 && elbowAngle > 105) {
      this.phase = "down";
      feedback = {
        type: "info",
        message: "Lowering chest...",
        score: 95,
      };
    } else if (elbowAngle <= 105) {
      this.phase = "inflection";
      if (elbowAngle <= 95) {
        this.reachedBottom = true;
        feedback = {
          type: "success",
          message: "Full depth reached! Press the floor away.",
          voiceCue: "Press up",
          score: 98,
        };
      }
    }

    // Fault check: Sagging hips
    if (bodyAngle < 155) {
      this.hadFaultInRep = true;
      this.faultHistory.push("Hips sagging on pushup");
      feedback = {
        type: "error",
        message: "⚠️ Hips sagging! Engage glutes and core to keep a straight line.",
        voiceCue: "Hips up! Tighten core",
        score: 65,
      };
    } else if (bodyAngle > 195) {
      this.hadFaultInRep = true;
      this.faultHistory.push("Hips piked on pushup");
      feedback = {
        type: "warning",
        message: "⚠️ Hips piked too high! Flatten your back into a plank.",
        voiceCue: "Lower hips",
        score: 70,
      };
    }

    return { feedback, primaryAngle: elbowAngle };
  }

  /**
   * Plank Hold Analysis:
   * Verifies straight spine line and counts hold duration
   */
  private analyzePlank(landmarks: PoseLandmarks): { feedback: FormFeedback; primaryAngle: number } {
    const shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER] || landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const hip = landmarks[POSE_LANDMARKS.LEFT_HIP] || landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const ankle = landmarks[POSE_LANDMARKS.LEFT_ANKLE] || landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    if (!shoulder || !hip || !ankle) {
      return {
        feedback: {
          type: "info",
          message: "Get into side or front plank view",
          score: 100,
        },
        primaryAngle: 180,
      };
    }

    const plankAngle = this.smoother.update(calculateAngle(shoulder, hip, ankle));

    if (plankAngle >= 160 && plankAngle <= 185) {
      return {
        feedback: {
          type: "success",
          message: "✅ Clean plank line! Keep breathing and maintain tension.",
          score: 100,
        },
        primaryAngle: plankAngle,
      };
    } else if (plankAngle < 160) {
      this.faultHistory.push("Sagging hips during plank hold");
      return {
        feedback: {
          type: "error",
          message: "⚠️ Hips sagging! Lift your pelvis to protect your lower back.",
          voiceCue: "Lift your hips",
          score: 65,
        },
        primaryAngle: plankAngle,
      };
    } else {
      this.faultHistory.push("Piked hips during plank hold");
      return {
        feedback: {
          type: "warning",
          message: "⚠️ Hips too high! Bring body parallel to the floor.",
          voiceCue: "Lower hips",
          score: 75,
        },
        primaryAngle: plankAngle,
      };
    }
  }

  /**
   * Jumping Jacks Analysis:
   * Arm elevation angle and leg extension
   */
  private analyzeJumpingJack(landmarks: PoseLandmarks): { feedback: FormFeedback; primaryAngle: number } {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    if (!leftShoulder || !leftWrist || !leftAnkle || !rightAnkle) {
      return {
        feedback: {
          type: "info",
          message: "Full body must be visible to track jumping jacks",
          score: 100,
        },
        primaryAngle: 0,
      };
    }

    const armAngle = calculateVerticalAngle(leftWrist, leftShoulder);
    const ankleDistance = calculateDistance(leftAnkle, rightAnkle);

    if (armAngle > 130 && ankleDistance > 0.25) {
      // Arms up, legs spread
      if (this.phase === "ready" || this.phase === "down") {
        this.phase = "up";
      }
    } else if (armAngle < 40 && ankleDistance < 0.18) {
      // Arms down, feet together
      if (this.phase === "up") {
        this.repCount += 1;
        this.goodReps += 1;
        this.phase = "ready";
        return {
          feedback: {
            type: "success",
            message: `Jack ${this.repCount} complete! Great rhythm.`,
            voiceCue: `${this.repCount}`,
            score: 100,
          },
          primaryAngle: armAngle,
        };
      }
    }

    return {
      feedback: {
        type: "info",
        message: "Jump out arms overhead, then return feet together",
        score: 95,
      },
      primaryAngle: armAngle,
    };
  }
}
