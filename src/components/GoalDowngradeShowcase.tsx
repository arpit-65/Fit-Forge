"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { m, useInView } from "framer-motion";

export interface GoalDowngradeData {
  student?: string;
  college?: string;
  originalGoalMinutes?: number;
  downgradedGoalMinutes?: number;
  originalRiskScore?: number;
  targetRiskScore?: number;
  currentRiskScore?: number;
  topReason?: string;
  formula?: string;
  rule?: string;
  intervention?: {
    id?: string;
    type?: string;
    message?: string;
    firedAt?: string | Date;
  };
  challengeTitle?: string;
}

export interface GoalDowngradeShowcaseProps {
  data?: GoalDowngradeData | null;
  className?: string;
}

export default function GoalDowngradeShowcase({
  data,
  className = "",
}: GoalDowngradeShowcaseProps) {
  const currentData = data ?? {
    student: "Apoorav Mehta",
    college: "Roorkee Institute of Technology",
    originalGoalMinutes: 30,
    downgradedGoalMinutes: 10,
    originalRiskScore: 0.71,
    targetRiskScore: 0.24,
    currentRiskScore: 0.71,
    topReason: "Missed 4 consecutive challenges",
    formula: "max(10, Math.round(target / 3))",
    rule: "HIGH Risk triggers automatic goal downgrade to reduce friction",
    intervention: {
      type: "GOAL_DOWNGRADE",
      message:
        "Goal requirement eased to reduce friction and encourage workout resumption.",
      firedAt: new Date().toISOString(),
    },
    challengeTitle: "30-Day Campus Consistency Sprint",
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });

  // Baseline values
  const origMinutes = currentData.originalGoalMinutes ?? 30;
  const targetMinutes = currentData.downgradedGoalMinutes ?? 10;
  const origRisk = currentData.originalRiskScore ?? 0.72;
  const targetRisk = currentData.targetRiskScore ?? 0.24;

  // Animated states for the interactive transformation bridge
  const [baseMinutes, setBaseMinutes] = useState<number>(origMinutes);
  const [animatedMinutes, setAnimatedMinutes] = useState<number>(origMinutes);
  const [animatedRisk, setAnimatedRisk] = useState<number>(origRisk);
  const [transitionProgress, setTransitionProgress] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const runSimulation = useCallback(
    (startMins: number) => {
      setIsSimulating(true);
      const calculatedTarget = Math.max(10, Math.round(startMins / 3));
      let startTime: number | null = null;
      const duration = 1500;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const t = Math.min(1, elapsed / duration);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        setTransitionProgress(ease);
        setAnimatedMinutes(Math.round(startMins - ease * (startMins - calculatedTarget)));
        setAnimatedRisk(Number((origRisk - ease * (origRisk - targetRisk)).toFixed(2)));

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          setIsSimulating(false);
          setHasAnimated(true);
        }
      };

      requestAnimationFrame(step);
    },
    [origRisk, targetRisk]
  );

  const resetSimulation = () => {
    setTransitionProgress(0);
    setAnimatedMinutes(baseMinutes);
    setAnimatedRisk(origRisk);
    setHasAnimated(false);
  };

  useEffect(() => {
    if (!isInView || hasAnimated) return;
    runSimulation(origMinutes);
  }, [isInView, hasAnimated, origMinutes, runSimulation]);

  return (
    <section
      id="goal-downgrade"
      ref={containerRef}
      className={`relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0B0F14] via-[#0e141c] to-[#0B0F14] overflow-hidden ${className}`}
      aria-label="Core Mechanic: Automatic Goal Downgrade Showcase"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-red-950/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0B0F14]/70 to-[#0B0F14]" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131A22] border border-[#223040] shadow-sm mb-5"
          >
            <span className="w-2 h-2 rounded-full bg-[#E5484D] animate-ping" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#8CA0AD]">
              THE RETENTION MECHANIC • ZERO GUILT
            </span>
          </m.div>

          <m.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#EAF2F5] font-display mb-6"
          >
            When Habit Resistance Spikes, The Target Collapses
          </m.h2>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#8CA0AD] leading-relaxed"
          >
            Every other fitness tracker shames students with broken streaks when exam season or fatigue hits.
            FitForge deterministically lowers the threshold before dropout happens.
          </m.p>
        </div>

        {/* ─── THE MAIN BEFORE / AFTER PANEL (MOST WEIGHT ON PAGE) ─── */}
        <m.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-3xl border border-[#223040] bg-[#10161E]/90 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Top Panel Meta Header */}
          <div className="border-b border-[#223040]/70 bg-[#0B0F14]/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-xs font-mono text-red-400 font-bold">
                GD
              </div>
              <div>
                <span className="text-xs font-mono tracking-wider uppercase text-[#8CA0AD]">
                  Real Intervention Record • Neon DB
                </span>
                <p className="text-sm font-semibold text-[#EAF2F5]">
                  {currentData.student}{" "}
                  <span className="text-xs font-normal text-[#8CA0AD]">
                    ({currentData.college})
                  </span>
                </p>
              </div>
            </div>

            {/* Live Algorithm Rule Badge */}
            <div className="flex items-center gap-2 bg-[#131A22] border border-[#223040] px-3 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-[#8CA0AD]">Rule:</span>
              <span className="text-[#4F9C8F] font-medium">
                {currentData.formula}
              </span>
            </div>
          </div>

          {/* Split Before / After Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 relative min-h-[480px]">
            {/* ── LEFT: BEFORE INTERVENTION (HEAVY, DARK, RED GLOW, TIGHT) ── */}
            <div
              id="before-downgrade-panel"
              className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between relative bg-gradient-to-br from-[#1a0f12] via-[#140b0d] to-[#0d0708] border-b lg:border-b-0 lg:border-r border-red-950/60 shadow-[inset_0_0_80px_rgba(229,72,77,0.15)] transition-all duration-700"
            >
              {/* Internal intense red glow and tight border */}
              <div className="absolute inset-0 pointer-events-none border-2 border-red-500/20 rounded-t-3xl lg:rounded-tr-none lg:rounded-l-3xl shadow-[0_0_40px_rgba(229,72,77,0.12)]" />

              <div>
                {/* Header state */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono font-semibold tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    BEFORE: CRITICAL FRICTION
                  </span>
                  <span className="text-xs font-mono text-red-400/80 uppercase">
                    Status: At-Risk
                  </span>
                </div>

                {/* Persona & Problem Statement */}
                <h3 className="text-xl sm:text-2xl font-bold text-red-50 tracking-tight mb-2">
                  Heavy 30-Minute Daily Target
                </h3>
                <p className="text-xs sm:text-sm text-red-200/60 leading-relaxed mb-8">
                  {currentData.topReason || "Missed 4 consecutive challenges"}.
                  High psychological friction causes repeated avoidance loops.
                </p>

                {/* The "Heavy" Goal Visual */}
                <div className="my-4 p-6 sm:p-8 rounded-2xl bg-[#090506]/90 border border-red-900/40 relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-red-400/70 font-semibold">
                      Required Workout Load
                    </span>
                    <span className="text-xs font-mono text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/40">
                      Unattainable
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tighter text-red-400 drop-shadow-[0_0_25px_rgba(229,72,77,0.5)]">
                      {origMinutes}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-red-300/80">
                      min/day
                    </span>
                  </div>

                  {/* Visual Weight Bar: Heavy / Full load */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-mono text-red-300/70">
                      <span>Habit Barrier Weight</span>
                      <span className="text-red-400 font-bold">100% (High Friction)</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-red-950/90 border border-red-800/30 overflow-hidden p-0.5">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_12px_rgba(229,72,77,0.8)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric Card: High Risk 0.72 */}
              <div className="mt-6 pt-5 border-t border-red-900/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-red-400/60 block">
                    Calculated Dropout Risk
                  </span>
                  <span className="text-2xl font-mono font-black text-red-400">
                    {origRisk.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-red-400/60 block">
                    Predicted Outcome
                  </span>
                  <span className="text-xs font-medium text-red-300">
                    Probable Abandonment in 48h
                  </span>
                </div>
              </div>
            </div>

            {/* ── CENTER ADAPTIVE ENGINE CONDUIT BADGE ── */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex-col items-center pointer-events-none">
              <m.div
                animate={{
                  scale: [1, 1.06, 1],
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-[#131A22] border-2 border-[#4F9C8F] flex items-center justify-center shadow-2xl"
              >
                <svg
                  className="w-8 h-8 text-[#4F9C8F] animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </m.div>
              <div className="mt-2 px-2.5 py-1 rounded bg-[#0B0F14] border border-[#223040] text-[10px] font-mono uppercase tracking-widest text-[#8CA0AD] shadow-md whitespace-nowrap">
                Engine Auto-Shift
              </div>
            </div>

            {/* ── RIGHT: AFTER INTERVENTION (LIGHT, GREEN, AIRY, OPEN SPACE) ── */}
            <div
              id="after-downgrade-panel"
              className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between relative bg-gradient-to-br from-[#0a1a14] via-[#091510] to-[#07100c] shadow-[inset_0_0_90px_rgba(46,204,113,0.12)] transition-all duration-700"
            >
              {/* Soft airy green ambient border */}
              <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/20 rounded-b-3xl lg:rounded-bl-none lg:rounded-r-3xl shadow-[0_0_40px_rgba(46,204,113,0.1)]" />

              <div>
                {/* Header state */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    AFTER: FRICTION COLLAPSED
                  </span>
                  <span className="text-xs font-mono text-emerald-400 uppercase">
                    Status: Restoring Momentum
                  </span>
                </div>

                {/* Persona & Solution Statement */}
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-50 tracking-tight mb-2">
                  Airy 10-Minute Micro Target
                </h3>
                <p className="text-xs sm:text-sm text-emerald-200/60 leading-relaxed mb-8">
                  Goal auto-downgraded by 67%. The barrier to entry is so small that
                  starting takes zero willpower.
                </p>

                {/* The "Light" Goal Visual */}
                <div className="my-4 p-6 sm:p-8 rounded-2xl bg-[#06140e]/90 border border-emerald-800/40 relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-400/70 font-semibold">
                      Adjusted Workout Load
                    </span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/40">
                      Friction-Free
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tighter text-emerald-400 drop-shadow-[0_0_25px_rgba(46,204,113,0.4)]">
                      {targetMinutes}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-300/80">
                      min/day
                    </span>
                  </div>

                  {/* Visual Weight Bar: Light / 33% Load */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-mono text-emerald-300/70">
                      <span>Habit Barrier Weight</span>
                      <span className="text-emerald-400 font-bold">33% (Easily Doable)</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-emerald-950/90 border border-emerald-800/30 overflow-hidden p-0.5">
                      <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(46,204,113,0.8)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric Card: Risk Trending Down to 0.24 */}
              <div className="mt-6 pt-5 border-t border-emerald-900/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/60 block">
                    Target Risk Trajectory
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {targetRisk.toFixed(2)}{" "}
                    <span className="text-xs font-normal text-emerald-300/80">
                      (trending down)
                    </span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/60 block">
                    Intervention Fired
                  </span>
                  <span className="text-xs font-medium text-emerald-300">
                    Goal Downgrade Applied
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── INTERACTIVE LIVE TRANSITION BAR (ANIMATES WHILE IN VIEW) ─── */}
          <div className="border-t border-[#223040] bg-[#0c1219] p-6 sm:p-8">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="w-full md:w-auto text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#8CA0AD]">
                    Live Transition Simulation
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#131A22] border border-[#223040] text-[#4F9C8F]">
                    whileInView
                  </span>
                </div>
                <p className="text-xs text-[#8CA0AD]">
                  Deterministic recalculation upon risk breach
                </p>
              </div>

              {/* Dynamic Animated Counter Display */}
              <div className="flex items-center gap-6 sm:gap-10">
                {/* Dynamic Goal Number (30 -> 10) */}
                <div className="text-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8CA0AD] block mb-1">
                    Daily Goal
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span
                      className="text-3xl sm:text-4xl font-mono font-black transition-colors duration-300"
                      style={{
                        color:
                          transitionProgress > 0.6
                            ? "#2ECC71"
                            : transitionProgress > 0.3
                            ? "#F5A623"
                            : "#E5484D",
                      }}
                    >
                      {animatedMinutes}
                    </span>
                    <span className="text-xs font-mono text-[#8CA0AD]">min</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-[#8CA0AD] font-mono text-lg">→</div>

                {/* Dynamic Risk Number (0.72 -> 0.24) */}
                <div className="text-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8CA0AD] block mb-1">
                    Risk Score
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span
                      className="text-3xl sm:text-4xl font-mono font-black transition-colors duration-300"
                      style={{
                        color:
                          transitionProgress > 0.6
                            ? "#2ECC71"
                            : transitionProgress > 0.3
                            ? "#F5A623"
                            : "#E5484D",
                      }}
                    >
                      {animatedRisk.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-[#8CA0AD]">/1.0</span>
                  </div>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full md:w-48 flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-mono text-[#8CA0AD]">
                  <span>Friction Eased</span>
                  <span className="text-[#4F9C8F]">
                    {Math.round(transitionProgress * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#131A22] border border-[#223040] overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-[#E5484D] via-[#F5A623] to-[#2ECC71]"
                    style={{ width: `${Math.max(5, transitionProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Tap Controls */}
            <div className="mt-5 pt-4 border-t border-[#223040] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#8CA0AD]">Test Load:</span>
                {[30, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setBaseMinutes(m);
                      setAnimatedMinutes(m);
                      setTransitionProgress(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      baseMinutes === m
                        ? "bg-[#4F9C8F] text-[#0B0F14] border-[#4F9C8F] font-bold"
                        : "bg-[#0B0F14] border-[#223040] text-[#8CA0AD] hover:text-[#EAF2F5]"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => runSimulation(baseMinutes)}
                  className="rounded-xl bg-[#4F9C8F] hover:bg-[#5db4a5] disabled:opacity-50 text-[#0B0F14] font-bold px-4 py-2 transition-all shadow-md shadow-[#4F9C8F]/20 cursor-pointer"
                >
                  {isSimulating ? "Collapsing friction..." : "⚡ Tap to Trigger Goal Downgrade"}
                </button>
                <button
                  type="button"
                  onClick={resetSimulation}
                  className="rounded-xl border border-[#223040] bg-[#0B0F14] hover:bg-[#131A22] text-[#8CA0AD] hover:text-[#EAF2F5] px-3 py-2 transition-all cursor-pointer"
                >
                  ↺ Reset
                </button>
              </div>
            </div>
          </div>
        </m.div>

        {/* ─── MANDATORY SIGNATURE CALLOUT UNDER PANEL ─── */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="inline-block relative">
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-[#EAF2F5] tracking-tight">
              &ldquo;When risk goes up, we make the goal smaller.&rdquo;
            </p>
            {/* Subtle glow underline */}
            <div className="h-1 w-full mt-3 bg-gradient-to-r from-transparent via-[#4F9C8F] to-transparent rounded-full opacity-80" />
          </div>

          <p className="mt-4 text-xs sm:text-sm font-mono text-[#8CA0AD] max-w-xl mx-auto">
            Zero workout days are prevented not by guilt, but by making showing up
            frictionless. Habit momentum is preserved at all costs.
          </p>
        </m.div>
      </div>
    </section>
  );
}
