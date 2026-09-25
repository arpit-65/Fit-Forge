import { describe, it, expect } from "vitest";
import {
  angle,
  distance,
  verticalAngle,
  horizontalAngle,
  pointToLineOffset,
} from "../geometry";
import { squatConfig } from "../exercises/squat";
import { pushupConfig } from "../exercises/pushup";
import { plankConfig } from "../exercises/plank";
import { RepCounter } from "../repCounter";
import { WorkoutSessionTracker } from "../session";

// Load recorded landmark fixtures
import cleanSquatFrames from "./fixtures/clean-squat.json";
import shallowSquatFrames from "./fixtures/shallow-squat.json";
import saggingPushupFrames from "./fixtures/sagging-pushup.json";
import jitterMissingFrames from "./fixtures/jitter-missing.json";

describe("Train Geometry Engine", () => {
  it("calculates 2D angles accurately", () => {
    const a = { x: 0, y: 1 };
    const b = { x: 0, y: 0 };
    const c = { x: 1, y: 0 };
    expect(angle(a, b, c)).toBe(90);

    const straight1 = { x: -1, y: 0 };
    const straight2 = { x: 1, y: 0 };
    expect(angle(straight1, b, straight2)).toBe(180);
  });

  it("calculates 3D angles accurately", () => {
    const a = { x: 0, y: 1, z: 0 };
    const b = { x: 0, y: 0, z: 0 };
    const c = { x: 0, y: 0, z: 1 };
    expect(angle(a, b, c)).toBe(90);
  });

  it("handles zero vectors and identical points safely without throwing", () => {
    const zero = { x: 0, y: 0 };
    expect(angle(zero, zero, zero)).toBe(0);
    expect(distance(zero, zero)).toBe(0);
    expect(verticalAngle(zero, zero)).toBe(0);
    expect(horizontalAngle(zero, zero)).toBe(0);
  });

  it("handles NaN and undefined inputs safely", () => {
    const badPoint = { x: NaN, y: 1 };
    const valid = { x: 0, y: 0 };
    expect(angle(badPoint, valid, valid)).toBe(0);
    expect(distance(badPoint, valid)).toBe(0);
    expect(verticalAngle(badPoint, valid)).toBe(0);
    expect(horizontalAngle(badPoint, valid)).toBe(0);
    expect(angle(undefined, valid, null)).toBe(0);
  });

  it("calculates signed perpendicular distance to line", () => {
    const start = { x: 0, y: 0 };
    const end = { x: 10, y: 0 };

    // Point below the line (higher y in screen space) -> positive offset (sagging)
    const below = { x: 5, y: 2 };
    const resBelow = pointToLineOffset(below, start, end);
    expect(resBelow.distance).toBe(2);
    expect(resBelow.signedOffset).toBe(2);

    // Point above the line (lower y in screen space) -> negative offset (piking)
    const above = { x: 5, y: -2 };
    const resAbove = pointToLineOffset(above, start, end);
    expect(resAbove.distance).toBe(2);
    expect(resAbove.signedOffset).toBe(-2);
  });
});

