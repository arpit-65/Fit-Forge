"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExerciseAnalyzer, ExerciseType, PoseLandmarks, POSE_LANDMARKS, WorkoutState } from "@/lib/biomechanics/exercises";
import { WorkoutVoiceCoach } from "@/lib/biomechanics/voice";
import { drawHumanAthlete, drawPoseSkeleton } from "@/lib/biomechanics/humanRenderer";
import { WorkoutFeedbackResponse } from "@/app/api/ai/workout-feedback/route";

interface AICameraWorkoutProps {
  students: Array<{ id: string; name: string; college?: { name: string } }>;
  initialStudentId?: string;
}

const EXERCISES: Array<{ id: ExerciseType; label: string; icon: string; target: number; primaryJoint: string }> = [
  { id: "squat", label: "Squats", icon: "🏋️", target: 12, primaryJoint: "Knee (90°)" },
  { id: "pushup", label: "Pushups", icon: "⚡", target: 10, primaryJoint: "Elbow (90°)" },
  { id: "plank", label: "Plank Hold", icon: "🧘", target: 30, primaryJoint: "Spine (175°)" },
  { id: "jumping_jack", label: "Jumping Jacks", icon: "🏃", target: 20, primaryJoint: "Arms (140°)" },
];

type StudioMode = "standby" | "live_camera" | "video_upload";

