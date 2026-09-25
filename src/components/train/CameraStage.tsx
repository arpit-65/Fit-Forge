"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  calculateAngle,
  calculateAngle3D,
  OneEuroFilter,
  Point2D,
  Point3D,
  PointOneEuroFilter,
} from "@/lib/biomechanics/angles";
import {
  ExerciseAnalyzer,
  ExerciseType,
  FormFeedback,
  POSE_LANDMARKS,
  PoseLandmarks,
  WorkoutState,
} from "@/lib/biomechanics/exercises";
import { drawPoseSkeleton } from "@/lib/biomechanics/humanRenderer";
import type {
  PoseLandmarker as PoseLandmarkerType,
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

type CameraStageMode = "guide" | "calibrating" | "active" | "error";

type CameraErrorKind =
  | "insecure_context"
  | "permission_denied"
  | "not_found"
  | "in_use"
  | "unknown";

interface CameraErrorInfo {
  kind: CameraErrorKind;
  title: string;
  message: string;
  remedy: string;
}

const EXERCISE_OPTIONS: Array<{
  id: ExerciseType;
  label: string;
  icon: string;
  targetJoint: string;
  sideViewNote: string;
}> = [
  {
    id: "squat",
    label: "Squats",
    icon: "🏋️",
    targetJoint: "Knee (90°)",
    sideViewNote: "Side-angle view recommended to track hip hinge and knee flexion depth.",
  },
  {
    id: "pushup",
    label: "Push-ups",
    icon: "⚡",
    targetJoint: "Elbow (90°)",
    sideViewNote: "Side profile with camera on floor to check straight plank line and chest depth.",
  },
  {
    id: "plank",
    label: "Plank Hold",
    icon: "🧘",
    targetJoint: "Spine (175°)",
    sideViewNote: "Floor side view to verify hips neither sag nor pike.",
  },
  {
    id: "jumping_jack",
    label: "Jumping Jacks",
    icon: "🏃",
    targetJoint: "Arms (140°)",
    sideViewNote: "Front-facing view to capture arm and leg abduction span.",
  },
];

export default function CameraStage() {
  // Current exercise & stage mode
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>("squat");
  const [stageMode, setStageMode] = useState<CameraStageMode>("guide");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);

  // Calibration feedback state (throttled)
  const [calibrationFeedback, setCalibrationFeedback] = useState<{
    isReady: boolean;
    hint: string;
    details: string;
    visibleJointsCount: number;
  }>({
    isReady: false,
    hint: "Position yourself in front of the camera",
    details: "Step back until your entire body is visible from head to feet.",
    visibleJointsCount: 0,
  });

  // Live workout stats throttled to ~5 Hz
  const [liveStats, setLiveStats] = useState<{
    repCount: number;
    goodReps: number;
    currentAngle: number;
    currentPhase: string;
    feedback: FormFeedback;
    fps: number;
    delegate: "GPU" | "CPU";
  }>({
    repCount: 0,
    goodReps: 0,
    currentAngle: 180,
    currentPhase: "ready",
    feedback: {
      type: "info",
      message: "Ready. Stand in frame to begin.",
      score: 100,
    },
    fps: 0,
    delegate: "GPU",
  });

  // DOM and stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // MediaPipe references
  const landmarkerRef = useRef<PoseLandmarkerType | null>(null);
  const delegateUsedRef = useRef<"GPU" | "CPU">("GPU");
  const isInitializingRef = useRef(false);

  // Biomechanics Analyzer ref
  const analyzerRef = useRef<ExerciseAnalyzer>(new ExerciseAnalyzer("squat"));

  // 1 Euro Filters for 33 landmarks
  const filtersRef = useRef<PointOneEuroFilter[]>(
    Array.from({ length: 33 }, () => new PointOneEuroFilter(1.0, 0.007))
  );

  // Loop control refs
  const animationFrameIdRef = useRef<number | null>(null);
  const rvfcHandleRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Adaptive FPS measurement refs
  const lastFrameTimestampRef = useRef<number>(0);
  const lastStateEmitTimeRef = useRef<number>(0);
  const lastRepCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(performance.now());
  const frameCounterRef = useRef<number>(0);
  const currentFpsRef = useRef<number>(0);
  const targetFrameIntervalMsRef = useRef<number>(33.3); // Target ~30 fps, adapt to 50ms (~20 fps) if weak

  // Clean up streams & models on unmount
  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      isRunningRef.current = false;
      if (rvfcHandleRef.current && videoEl && "cancelVideoFrameCallback" in videoEl) {
        (videoEl as unknown as { cancelVideoFrameCallback: (handle: number) => void }).cancelVideoFrameCallback(rvfcHandleRef.current);
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Update analyzer when exercise changes
  const handleExerciseSelect = (ex: ExerciseType) => {
    setSelectedExercise(ex);
    analyzerRef.current.setExercise(ex);
    filtersRef.current.forEach((f) => f.reset());
    setLiveStats((prev) => ({
      ...prev,
      repCount: 0,
      goodReps: 0,
      currentAngle: 180,
      currentPhase: "ready",
      feedback: {
        type: "info",
        message: `Switched to ${ex}. Assume starting position.`,
        score: 100,
      },
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. MediaPipe Model Loading (Self-Hosted Wasm & Task Model)
  // ─────────────────────────────────────────────────────────────────────────────
  const initPoseLandmarker = async (): Promise<PoseLandmarkerType> => {
    if (landmarkerRef.current) return landmarkerRef.current;
    if (isInitializingRef.current) {
      // Wait for existing initialization
      while (isInitializingRef.current && !landmarkerRef.current) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (landmarkerRef.current) return landmarkerRef.current;
    }

    isInitializingRef.current = true;

    try {
      const { FilesetResolver, PoseLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );

      // Load self-hosted WASM files from /mediapipe/wasm
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const modelPath = "/mediapipe/models/pose_landmarker_lite.task";

      let landmarker: PoseLandmarkerType;
      try {
        // First try GPU delegate
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        delegateUsedRef.current = "GPU";
      } catch (gpuErr) {
        console.warn("[MediaPipe] GPU delegate failed. Falling back to CPU:", gpuErr);
        // Automatic CPU fallback
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        delegateUsedRef.current = "CPU";
      }

      landmarkerRef.current = landmarker;
      setLiveStats((s) => ({ ...s, delegate: delegateUsedRef.current }));
      return landmarker;
    } finally {
      isInitializingRef.current = false;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Camera Setup & Error Handling
  // ─────────────────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);

    // Insecure context check
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setCameraError({
        kind: "insecure_context",
        title: "HTTPS Connection Required",
        message:
          "Modern browsers strictly restrict camera access to secure origins (HTTPS or localhost).",
        remedy:
          "Load via HTTPS (e.g., a local dev server with TLS) or http://localhost. See the <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#security_and_privacy\" target=\"_blank\">MDN guide</a> for details.",
      });
      setStageMode("error");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError({
        kind: "unknown",
        title: "Camera API Unsupported",
        message: "Your browser does not support the WebRTC MediaDevices API.",
        remedy: "Please upgrade to a modern browser like Chrome, Edge, Safari, or Firefox.",
      });
      setStageMode("error");
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Constraints: ideal 640x480 for 30+ fps on mobile, user facing
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      // Ensure model is initialized
      await initPoseLandmarker();

      setStageMode("calibrating");
      startDetectionLoop();
    } catch (err: unknown) {
      console.error("[Camera Access Error]:", err);

      let info: CameraErrorInfo;
      const errorName = err instanceof Error ? err.name : "";
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError" ||
        errorMsg.toLowerCase().includes("denied") ||
        errorMsg.toLowerCase().includes("permission")
      ) {
        info = {
          kind: "permission_denied",
          title: "Camera Permission Denied",
          message:
            "FitForge was not granted access to your webcam. Your video is processed entirely on your device and never saved.",
          remedy:
            "Click the lock/camera icon in your browser URL bar, select 'Allow' for Camera, and click 'Retry Camera' below.",
        };
      } else if (
        errorName === "NotFoundError" ||
        errorName === "DevicesNotFoundError" ||
        errorMsg.toLowerCase().includes("not found")
      ) {
        info = {
          kind: "not_found",
          title: "No Camera Detected",
          message: "No video input hardware was found on your computer or phone.",
          remedy:
            "Please connect an external webcam or verify that your built-in camera is enabled in system settings.",
        };
      } else if (
        errorName === "NotReadableError" ||
        errorName === "TrackStartError" ||
        errorMsg.toLowerCase().includes("already in use")
      ) {
        info = {
          kind: "in_use",
          title: "Camera In Use by Another Application",
          message:
            "Your webcam is currently locked by another program or browser window (e.g., Zoom, Teams, FaceTime).",
          remedy:
            "Close any active video conferencing apps or other browser tabs, then click 'Retry Camera'.",
        };
      } else {
        info = {
          kind: "unknown",
          title: "Camera Initialization Failed",
          message: errorMsg || "Unable to acquire video stream.",
          remedy: "Check your browser hardware permissions and try reloading the page.",
        };
      }

      setCameraError(info);
      setStageMode("error");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Body Framing Calibration Checker
  // ─────────────────────────────────────────────────────────────────────────────
  const evaluateFraming = (
    landmarks: PoseLandmarks
  ): {
    isReady: boolean;
    hint: string;
    details: string;
    visibleJointsCount: number;
  } => {
    const nose = landmarks[POSE_LANDMARKS.NOSE];
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    const allKeyPoints = [
      nose,
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
      leftKnee,
      rightKnee,
      leftAnkle,
      rightAnkle,
    ].filter(Boolean);

    const visibleCount = allKeyPoints.length;

    if (visibleCount < 3) {
      return {
        isReady: false,
        hint: "Step into camera frame",
        details: "No person detected. Stand 6–8 feet back facing the camera.",
        visibleJointsCount: visibleCount,
      };
    }

    // Check head
    if (!nose && !leftShoulder && !rightShoulder) {
      return {
        isReady: false,
        hint: "Tilt camera up or step back",
        details: "Upper body / head is cut off at the top of the screen.",
        visibleJointsCount: visibleCount,
      };
    }

    // Check lower body (feet / knees)
    if (!leftAnkle && !rightAnkle && !leftKnee && !rightKnee) {
      return {
        isReady: false,
        hint: "Step back — feet not visible",
        details: "Lower body is not in view. Back up until your shoes and knees are visible.",
        visibleJointsCount: visibleCount,
      };
    }

    if (!leftAnkle && !rightAnkle) {
      return {
        isReady: false,
        hint: "Step back 1–2 more feet",
        details: "Feet are slightly cut off. Step back so full depth can be tracked.",
        visibleJointsCount: visibleCount,
      };
    }

    // Check horizontal centering
    const midHipX =
      leftHip && rightHip ? (leftHip.x + rightHip.x) / 2 : (leftHip?.x || rightHip?.x || 0.5);

    // Note: in raw camera coordinates, if midHipX < 0.25 (left in camera -> right on mirrored screen)
    if (midHipX < 0.22) {
      return {
        isReady: false,
        hint: "Move toward center",
        details: "You are standing too close to the screen edge. Shift slightly center.",
        visibleJointsCount: visibleCount,
      };
    }
    if (midHipX > 0.78) {
      return {
        isReady: false,
        hint: "Move toward center",
        details: "You are standing too close to the screen edge. Shift slightly center.",
        visibleJointsCount: visibleCount,
      };
    }

    // All checks passed
    return {
      isReady: true,
      hint: "Full Body Locked! Ready to train",
      details: "Head to toe clearly visible. Tap 'Start Workout' or hold steady.",
      visibleJointsCount: visibleCount,
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Detection Loop (requestVideoFrameCallback with rAF Fallback + Adaptive FPS)
  // ─────────────────────────────────────────────────────────────────────────────
  const startDetectionLoop = () => {
    isRunningRef.current = true;

    const processFrame = (now: number) => {
      if (!isRunningRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || video.readyState < 2 || !landmarker) {
        scheduleNextFrame();
        return;
      }

      // Adaptive frame rate limiter
      const elapsedSinceLastDetect = now - lastFrameTimestampRef.current;
      if (elapsedSinceLastDetect < targetFrameIntervalMsRef.current) {
        // Skip frame to respect target FPS interval
        scheduleNextFrame();
        return;
      }

      const frameStartTime = performance.now();
      lastFrameTimestampRef.current = now;

      // Update FPS counter every ~500ms
      frameCounterRef.current += 1;
      if (frameStartTime - lastFpsCalcTimeRef.current >= 500) {
        const measuredFps = Math.round(
          (frameCounterRef.current * 1000) / (frameStartTime - lastFpsCalcTimeRef.current)
        );
        currentFpsRef.current = measuredFps;
        frameCounterRef.current = 0;
        lastFpsCalcTimeRef.current = frameStartTime;

        // Adapt target interval: If processing takes longer than 25ms, cap at 20 fps (50ms interval)
        if (targetFrameIntervalMsRef.current < 45 && measuredFps < 22) {
          targetFrameIntervalMsRef.current = 48; // cap near 20 fps
        }
      }

      // Sync canvas dimensions
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Run MediaPipe PoseLandmarker in VIDEO mode
      let result: PoseLandmarkerResult | null = null;
      try {
        result = landmarker.detectForVideo(video, frameStartTime);
      } catch (err) {
        console.warn("[MediaPipe detectForVideo error]:", err);
      }

      if (result && result.landmarks && result.landmarks.length > 0) {
        const raw2D = result.landmarks[0];
        const rawWorld3D = result.worldLandmarks?.[0];

        // Filter and smooth landmarks
        const filtered2D: PoseLandmarks = {};
        const filtered3D: PoseLandmarks = {};

        for (let i = 0; i < raw2D.length; i++) {
          const pt = raw2D[i];
          const visibility = pt.visibility ?? 1.0;

          // Ignore low confidence landmarks (visibility < 0.5)
          if (visibility < 0.5) {
            continue;
          }

          // Smooth 2D coordinate with One Euro filter
          const filter = filtersRef.current[i];
          const smoothed2D = filter.filter(
            { x: pt.x, y: pt.y, visibility },
            frameStartTime
          );
          filtered2D[i] = smoothed2D;

          // Process 3D world landmark if available
          if (rawWorld3D && rawWorld3D[i]) {
            const wPt = rawWorld3D[i];
            filtered3D[i] = {
              x: wPt.x,
              y: wPt.y,
              z: wPt.z,
              visibility: wPt.visibility ?? visibility,
            };
          }
        }

        // Biomechanics state update: use 3D worldLandmarks for angles if available, fallback to 2D
        const analyzerLandmarks =
          Object.keys(filtered3D).length >= 8 ? filtered3D : filtered2D;
        const currentWorkoutState = analyzerRef.current.analyze(analyzerLandmarks);

        // Performant Direct Skeleton Rendering on Canvas
        if (ctx) {
          renderMirroredSkeleton(ctx, filtered2D, canvas.width, canvas.height, currentWorkoutState);
        }

        // Throttled React state emissions (at most ~5 Hz or immediately on rep completion)
        const repJustIncremented =
          currentWorkoutState.repCount !== lastRepCountRef.current;
        const timeSinceLastEmit = frameStartTime - lastStateEmitTimeRef.current;

        if (repJustIncremented || timeSinceLastEmit >= 200) {
          lastStateEmitTimeRef.current = frameStartTime;
          lastRepCountRef.current = currentWorkoutState.repCount;

          // Calibration evaluation
          const framingResult = evaluateFraming(filtered2D);
          setCalibrationFeedback(framingResult);

          setLiveStats({
            repCount: currentWorkoutState.repCount,
            goodReps: currentWorkoutState.goodReps,
            currentAngle: currentWorkoutState.currentAngle,
            currentPhase: currentWorkoutState.currentPhase,
            feedback: currentWorkoutState.activeFeedback,
            fps: currentFpsRef.current,
            delegate: delegateUsedRef.current,
          });
        }
      } else {
        // No pose detected in this frame
        if (frameStartTime - lastStateEmitTimeRef.current >= 400) {
          lastStateEmitTimeRef.current = frameStartTime;
          setCalibrationFeedback({
            isReady: false,
            hint: "Step into camera view",
            details: "No body detected. Make sure the room is well-lit and you stand in front of the lens.",
            visibleJointsCount: 0,
          });
        }
      }

      // Measure total execution time to adapt frame delay
      const totalFrameDuration = performance.now() - frameStartTime;
      if (totalFrameDuration > 35 && targetFrameIntervalMsRef.current < 50) {
        // Weak device adaptation: throttle down toward 20 fps to keep UI fluid
        targetFrameIntervalMsRef.current = 50;
      }

      scheduleNextFrame();
    };

    const scheduleNextFrame = () => {
      const video = videoRef.current;
      if (
        video &&
        "requestVideoFrameCallback" in video &&
        typeof (video as unknown as { requestVideoFrameCallback?: unknown }).requestVideoFrameCallback === "function"
      ) {
        rvfcHandleRef.current = (video as unknown as { requestVideoFrameCallback: (cb: (now: number) => void) => number }).requestVideoFrameCallback((now: number) => {
          processFrame(now);
        });
      } else {
        // Fallback for older browsers
        animationFrameIdRef.current = requestAnimationFrame((timestamp) => {
          processFrame(timestamp);
        });
      }
    };

    scheduleNextFrame();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Mirrored Skeleton Drawing (Canvas X flipped so user sees a natural mirror)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderMirroredSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: PoseLandmarks,
    w: number,
    h: number,
    state: WorkoutState
  ) => {
    // Map points horizontally: drawX = (1 - x) * w for mirrored front-camera
    const mirroredLandmarks: PoseLandmarks = {};
    for (const [key, pt] of Object.entries(landmarks)) {
      if (pt) {
        mirroredLandmarks[Number(key)] = {
          x: 1 - pt.x,
          y: pt.y,
          z: pt.z,
          visibility: pt.visibility,
        };
      }
    }

    drawPoseSkeleton(ctx, mirroredLandmarks, w, h, state);
  };

  const proceedToActiveWorkout = () => {
    setStageMode("active");
    analyzerRef.current.reset();
  };

  return (
    <div className="min-h-screen bg-[var(--ff-bg-primary)] text-[var(--ff-text-primary)] flex flex-col">
      {/* Header Banner */}
      <header className="border-b border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/80 backdrop-blur-md px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg border border-[var(--ff-border)] text-xs text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)] hover:border-[var(--ff-accent)] transition-all"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[var(--ff-text-primary)]">
                FitForge Edge AI Camera
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-[var(--ff-text-secondary)] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  On-Device Vision
                </span>
                <span>•</span>
                <span>{liveStats.delegate} Acceleration</span>
                <span>•</span>
                <span>{liveStats.fps} FPS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Quick Selector */}
        <div className="flex items-center gap-1.5 bg-[var(--ff-bg-primary)] p-1 rounded-xl border border-[var(--ff-border)]">
          {EXERCISE_OPTIONS.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleExerciseSelect(ex.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1 ${
                selectedExercise === ex.id
                  ? "bg-[var(--ff-accent)] text-black font-semibold shadow-sm"
                  : "text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)] hover:bg-[var(--ff-bg-secondary)]"
              }`}
            >
              <span>{ex.icon}</span>
              <span className="hidden sm:inline">{ex.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Safety Notice & Medical Disclaimer Bar */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>Safety Notice:</strong> Not medical advice. Warm up first and{" "}
            <strong>stop immediately if you feel pain</strong>.
          </span>
        </div>
        <span className="text-[11px] text-amber-300/70 hidden md:inline">
          Form quality never penalizes activity. Every rep counts.
        </span>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 max-w-7xl mx-auto w-full">
        {/* Left / Center Viewport: Video & Skeleton Canvas Overlay */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] max-w-2xl bg-black rounded-2xl overflow-hidden border border-[var(--ff-border)] shadow-2xl flex items-center justify-center">
            {/* Real Webcam Stream */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} // Mirrored preview
            />

            {/* AI Computer Vision Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* Stage Mode: Consent & Pre-Setup Guide Overlay */}
            {stageMode === "guide" && (
              <div className="absolute inset-0 bg-[var(--ff-bg-primary)]/95 backdrop-blur-md z-20 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    100% On-Device Privacy Guaranteed
                  </div>
                  <h2 className="text-xl font-bold text-[var(--ff-text-primary)]">
                    Setup Your Camera for Real-Time Form Tracking
                  </h2>
                  <p className="text-sm text-[var(--ff-text-secondary)] leading-relaxed">
                    All computer vision processing occurs strictly within your browser via
                    WebAssembly. <strong>No video or camera frames are ever sent or saved</strong>{" "}
                    to any server.
                  </p>

                  {/* Positioning Guidance Grid */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)] space-y-1.5">
                      <div className="text-xs font-semibold text-[var(--ff-accent)] flex items-center gap-1.5">
                        <span>📐</span> Camera Distance & Angle
                      </div>
                      <p className="text-xs text-[var(--ff-text-secondary)]">
                        Stand <strong>6–8 feet (2m) back</strong> so your whole body is framed
                        head-to-toe. {EXERCISE_OPTIONS.find((e) => e.id === selectedExercise)?.sideViewNote}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)] space-y-1.5">
                      <div className="text-xs font-semibold text-[var(--ff-accent)] flex items-center gap-1.5">
                        <span>💡</span> Lighting Tips
                      </div>
                      <p className="text-xs text-[var(--ff-text-secondary)]">
                        Ensure light faces you from the front. Avoid standing directly in front of
                        bright windows or backlighting.
                      </p>
                    </div>
                  </div>

                  {/* Privacy Checkbox Consent */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[var(--ff-accent)] accent-[var(--ff-accent)] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-[var(--ff-text-primary)]">
                      I understand all video processing happens on my device and agree to warm up
                      and stop if I feel any pain or discomfort.
                    </span>
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  <div className="text-xs text-[var(--ff-text-secondary)]">
                    Exercise: <strong className="text-[var(--ff-text-primary)]">{selectedExercise}</strong>
                  </div>
                  <button
                    disabled={!consentAccepted}
                    onClick={startCamera}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                      consentAccepted
                        ? "bg-[var(--ff-accent)] text-black hover:opacity-90 shadow-lg"
                        : "bg-[var(--ff-bg-secondary)] text-[var(--ff-text-secondary)] cursor-not-allowed border border-[var(--ff-border)]"
                    }`}
                  >
                    <span>Enable Camera & Calibrate</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stage Mode: Error State Display */}
            {stageMode === "error" && cameraError && (
              <div className="absolute inset-0 bg-[var(--ff-bg-primary)]/95 backdrop-blur-md z-20 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl text-red-400">
                  ⚠️
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg font-bold text-[var(--ff-text-primary)]">
                    {cameraError.title}
                  </h3>
                  <p className="text-xs text-[var(--ff-text-secondary)] leading-relaxed">
                    {cameraError.message}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 max-w-md text-left text-xs text-red-200">
                  <strong>How to fix:</strong> {cameraError.remedy}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-5 py-2 rounded-xl bg-[var(--ff-accent)] text-black font-semibold text-xs hover:opacity-90 transition-all shadow-md"
                  >
                    Retry Camera
                  </button>
                  <button
                    onClick={() => setStageMode("guide")}
                    className="px-4 py-2 rounded-xl border border-[var(--ff-border)] text-xs text-[var(--ff-text-secondary)] hover:text-[var(--ff-text-primary)]"
                  >
                    Back to Setup
                  </button>
                </div>
              </div>
            )}

            {/* Calibration Banner Overlay */}
            {stageMode === "calibrating" && (
              <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2">
                <div
                  className={`p-3 rounded-xl border backdrop-blur-md transition-all flex items-center justify-between ${
                    calibrationFeedback.isReady
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-500/20 border-amber-500/40 text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">
                      {calibrationFeedback.isReady ? "✅" : "🚶‍♂️"}
                    </span>
                    <div>
                      <div className="text-xs font-bold">{calibrationFeedback.hint}</div>
                      <div className="text-[11px] opacity-80">{calibrationFeedback.details}</div>
                    </div>
                  </div>

                  <button
                    disabled={!calibrationFeedback.isReady}
                    onClick={proceedToActiveWorkout}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      calibrationFeedback.isReady
                        ? "bg-emerald-400 text-black hover:opacity-90 shadow-md animate-bounce"
                        : "bg-black/40 text-white/40 cursor-not-allowed border border-white/10"
                    }`}
                  >
                    Start Workout →
                  </button>
                </div>
              </div>
            )}

            {/* Live HUD Badges on Top of Active Video */}
            {stageMode === "active" && (
              <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
                {/* Rep Counter Badge */}
                <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[var(--ff-border)] shadow-lg flex items-center gap-3">
                  <div>
                    <div className="text-[10px] text-[var(--ff-text-secondary)] uppercase font-mono tracking-wider">
                      Reps
                    </div>
                    <div className="text-2xl font-black text-[var(--ff-text-primary)] font-mono leading-none">
                      {liveStats.repCount}
                    </div>
                  </div>
                  <div className="h-7 w-[1px] bg-[var(--ff-border)]" />
                  <div>
                    <div className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider">
                      Clean
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono leading-none">
                      {liveStats.goodReps}
                    </div>
                  </div>
                </div>

                {/* Primary Angle Indicator */}
                <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[var(--ff-border)] shadow-lg text-right">
                  <div className="text-[10px] text-[var(--ff-text-secondary)] uppercase font-mono tracking-wider">
                    {EXERCISE_OPTIONS.find((e) => e.id === selectedExercise)?.targetJoint}
                  </div>
                  <div className="text-2xl font-black text-[var(--ff-accent)] font-mono leading-none">
                    {liveStats.currentAngle}°
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Feedback Banner Below Video */}
          <div className="mt-3 w-full max-w-2xl">
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                liveStats.feedback.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : liveStats.feedback.type === "warning"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : liveStats.feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-[var(--ff-bg-secondary)] border-[var(--ff-border)] text-[var(--ff-text-primary)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>
                  {liveStats.feedback.type === "error"
                    ? "🚨"
                    : liveStats.feedback.type === "warning"
                    ? "⚠️"
                    : liveStats.feedback.type === "success"
                    ? "✨"
                    : "ℹ️"}
                </span>
                <span className="font-medium">{liveStats.feedback.message}</span>
              </div>
              <div className="text-[10px] font-mono opacity-70 uppercase tracking-wider">
                Phase: {liveStats.currentPhase}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Real-time Telemetry & Technique Rules */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Technique Guidance Card */}
          <div className="p-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ff-text-secondary)] font-mono">
              Deterministic Form Rules
            </h3>
            <div className="space-y-2 text-xs">
              {selectedExercise === "squat" && (
                <>
                  <div className="p-2.5 rounded-xl bg-[var(--ff-bg-primary)] border border-[var(--ff-border)] flex items-start gap-2">
                    <span className="text-[var(--ff-accent)]">✓</span>
                    <div>
                      <strong>Parallel Depth:</strong> Knee angle drops below 100° at bottom.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--ff-bg-primary)] border border-[var(--ff-border)] flex items-start gap-2">
                    <span className="text-[var(--ff-accent)]">✓</span>
                    <div>
                      <strong>Knee Tracking:</strong> Knees must track over toes without inward caving (valgus).
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--ff-bg-primary)] border border-[var(--ff-border)] flex items-start gap-2">
                    <span className="text-[var(--ff-accent)]">✓</span>
                    <div>
                      <strong>Upright Torso:</strong> Back angle relative to vertical stays under 45°.
                    </div>
                  </div>
                </>
              )}

              {selectedExercise === "pushup" && (
                <>
                  <div className="p-2.5 rounded-xl bg-[var(--ff-bg-primary)] border border-[var(--ff-border)] flex items-start gap-2">
                    <span className="text-[var(--ff-accent)]">✓</span>
                    <div>
                      <strong>Elbow Flexion:</strong> Elbow reaches 90° or deeper at lowest point.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--ff-bg-primary)] border border-[var(--ff-border)] flex items-start gap-2">
                    <span className="text-[var(--ff-accent)]">✓</span>
                    <div>
                      <strong>Spine Neutrality:</strong> Shoulder-hip-ankle line between 165° and 180°.
                    </div>
                  </div>
                </>
              )}

              {selectedExercise === "plank" && (
                <>
                  <div className="p-2.5 rounded-xl bg-[var(--ff-bg-primary)] border border-[var(--ff-border)] flex items-start gap-2">
                    <span className="text-[var(--ff-accent)]">✓</span>
                    <div>
                      <strong>Straight Plank:</strong> Shoulders, hips, and ankles aligned horizontally.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--ff-bg-primary)] border border-[var(--ff-border)] flex items-start gap-2">
                    <span className="text-[var(--ff-accent)]">✓</span>
                    <div>
                      <strong>No Sagging / Piking:</strong> Hips kept elevated and core braced.
                    </div>
                  </div>
                </>
              )}

              {selectedExercise === "jumping_jack" && (
                <>
                  <div className="p-2.5 rounded-xl bg-[var(--ff-bg-primary)] border border-[var(--ff-border)] flex items-start gap-2">
                    <span className="text-[var(--ff-accent)]">✓</span>
                    <div>
                      <strong>Arm Overhead Reach:</strong> Shoulder abduction reaches above 140°.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* System Performance & Architecture Card */}
          <div className="p-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)] space-y-2 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ff-text-secondary)] font-mono">
              Pipeline Architecture
            </h3>
            <div className="space-y-1.5 text-[var(--ff-text-secondary)]">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-mono text-[var(--ff-text-primary)]">pose_landmarker_lite (float16)</span>
              </div>
              <div className="flex justify-between">
                <span>Host:</span>
                <span className="font-mono text-emerald-400">Self-hosted /public</span>
              </div>
              <div className="flex justify-between">
                <span>Acceleration:</span>
                <span className="font-mono text-[var(--ff-text-primary)]">{liveStats.delegate} Delegate</span>
              </div>
              <div className="flex justify-between">
                <span>Filter:</span>
                <span className="font-mono text-[var(--ff-text-primary)]">One Euro Filter (adaptive)</span>
              </div>
              <div className="flex justify-between">
                <span>Angles:</span>
                <span className="font-mono text-[var(--ff-text-primary)]">3D Euclidean Dot Product</span>
              </div>
              <div className="flex justify-between">
                <span>Throttling:</span>
                <span className="font-mono text-[var(--ff-text-primary)]">5 Hz React / 20+ Hz Canvas</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