describe("Data-Driven Exercise Engine & RepCounter", () => {
  it("processes clean squat fixture and counts 1 good rep", () => {
    const counter = new RepCounter(squatConfig);
    const session = new WorkoutSessionTracker("squat");

    cleanSquatFrames.forEach((frame) => {
      const state = counter.processFrame(
        frame.landmarks as any,
        frame.timestampMs
      );
      if (state.lastCompletedRep && state.lastCompletedRep.repNumber === 1) {
        session.recordRep(state.lastCompletedRep);
      }
    });

    const summary = session.getSummary(2000);
    expect(summary.totalReps).toBe(1);
    expect(summary.goodReps).toBe(1);
    expect(summary.formScore).toBe(100);
    expect(summary.topIssues.length).toBe(0);
    expect(summary.averageDepth).toBeLessThan(100); // reached deep squat
  });

  it("detects shallow squat and flags 'Go deeper' cue", () => {
    const counter = new RepCounter(squatConfig);
    const session = new WorkoutSessionTracker("squat");

    shallowSquatFrames.forEach((frame) => {
      const state = counter.processFrame(
        frame.landmarks as any,
        frame.timestampMs
      );
      if (state.lastCompletedRep) {
        session.recordRep(state.lastCompletedRep);
      }
    });

    // Run check directly at shallow frame
    const shallowBottomFrame = shallowSquatFrames[14];
    const depthCheck = squatConfig.checks.find((c) => c.id === "depth");
    const result = depthCheck?.evaluate(
      shallowBottomFrame.landmarks as any,
      depthCheck.defaultThreshold
    );

    expect(result?.passed).toBe(false);
    expect(result?.cue).toBe("Go deeper");
  });

  it("detects sagging hips in push-up fixture", () => {
    const pushupCheck = pushupConfig.checks.find((c) => c.id === "body_line");
    expect(pushupCheck).toBeDefined();

    // Check bottom frame where hips sag
    const bottomSaggingFrame = saggingPushupFrames[18];
    const evalResult = pushupCheck?.evaluate(
      bottomSaggingFrame.landmarks as any,
      pushupCheck.defaultThreshold
    );

    expect(evalResult?.passed).toBe(false);
    expect(evalResult?.cue).toBe("Hips sagging");
  });

  it("accumulates plank hold time only during good form frames", () => {
    const counter = new RepCounter(plankConfig);

    // Good plank frame: shoulder(0.2, 0.5), hip(0.5, 0.5), ankle(0.8, 0.5) -> 180°
    const goodPlankLandmarks = {
      11: { x: 0.2, y: 0.5, visibility: 0.95 },
      23: { x: 0.5, y: 0.5, visibility: 0.95 },
      27: { x: 0.8, y: 0.5, visibility: 0.95 },
    };

    // Frame 1: 0ms
    let state = counter.processFrame(goodPlankLandmarks, 0);
    expect(state.isHolding).toBe(true);

    // Frame 2: 500ms
    state = counter.processFrame(goodPlankLandmarks, 500);
    expect(state.isHolding).toBe(true);
    expect(state.holdSeconds).toBeCloseTo(0.5, 1);

    // Frame 3: 1000ms with sagging hips -> pauses timer
    const saggingPlankLandmarks = {
      11: { x: 0.2, y: 0.5, visibility: 0.95 },
      23: { x: 0.5, y: 0.7, visibility: 0.95 }, // sagging down
      27: { x: 0.8, y: 0.5, visibility: 0.95 },
    };
    state = counter.processFrame(saggingPlankLandmarks, 1000);
    expect(state.isHolding).toBe(false);
    expect(state.holdSeconds).toBeCloseTo(0.5, 1); // hold time did not advance!
  });

  it("handles jitter and missing landmarks gracefully without crashing", () => {
    const counter = new RepCounter(squatConfig);

    jitterMissingFrames.forEach((frame) => {
      expect(() => {
        counter.processFrame(frame.landmarks as any, frame.timestampMs);
      }).not.toThrow();
    });
  });

  it("aggregates session summary, scores, and top 3 issues with counts", () => {
    const session = new WorkoutSessionTracker("squat");

    // Rep 1: Good
    session.recordRep({
      repNumber: 1,
      good: true,
      minAngle: 88,
      durationMs: 1200,
      faults: [],
      evaluations: [],
      timestamp: 1000,
    });

    // Rep 2: Bad (Chest up)
    session.recordRep({
      repNumber: 2,
      good: false,
      minAngle: 92,
      durationMs: 1100,
      faults: ["Chest up"],
      evaluations: [],
      timestamp: 2500,
    });

    // Rep 3: Bad (Chest up, Knees out)
    session.recordRep({
      repNumber: 3,
      good: false,
      minAngle: 96,
      durationMs: 1300,
      faults: ["Chest up", "Knees out"],
      evaluations: [],
      timestamp: 4000,
    });

    const summary = session.getSummary(5000);
    expect(summary.totalReps).toBe(3);
    expect(summary.goodReps).toBe(1);
    expect(summary.formScore).toBe(33); // 1/3 = 33%
    expect(summary.averageDepth).toBe(92); // (88 + 92 + 96) / 3 = 92
    expect(summary.topIssues).toEqual([
      { issue: "Chest up", count: 2 },
      { issue: "Knees out", count: 1 },
    ]);
  });
});