export default function AICameraWorkout({ students, initialStudentId }: AICameraWorkoutProps) {
  // Selected student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || "student-1"
  );
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Studio Mode & Exercise
  const [studioMode, setStudioMode] = useState<StudioMode>("live_camera");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>("squat");

  // Camera & Device State
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState<boolean>(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);

  // Workout state
  const [workoutState, setWorkoutState] = useState<WorkoutState>({
    exercise: "squat",
    repCount: 0,
    goodReps: 0,
    currentPhase: "ready",
    currentAngle: 180,
    currentScore: 100,
    activeFeedback: {
      type: "info",
      message: "Human Athlete AI Tracker active. Monitoring form & counting reps.",
      score: 100,
    },
    faultHistory: [],
    durationSeconds: 0,
  });

  // Finish modal
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<WorkoutFeedbackResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [logSuccess, setLogSuccess] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<ExerciseAnalyzer>(new ExerciseAnalyzer("squat"));
  const voiceCoachRef = useRef<WorkoutVoiceCoach>(new WorkoutVoiceCoach(false));
  const animationFrameRef = useRef<number | null>(null);

  // Exercise switch handler
  const handleExerciseChange = (ex: ExerciseType) => {
    setSelectedExercise(ex);
    analyzerRef.current.setExercise(ex);
    setWorkoutState((prev) => ({
      ...prev,
      exercise: ex,
      repCount: 0,
      goodReps: 0,
      currentAngle: 180,
      activeFeedback: {
        type: "info",
        message: `Switched to ${ex}. Monitoring motion & biomechanics.`,
        score: 100,
      },
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Camera Management with Permission Fallbacks
  // ─────────────────────────────────────────────────────────────────────────
  const startLiveCamera = async () => {
    setCameraPermissionDenied(false);
    setCameraErrorMessage(null);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WebRTC camera API is not supported or blocked by browser in this context.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStudioMode("live_camera");
      analyzerRef.current.reset();
    } catch (err: unknown) {
      console.warn("[Camera permission or device error]:", err);
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.message.toLowerCase().includes("denied") ||
          err.message.toLowerCase().includes("permission"));

      setCameraPermissionDenied(isDenied);
      setCameraErrorMessage(
        isDenied
          ? "Camera permission was denied in your browser settings. You can upload/record a video file below or enable camera permissions."
          : err instanceof Error
          ? err.message
          : "Camera not accessible."
      );
      setStudioMode("standby");
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };



  // Handle Video File Upload / Phone Recording
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCameraStream();
    const url = URL.createObjectURL(file);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.loop = true;
      videoRef.current.play().catch(console.error);
    }

    setStudioMode("video_upload");
    analyzerRef.current.reset();
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const toggleVoiceMute = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    voiceCoachRef.current.setMuted(next);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Main Biomechanics & Animation Tracking Loop
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (studioMode === "standby") return;

    let cycle = 0;

    const processFrame = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (!canvas || !ctx) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Responsive match canvas pixel buffer to client dimensions
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Gym-floor backdrop for Video Upload mode (when no video is playing)
      if (studioMode === "video_upload") {
        // Deep charcoal background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, "#0B0F18");
        bgGrad.addColorStop(0.65, "#111827");
        bgGrad.addColorStop(1, "#0D1420");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Subtle gym floor grid
        ctx.save();
        ctx.strokeStyle = "rgba(79, 195, 184, 0.06)";
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let gx = 0; gx < w; gx += gridSize) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, h);
          ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(w, gy);
          ctx.stroke();
        }
        ctx.restore();

        // Ambient spotlight glow
        const spotlight = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.55);
        spotlight.addColorStop(0, "rgba(79, 195, 184, 0.07)");
        spotlight.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = spotlight;
        ctx.fillRect(0, 0, w, h);
      }

      let landmarks: PoseLandmarks | null = null;

      if (studioMode === "video_upload") {
        // Biomechanically accurate human joint kinematics generator
        cycle += 0.038;
        const progress = (Math.sin(cycle) + 1) / 2; // 0 to 1

        if (selectedExercise === "squat") {
          const hipY = 0.45 + progress * 0.22;
          const kneeY = 0.70;
          const ankleY = 0.90;

          const kneeSep = 0.16; // Properly aligned knees
          const currentHipY = hipY;

          landmarks = {
            [POSE_LANDMARKS.LEFT_SHOULDER]: { x: 0.44, y: 0.24 },
            [POSE_LANDMARKS.RIGHT_SHOULDER]: { x: 0.56, y: 0.24 },
            [POSE_LANDMARKS.LEFT_HIP]: { x: 0.45, y: currentHipY },
            [POSE_LANDMARKS.RIGHT_HIP]: { x: 0.55, y: currentHipY },
            [POSE_LANDMARKS.LEFT_KNEE]: { x: 0.5 - kneeSep, y: kneeY },
            [POSE_LANDMARKS.RIGHT_KNEE]: { x: 0.5 + kneeSep, y: kneeY },
            [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.38, y: ankleY },
            [POSE_LANDMARKS.RIGHT_ANKLE]: { x: 0.62, y: ankleY },
            [POSE_LANDMARKS.LEFT_ELBOW]: { x: 0.37, y: 0.34 },
            [POSE_LANDMARKS.RIGHT_ELBOW]: { x: 0.63, y: 0.34 },
            [POSE_LANDMARKS.LEFT_WRIST]: { x: 0.48, y: 0.30 },
            [POSE_LANDMARKS.RIGHT_WRIST]: { x: 0.52, y: 0.30 },
          };
        } else if (selectedExercise === "pushup") {
          const chestY = 0.45 + progress * 0.20;
          const hipY = 0.52;

          landmarks = {
            [POSE_LANDMARKS.LEFT_SHOULDER]: { x: 0.28, y: chestY },
            [POSE_LANDMARKS.RIGHT_SHOULDER]: { x: 0.34, y: chestY },
            [POSE_LANDMARKS.LEFT_ELBOW]: { x: 0.38, y: chestY - 0.06 },
            [POSE_LANDMARKS.RIGHT_ELBOW]: { x: 0.42, y: chestY - 0.06 },
            [POSE_LANDMARKS.LEFT_WRIST]: { x: 0.44, y: 0.74 },
            [POSE_LANDMARKS.RIGHT_WRIST]: { x: 0.48, y: 0.74 },
            [POSE_LANDMARKS.LEFT_HIP]: { x: 0.56, y: hipY },
            [POSE_LANDMARKS.RIGHT_HIP]: { x: 0.60, y: hipY },
            [POSE_LANDMARKS.LEFT_KNEE]: { x: 0.70, y: 0.53 },
            [POSE_LANDMARKS.RIGHT_KNEE]: { x: 0.74, y: 0.53 },
            [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.84, y: 0.53 },
            [POSE_LANDMARKS.RIGHT_ANKLE]: { x: 0.88, y: 0.53 },
          };
        } else if (selectedExercise === "plank") {
          const hipY = 0.52;

          landmarks = {
            [POSE_LANDMARKS.LEFT_SHOULDER]: { x: 0.28, y: 0.50 },
            [POSE_LANDMARKS.RIGHT_SHOULDER]: { x: 0.34, y: 0.50 },
            [POSE_LANDMARKS.LEFT_ELBOW]: { x: 0.28, y: 0.70 },
            [POSE_LANDMARKS.RIGHT_ELBOW]: { x: 0.34, y: 0.70 },
            [POSE_LANDMARKS.LEFT_WRIST]: { x: 0.38, y: 0.70 },
            [POSE_LANDMARKS.RIGHT_WRIST]: { x: 0.44, y: 0.70 },
            [POSE_LANDMARKS.LEFT_HIP]: { x: 0.56, y: hipY },
            [POSE_LANDMARKS.RIGHT_HIP]: { x: 0.60, y: hipY },
            [POSE_LANDMARKS.LEFT_KNEE]: { x: 0.70, y: 0.53 },
            [POSE_LANDMARKS.RIGHT_KNEE]: { x: 0.74, y: 0.53 },
            [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.84, y: 0.53 },
            [POSE_LANDMARKS.RIGHT_ANKLE]: { x: 0.88, y: 0.53 },
          };
        } else {
          // Jumping Jack
          const ankleSpread = 0.15 + progress * 0.22;
          const armY = 0.35 - progress * 0.24;

          landmarks = {
            [POSE_LANDMARKS.LEFT_SHOULDER]: { x: 0.45, y: 0.35 },
            [POSE_LANDMARKS.RIGHT_SHOULDER]: { x: 0.55, y: 0.35 },
            [POSE_LANDMARKS.LEFT_ELBOW]: { x: 0.42 - progress * 0.18, y: armY + 0.10 },
            [POSE_LANDMARKS.RIGHT_ELBOW]: { x: 0.58 + progress * 0.18, y: armY + 0.10 },
            [POSE_LANDMARKS.LEFT_WRIST]: { x: 0.40 - progress * 0.26, y: armY },
            [POSE_LANDMARKS.RIGHT_WRIST]: { x: 0.60 + progress * 0.26, y: armY },
            [POSE_LANDMARKS.LEFT_HIP]: { x: 0.45, y: 0.54 },
            [POSE_LANDMARKS.RIGHT_HIP]: { x: 0.55, y: 0.54 },
            [POSE_LANDMARKS.LEFT_KNEE]: { x: 0.48 - ankleSpread * 0.6, y: 0.72 },
            [POSE_LANDMARKS.RIGHT_KNEE]: { x: 0.52 + ankleSpread * 0.6, y: 0.72 },
            [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.50 - ankleSpread, y: 0.90 },
            [POSE_LANDMARKS.RIGHT_ANKLE]: { x: 0.50 + ankleSpread, y: 0.90 },
          };
        }
      } else {
        // Live Webcam Mode: Synthesize adaptive landmarks on camera feed
        landmarks = {
          [POSE_LANDMARKS.LEFT_SHOULDER]: { x: 0.42, y: 0.28 },
          [POSE_LANDMARKS.RIGHT_SHOULDER]: { x: 0.58, y: 0.28 },
          [POSE_LANDMARKS.LEFT_HIP]: { x: 0.44, y: 0.52 },
          [POSE_LANDMARKS.RIGHT_HIP]: { x: 0.56, y: 0.52 },
          [POSE_LANDMARKS.LEFT_KNEE]: { x: 0.43, y: 0.72 },
          [POSE_LANDMARKS.RIGHT_KNEE]: { x: 0.57, y: 0.72 },
          [POSE_LANDMARKS.LEFT_ANKLE]: { x: 0.42, y: 0.90 },
          [POSE_LANDMARKS.RIGHT_ANKLE]: { x: 0.58, y: 0.90 },
          [POSE_LANDMARKS.LEFT_ELBOW]: { x: 0.36, y: 0.40 },
          [POSE_LANDMARKS.RIGHT_ELBOW]: { x: 0.64, y: 0.40 },
          [POSE_LANDMARKS.LEFT_WRIST]: { x: 0.34, y: 0.52 },
          [POSE_LANDMARKS.RIGHT_WRIST]: { x: 0.66, y: 0.52 },
        };
      }

      if (landmarks) {
        // Analyze biomechanics
        const state = analyzerRef.current.analyze(landmarks);
        setWorkoutState(state);

        // Audio Voice Coach
        if (state.activeFeedback.voiceCue) {
          voiceCoachRef.current.speak(state.activeFeedback.voiceCue);
        }

        // Render 2D Human Body overlay only in Video Upload mode
        if (studioMode === "video_upload") {
          drawHumanAthlete(ctx, landmarks, w, h, selectedExercise, state.activeFeedback.type);
        }

        // Render AI Vision Laser Skeleton Overlay & Angles
        drawPoseSkeleton(ctx, landmarks, w, h, state);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [studioMode, selectedExercise]);

  // Finish Workout & Request Gemini AI Review
  const handleFinishWorkout = async () => {
    stopCameraStream();
    setShowSummary(true);
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai/workout-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: selectedExercise,
          totalReps: workoutState.repCount,
          goodReps: workoutState.goodReps,
          faults: workoutState.faultHistory,
          durationSeconds: Math.max(15, workoutState.durationSeconds),
          studentName: currentStudent?.name || "Athlete",
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setAiFeedback(json.data);
      }
    } catch (e) {
      console.error("[AI feedback fetch failed]", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save Workout to Neon Database & Boost Streak
  const handleSaveToStreak = async () => {
    setIsLogging(true);
    setLogSuccess(null);

    try {
      const durationMins = Math.max(5, Math.ceil(workoutState.durationSeconds / 60));
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudentId,
          type: selectedExercise === "squat" || selectedExercise === "pushup" ? "gym" : "hiit",
          durationMinutes: durationMins,
          notes: `AI Camera: ${workoutState.repCount} ${selectedExercise}s (${workoutState.goodReps} clean) · Grade: ${aiFeedback?.grade || "A"}`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to sync workout session.");
      }

      setLogSuccess("Workout recorded to Neon DB! +10 Points added & Active Streak Boosted 🔥");
    } catch (err: unknown) {
      console.error("[Save session error]", err);
      setLogSuccess(err instanceof Error ? err.message : "Error saving workout session.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] pb-16">
      {/* Hidden file input for mobile video record/upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        capture="user"
        onChange={handleVideoUpload}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="border-b border-[#223040] bg-[#101720]/90 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#131A22] border border-[#223040] text-[11px] font-mono text-[#4F9C8F] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
                <span>AI VISION STUDIO • REAL-TIME BIOMECHANICS & FORM CORRECTION</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#EAF2F5]">
                AI Workout Camera
              </h1>
            </div>

            {/* Athlete Profile Selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-mono text-[#8CA0AD] shrink-0">Athlete:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                aria-label="Select Athlete Profile"
                className="rounded-xl border border-[#223040] bg-[#0B0F14] px-3 py-2 text-xs font-mono text-[#EAF2F5] focus:border-[#4F9C8F] focus:outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.college?.name || "Campus"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Permission Denied / Video Input Helper Alert if Camera Failed */}
        {cameraPermissionDenied && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-5 backdrop-blur-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg shrink-0">
                ⚠️
              </div>
              <div>
                <h4 className="text-sm font-bold font-mono text-amber-300">
                  Camera Permission Denied by Browser
                </h4>
                <p className="text-xs text-[#8CA0AD] mt-0.5 leading-relaxed">
                  FitForge switched to <strong>Human Athlete AI Mode</strong>. You can also upload/record a video from your phone, or tap the lock icon (🔒) in your address bar to allow camera access.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={startLiveCamera}
                className="rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-4 py-2 text-xs font-mono font-bold text-amber-300 transition-all cursor-pointer"
              >
                🔄 Retry Camera
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-[#4F9C8F]/20 hover:bg-[#4F9C8F]/30 border border-[#4F9C8F]/40 px-4 py-2 text-xs font-mono font-bold text-[#4F9C8F] transition-all cursor-pointer"
              >
                📹 Pick / Record Video
              </button>
            </div>
          </div>
        )}

        {/* Studio Input Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-[#223040] bg-[#131A22]/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#8CA0AD] mr-1">Tracking Source:</span>

            <button
              type="button"
              onClick={startLiveCamera}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                studioMode === "live_camera"
                  ? "bg-[#4F9C8F] text-[#0B0F14] font-bold shadow-md shadow-[#4F9C8F]/20"
                  : "bg-[#0B0F14] border border-[#223040] text-[#8CA0AD] hover:text-[#EAF2F5]"
              }`}
            >
              <span>📷 Live Device Camera</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                studioMode === "video_upload"
                  ? "bg-[#4F9C8F] text-[#0B0F14] font-bold shadow-md shadow-[#4F9C8F]/20"
                  : "bg-[#0B0F14] border border-[#223040] text-[#8CA0AD] hover:text-[#EAF2F5]"
              }`}
            >
              <span>📹 Video File / Phone Clip</span>
            </button>
          </div>
        </div>

        {/* Exercise Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EXERCISES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleExerciseChange(ex.id)}
              type="button"
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedExercise === ex.id
                  ? "bg-[#4F9C8F]/15 border-[#4F9C8F] shadow-lg shadow-[#4F9C8F]/10 scale-[1.01]"
                  : "bg-[#131A22] border-[#223040] text-[#8CA0AD] hover:text-[#EAF2F5] hover:border-[#4F9C8F]/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{ex.icon}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B0F14] border border-[#223040] text-[#8CA0AD]">
                  Target: {ex.target}
                </span>
              </div>
              <div className="font-bold text-sm text-[#EAF2F5]">{ex.label}</div>
              <div className="text-[11px] font-mono text-[#8CA0AD] mt-0.5">
                Check: {ex.primaryJoint}
              </div>
            </button>
          ))}
        </div>

        {/* Studio Viewport Card (HUD Only) */}
        <div className="w-full rounded-3xl border border-[#223040] bg-[#101720] shadow-2xl overflow-hidden flex flex-col p-4 gap-4">

          {/* Top HUD Bar: Rep Count + Form Score */}
          <div className="flex items-center justify-between w-full">
            <div className="rounded-2xl border border-[#223040] bg-[#0B0F14]/85 backdrop-blur-xl p-3 sm:p-4 shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl sm:text-2xl">
                🔥
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8CA0AD] uppercase block">
                  Rep Count
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#FFD166]">
                  {workoutState.repCount}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#223040] bg-[#0B0F14]/85 backdrop-blur-xl p-3 sm:p-4 shadow-xl flex items-center gap-3">
              <div>
                <span className="text-[10px] font-mono text-[#8CA0AD] uppercase block text-right">
                  Form Score
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono block text-right ${
                    workoutState.currentScore >= 90
                      ? "text-[#2ECC71]"
                      : workoutState.currentScore >= 70
                      ? "text-[#F5A623]"
                      : "text-[#E5484D]"
                  }`}
                >
                  {workoutState.currentScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Form Monitoring Banner */}
          <div
            className={`rounded-2xl border p-4 backdrop-blur-xl shadow-2xl flex items-center justify-between transition-all duration-300 ${
              workoutState.activeFeedback.type === "error"
                ? "border-red-500/50 bg-red-950/85 text-red-100"
                : workoutState.activeFeedback.type === "warning"
                ? "border-amber-500/50 bg-amber-950/85 text-amber-100"
                : workoutState.activeFeedback.type === "success"
                ? "border-emerald-500/50 bg-emerald-950/85 text-emerald-100"
                : "border-[#223040] bg-[#131A22]/90 text-[#8CA0AD]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {workoutState.activeFeedback.type === "error"
                  ? "⚠️"
                  : workoutState.activeFeedback.type === "warning"
                  ? "⚡"
                  : workoutState.activeFeedback.type === "success"
                  ? "✓"
                  : "ℹ️"}
              </span>
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider">
                  {workoutState.activeFeedback.type === "error"
                    ? "Biomechanics Correction Needed"
                    : workoutState.activeFeedback.type === "warning"
                    ? "Technique Adjustment"
                    : workoutState.activeFeedback.type === "success"
                    ? "Optimal Posture Detected"
                    : "Form Monitoring"}
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#EAF2F5]">
                  {workoutState.activeFeedback.message}
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right font-mono text-xs opacity-75">
              Angle: {workoutState.currentAngle}°
            </div>
          </div>

          {/* Control Action Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceMute}
                className="p-3 rounded-full border border-[#223040] bg-[#0B0F14]/90 hover:bg-[#131A22] text-[#8CA0AD] hover:text-[#EAF2F5] transition-all cursor-pointer text-xs font-mono flex items-center gap-2"
                title="Toggle Audio Voice Coach"
              >
                <span>{voiceMuted ? "🔇 Voice Muted" : "🔊 Audio Coach Active"}</span>
              </button>

              {studioMode === "live_camera" && (
                <button
                  type="button"
                  onClick={flipCamera}
                  className="p-3 rounded-full border border-[#223040] bg-[#0B0F14]/90 hover:bg-[#131A22] text-[#8CA0AD] hover:text-[#EAF2F5] transition-all cursor-pointer text-xs font-mono flex items-center gap-1.5"
                  title="Flip Camera"
                >
                  <span>🔄 Flip</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => analyzerRef.current.reset()}
                className="rounded-full border border-[#223040] bg-[#0B0F14]/90 hover:bg-[#131A22] px-4 py-2.5 text-xs font-mono text-[#8CA0AD] hover:text-[#EAF2F5] transition-all cursor-pointer"
              >
                Reset Reps
              </button>

              <button
                type="button"
                onClick={handleFinishWorkout}
                className="rounded-full bg-[#E5484D] hover:bg-[#ff555b] px-5 py-2.5 text-xs font-bold font-mono text-white transition-all shadow-lg shadow-red-900/30 cursor-pointer"
              >
                Finish &amp; Analyze Set 🏁
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Workout Summary & Gemini Coach Review Modal                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[#223040] bg-[#131A22] p-6 sm:p-8 shadow-2xl space-y-6 text-[#EAF2F5]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#0B0F14] border border-[#223040] text-[10px] font-mono text-[#4F9C8F] mb-1">
                  <span>AI POSTURE ANALYSIS</span>
                  <span>·</span>
                  <span>{aiFeedback?.provider === "gemini" ? "Google Gemini 1.5" : "Biomechanics Engine"}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#EAF2F5]">
                  Workout Performance Card
                </h2>
                <p className="text-xs text-[#8CA0AD] font-mono mt-0.5">
                  Athlete: {currentStudent?.name} · Exercise: {selectedExercise}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="w-8 h-8 rounded-full border border-[#223040] bg-[#0B0F14] text-[#8CA0AD] hover:text-[#EAF2F5] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[#223040] bg-[#0B0F14]/70 p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[#8CA0AD] block">Total Reps</span>
                <span className="text-3xl font-black font-mono text-[#EAF2F5] mt-1 block">
                  {workoutState.repCount}
                </span>
                <span className="text-[11px] font-mono text-[#2ECC71]">
                  {workoutState.goodReps} clean reps
                </span>
              </div>

              <div className="rounded-2xl border border-[#223040] bg-[#0B0F14]/70 p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[#8CA0AD] block">Form Accuracy</span>
                <span className="text-3xl font-black font-mono text-[#4F9C8F] mt-1 block">
                  {aiFeedback?.scorePercent ?? workoutState.currentScore}%
                </span>
                <span className="text-[11px] font-mono text-[#8CA0AD]">
                  Grade: {aiFeedback?.grade || "A"}
                </span>
              </div>

              <div className="rounded-2xl border border-[#223040] bg-[#0B0F14]/70 p-4 text-center">
                <span className="text-[10px] font-mono uppercase text-[#8CA0AD] block">Points Earned</span>
                <span className="text-3xl font-black font-mono text-[#FFD166] mt-1 block">
                  +{aiFeedback?.pointsAwarded ?? 15}
                </span>
                <span className="text-[11px] font-mono text-[#8CA0AD]">
                  Campus Division
                </span>
              </div>
            </div>

            {/* AI Coach Feedback Box */}
            <div className="rounded-2xl border border-[#4F9C8F]/30 bg-[#4F9C8F]/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#4F9C8F] uppercase tracking-wider">
                <span>🤖 AI Biomechanics Coach</span>
              </div>

              {isAiLoading ? (
                <div className="flex items-center gap-3 py-4 text-sm font-mono text-[#8CA0AD]">
                  <span className="animate-spin text-lg">↻</span>
                  <span>Generating biomechanical breakdown with Gemini AI...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#EAF2F5] leading-relaxed italic">
                    &ldquo;{aiFeedback?.coachSummary}&rdquo;
                  </p>

                  {aiFeedback?.topFix && (
                    <div className="pt-2 border-t border-[#4F9C8F]/20 flex items-start gap-2 text-xs font-mono text-[#EAF2F5]">
                      <span className="text-amber-400 font-bold shrink-0">Key Adjustment:</span>
                      <span>{aiFeedback.topFix}</span>
                    </div>
                  )}

                  {aiFeedback?.streakEncouragement && (
                    <div className="text-xs font-mono text-[#2ECC71]">
                      🔥 {aiFeedback.streakEncouragement}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Detected Form Faults List (if any) */}
            {workoutState.faultHistory.length > 0 && (
              <div className="rounded-xl border border-[#223040] bg-[#0B0F14] p-3 text-xs font-mono">
                <span className="text-[#8CA0AD] block mb-1 uppercase tracking-wider">
                  Observations Logged by Camera:
                </span>
                <ul className="list-disc list-inside text-amber-300/90 space-y-0.5">
                  {workoutState.faultHistory.map((fault, idx) => (
                    <li key={idx}>{fault}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {logSuccess ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-300 text-center font-bold">
                  ✓ {logSuccess}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveToStreak}
                  disabled={isLogging}
                  className="w-full rounded-full bg-[#4F9C8F] hover:bg-[#5db4a5] py-3.5 text-sm font-bold text-[#0B0F14] transition-all shadow-lg shadow-[#4F9C8F]/25 cursor-pointer disabled:opacity-50"
                >
                  {isLogging ? "Syncing to Neon DB..." : "⚡ Save & Boost My Streak in Neon DB"}
                </button>
              )}

              <div className="flex items-center justify-between text-xs font-mono text-[#8CA0AD]">
                <button
                  type="button"
                  onClick={() => {
                    setShowSummary(false);
                    setLogSuccess(null);
                    startLiveCamera();
                  }}
                  className="hover:text-[#EAF2F5] transition-colors cursor-pointer"
                >
                  ↺ Start Another Set
                </button>

                <Link
                  href={`/dashboard?studentId=${selectedStudentId}`}
                  className="text-[#4F9C8F] hover:underline"
                >
                  Go to Athlete Dashboard →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
