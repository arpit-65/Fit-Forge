import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateAngle,
  calculateAngle3D,
  calculateDistance,
  calculateVerticalAngle,
  AngleSmoother,
  OneEuroFilter,
  PointOneEuroFilter,
} from "../angles";
import { ExerciseAnalyzer, POSE_LANDMARKS, PoseLandmarks } from "../exercises";

describe("Biomechanics Trigonometry Engine", () => {
  it("calculates 90-degree right angle accurately", () => {
    const a = { x: 0, y: 1 };
    const b = { x: 0, y: 0 };
    const c = { x: 1, y: 0 };
    const angle = calculateAngle(a, b, c);
    expect(angle).toBe(90);
  });

  it("calculates 180-degree straight line accurately", () => {
    const a = { x: -1, y: 0 };
    const b = { x: 0, y: 0 };
    const c = { x: 1, y: 0 };
    const angle = calculateAngle(a, b, c);
    expect(angle).toBe(180);
  });

  it("calculates 3D angle accurately with depth z", () => {
    // 90 degree angle in 3D: vertex at (0,0,0), vector A along Y (0,1,0), vector C along Z (0,0,1)
    const a = { x: 0, y: 1, z: 0 };
    const b = { x: 0, y: 0, z: 0 };
    const c = { x: 0, y: 0, z: 1 };
    const angle = calculateAngle3D(a, b, c);
    expect(angle).toBe(90);

    // 180 straight in 3D
    const a2 = { x: 0, y: 0, z: -1 };
    const b2 = { x: 0, y: 0, z: 0 };
    const c2 = { x: 0, y: 0, z: 1 };
    expect(calculateAngle3D(a2, b2, c2)).toBe(180);
  });

  it("calculates vertical inclination angle", () => {
    const top = { x: 0, y: 1 };
    const bottom = { x: 0, y: 0 };
    const angle = calculateVerticalAngle(top, bottom);
    expect(angle).toBe(0); // perfectly vertical
  });

  it("smooths noisy angle series without drift", () => {
    const smoother = new AngleSmoother(0.5);
    expect(smoother.update(100)).toBe(100);
    expect(smoother.update(120)).toBe(110);
    expect(smoother.update(120)).toBe(115);
  });

  it("filters jitter using OneEuroFilter", () => {
    const filter = new OneEuroFilter(1.0, 0.007);
    const initial = filter.filter(100, 0);
    expect(initial).toBe(100);

    // Small jitter step at low velocity gets heavily smoothed
    const jittered = filter.filter(100.5, 33);
    expect(jittered).toBeGreaterThan(100);
    expect(jittered).toBeLessThan(100.5);

    // PointOneEuroFilter filters 2D/3D points
    const pointFilter = new PointOneEuroFilter();
    const p1 = pointFilter.filter({ x: 0.5, y: 0.5, z: 0.1 }, 0);
    expect(p1.x).toBe(0.5);
    expect(p1.y).toBe(0.5);
    expect(p1.z).toBe(0.1);
  });
});

describe("Exercise Form & Rep State Machine", () => {
  let analyzer: ExerciseAnalyzer;

  beforeEach(() => {
    analyzer = new ExerciseAnalyzer("squat");
  });

  it("counts a valid deep squat rep", () => {
    // 1. Standing upright (knee angle ~ 180°)
    const standingLandmarks: PoseLandmarks = {
      [POSE_LANDMARKS.LEFT_HIP]: { x: 0.5, y: 0.4 },
      [POSE_LANDMARKS.LEFT_KNEE]: { x: 0.5, y: 0.7 },
      [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.5, y: 1.0 },
    };
    let state = analyzer.analyze(standingLandmarks);
    expect(state.repCount).toBe(0);

    // 2. Squat down to 90 degrees (deep squat)
    const deepSquatLandmarks: PoseLandmarks = {
      [POSE_LANDMARKS.LEFT_HIP]: { x: 0.3, y: 0.7 },
      [POSE_LANDMARKS.LEFT_KNEE]: { x: 0.5, y: 0.7 },
      [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.5, y: 1.0 },
    };
    // Run multiple frames to allow smoother to settle
    for (let i = 0; i < 5; i++) {
      state = analyzer.analyze(deepSquatLandmarks);
    }
    expect(state.currentPhase).toBe("inflection");

    // 3. Drive back up to standing
    for (let i = 0; i < 5; i++) {
      state = analyzer.analyze(standingLandmarks);
    }
    expect(state.repCount).toBe(1);
    expect(state.goodReps).toBe(1);
  });

  it("detects knee cave (valgus) fault during squat", () => {
    const valgusLandmarks: PoseLandmarks = {
      [POSE_LANDMARKS.LEFT_HIP]: { x: 0.45, y: 0.7 },
      [POSE_LANDMARKS.RIGHT_HIP]: { x: 0.55, y: 0.7 },
      [POSE_LANDMARKS.LEFT_KNEE]: { x: 0.49, y: 0.7 }, // knees pinch together
      [POSE_LANDMARKS.RIGHT_KNEE]: { x: 0.51, y: 0.7 },
      [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.35, y: 1.0 }, // ankles wide
      [POSE_LANDMARKS.RIGHT_ANKLE]: { x: 0.65, y: 1.0 },
    };
    const state = analyzer.analyze(valgusLandmarks);
    expect(state.activeFeedback.type).toBe("error");
    expect(state.activeFeedback.message).toContain("Knees caving in");
  });

  it("detects sagging hips during pushups", () => {
    analyzer.setExercise("pushup");

    const saggingPushupLandmarks: PoseLandmarks = {
      [POSE_LANDMARKS.LEFT_SHOULDER]: { x: 0.2, y: 0.4 },
      [POSE_LANDMARKS.LEFT_ELBOW]: { x: 0.25, y: 0.45 },
      [POSE_LANDMARKS.LEFT_WRIST]: { x: 0.3, y: 0.5 },
      [POSE_LANDMARKS.LEFT_HIP]: { x: 0.5, y: 0.6 }, // sagging downwards
      [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.8, y: 0.4 },
    };

    const state = analyzer.analyze(saggingPushupLandmarks);
    expect(state.activeFeedback.type).toBe("error");
    expect(state.activeFeedback.message).toContain("Hips sagging");
  });
});
