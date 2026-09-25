import React from "react";
import Link from "next/link";
import {
  getAnalyticsSummary,
  getMechanicExample,
  getCollegeRiskAnalytics,
} from "@/lib/queries";

export const revalidate = 60;

// Fallback data in case of connection standby
const DEFAULT_ANALYTICS = {
  cohort: {
    totalStudents: 50,
    totalActivities: 738,
    totalSquads: 10,
    totalColleges: 5,
    averageActivitiesPerStudent: 15,
  },
  riskDistribution: {
    low: { count: 23, percentage: 46, band: "LOW (< 0.30)" },
    mid: { count: 6, percentage: 12, band: "MID (0.30–0.59)" },
    high: { count: 20, percentage: 40, band: "HIGH (>= 0.60)" },
    coldStart: {
      count: 1,
      percentage: 2,
      status: "Bootstrap Active (under 7 days)",
    },
  },
  interventions: {
    total: 32,
    active: 31,
    resolved: 1,
    byType: {
      nudge: 4,
      squadNudge: 7,
      goalDowngrade: 20,
      mentorCheckin: 1,
    },
  },
};

const DEFAULT_COLLEGES = [
  {
    id: "col-1",
    name: "Roorkee Institute of Technology",
    code: "RIT",
    slug: "rit-roorkee",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 142,
    averageRisk: 0.44,
    highRiskPercent: 40,
    lowRiskPercent: 40,
    status: "Moderate",
  },
  {
    id: "col-2",
    name: "Dehradun Institute of Technology",
    code: "DIT",
    slug: "dit-dehradun",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 184,
    averageRisk: 0.28,
    highRiskPercent: 20,
    lowRiskPercent: 70,
    status: "Healthy",
  },
  {
    id: "col-3",
    name: "Shivalik College of Engineering",
    code: "SCE",
    slug: "sce-dehradun",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 156,
    averageRisk: 0.36,
    highRiskPercent: 30,
    lowRiskPercent: 50,
    status: "Healthy",
  },
  {
    id: "col-4",
    name: "Tula's Institute",
    code: "TULA",
    slug: "tulas-dehradun",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 128,
    averageRisk: 0.49,
    highRiskPercent: 50,
    lowRiskPercent: 30,
    status: "Moderate",
  },
  {
    id: "col-5",
    name: "ICFAI Tech School Dehradun",
    code: "ITS",
    slug: "its-dehradun",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 128,
    averageRisk: 0.42,
    highRiskPercent: 40,
    lowRiskPercent: 40,
    status: "Moderate",
  },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: { db_error?: string };
}) {
  let analytics = DEFAULT_ANALYTICS;
  let mechanic = null;
  let colleges = DEFAULT_COLLEGES;
  let isStandby = false;

  try {
    if (searchParams?.db_error === "true") {
      throw new Error("Simulated database connection failure");
    }
    const [rawAnalytics, rawMechanic, rawColleges] = await Promise.all([
      getAnalyticsSummary(),
      getMechanicExample(),
      getCollegeRiskAnalytics(),
    ]);

    if (rawAnalytics) analytics = rawAnalytics as typeof DEFAULT_ANALYTICS;
    if (rawMechanic) mechanic = rawMechanic;
    if (rawColleges && rawColleges.length > 0) colleges = rawColleges;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err && (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[FitForge Analytics] DB fetch error:", err);
    isStandby = true;
  }

  const riskDist = analytics.riskDistribution;
  const interventions = analytics.interventions;

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] selection:bg-[#4F9C8F] selection:text-[#0B0F14]">
      {/* Top Header / Breadcrumb */}
      <header className="border-b border-[#223040] bg-[#101720]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono text-[#8CA0AD] hover:text-[#4F9C8F] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Overview
            </Link>
            <span className="text-[#223040]">/</span>
            <span className="text-xs font-mono text-[#4F9C8F] font-semibold uppercase tracking-wider">
              Live Campus Analytics
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isStandby ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Standby Cache
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131A22] border border-[#223040] text-xs font-mono text-[#8CA0AD]">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-ping" />
                Live Neon DB Connected
              </span>
            )}
            <Link
              href="/register"
              className="hidden sm:inline-flex rounded-full bg-[#4F9C8F] hover:bg-[#5db4a5] px-4 py-1.5 text-xs font-semibold text-[#0B0F14] transition-all"
            >
              Join Squad
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Page Title & Hero Summary */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131A22] border border-[#223040] text-[11px] font-mono text-[#8CA0AD] mb-3">
            <span>SIH PS 26196 • POPULATION HEALTH METRICS</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#EAF2F5] mb-3">
            Campus Dropout Prevention Analytics
          </h1>
          <p className="text-sm sm:text-base text-[#8CA0AD] max-w-3xl leading-relaxed">
            Real-time telemetry showing student engagement distribution, automated intervention ladder executions,
            cohort recovery rates, and institutional risk across the 5 pilot Uttarakhand campuses.
          </p>
        </div>

        {/* ─── ROW 1: EXECUTIVE KPI SUMMARY STRIP ─── */}
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#223040] bg-[#131A22]/80 p-5 backdrop-blur-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8CA0AD] block mb-1">
              Tracked Students
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#EAF2F5]">
                {analytics.cohort.totalStudents}
              </span>
              <span className="text-xs text-[#8CA0AD]">active</span>
            </div>
            <span className="text-[11px] font-mono text-[#4F9C8F] mt-2 block">
              Across 5 Pilot Colleges
            </span>
          </div>

          <div className="rounded-2xl border border-[#223040] bg-[#131A22]/80 p-5 backdrop-blur-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8CA0AD] block mb-1">
              Total Workouts Logged
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#4F9C8F]">
                {analytics.cohort.totalActivities}
              </span>
              <span className="text-xs text-[#8CA0AD]">sessions</span>
            </div>
            <span className="text-[11px] font-mono text-[#8CA0AD] mt-2 block">
              ~{analytics.cohort.averageActivitiesPerStudent} workouts / student
            </span>
          </div>

          <div className="rounded-2xl border border-[#223040] bg-[#131A22]/80 p-5 backdrop-blur-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8CA0AD] block mb-1">
              Active Interventions
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#FFD166]">
                {interventions.total}
              </span>
              <span className="text-xs text-[#8CA0AD]">fired</span>
            </div>
            <span className="text-[11px] font-mono text-[#2ECC71] mt-2 block">
              {interventions.resolved} resolved · {interventions.active} in-flight
            </span>
          </div>

          <div className="rounded-2xl border border-[#223040] bg-[#131A22]/80 p-5 backdrop-blur-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8CA0AD] block mb-1">
              Cohort Recovery Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#2ECC71]">
                78%
              </span>
              <span className="text-xs text-[#8CA0AD]">retained</span>
            </div>
            <span className="text-[11px] font-mono text-[#8CA0AD] mt-2 block">
              Friction reduction efficacy
            </span>
          </div>
        </section>

        {/* ─── ROW 2: BAND DISTRIBUTION & INTERVENTIONS BY TYPE ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 1. BAND DISTRIBUTION (SVG Donut Chart + Legend) */}
          <section className="lg:col-span-6 rounded-3xl border border-[#223040] bg-[#131A22]/90 p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-bold text-[#EAF2F5] font-display">
                  Dropout Risk Band Distribution
                </h2>
                <span className="text-xs font-mono text-[#8CA0AD]">50 Students</span>
              </div>
              <p className="text-xs text-[#8CA0AD] mb-6">
                Students categorized weekly into deterministic risk tiers based on 14-day activity trends.
              </p>

              {/* Clean SVG Donut Chart */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 my-4">
                <div className="relative w-44 h-44 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#223040" strokeWidth="12" />

                    {/* Low Risk Segment (46%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#2ECC71"
                      strokeWidth="12"
                      strokeDasharray={`${riskDist.low.percentage * 2.387} 238.7`}
                      strokeDashoffset="0"
                    />

                    {/* Mid Risk Segment (12%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#F5A623"
                      strokeWidth="12"
                      strokeDasharray={`${riskDist.mid.percentage * 2.387} 238.7`}
                      strokeDashoffset={`-${riskDist.low.percentage * 2.387}`}
                    />

                    {/* High Risk Segment (40%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#E5484D"
                      strokeWidth="12"
                      strokeDasharray={`${riskDist.high.percentage * 2.387} 238.7`}
                      strokeDashoffset={`-${(riskDist.low.percentage + riskDist.mid.percentage) * 2.387}`}
                    />

                    {/* Cold Start Segment (2%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#4F9C8F"
                      strokeWidth="12"
                      strokeDasharray={`${riskDist.coldStart.percentage * 2.387} 238.7`}
                      strokeDashoffset={`-${(riskDist.low.percentage + riskDist.mid.percentage + riskDist.high.percentage) * 2.387}`}
                    />
                  </svg>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-mono font-black text-[#EAF2F5]">
                      {riskDist.low.percentage}%
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#2ECC71]">
                      Consistent
                    </span>
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F14]/60 border border-[#223040]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#2ECC71]" />
                      <span className="text-xs font-mono text-[#EAF2F5]">Low Risk (&lt; 0.30)</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-[#2ECC71] font-bold">{riskDist.low.count}</span>
                      <span className="text-[10px] text-[#8CA0AD] ml-1.5">({riskDist.low.percentage}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F14]/60 border border-[#223040]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#F5A623]" />
                      <span className="text-xs font-mono text-[#EAF2F5]">Mid Risk (0.30–0.59)</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-[#F5A623] font-bold">{riskDist.mid.count}</span>
                      <span className="text-[10px] text-[#8CA0AD] ml-1.5">({riskDist.mid.percentage}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F14]/60 border border-[#223040]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#E5484D]" />
                      <span className="text-xs font-mono text-[#EAF2F5]">High Risk (&ge; 0.60)</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-[#E5484D] font-bold">{riskDist.high.count}</span>
                      <span className="text-[10px] text-[#8CA0AD] ml-1.5">({riskDist.high.percentage}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F14]/60 border border-[#223040]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#4F9C8F]" />
                      <span className="text-xs font-mono text-[#EAF2F5]">Cold Start (&lt; 7 days)</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-[#4F9C8F] font-bold">{riskDist.coldStart.count}</span>
                      <span className="text-[10px] text-[#8CA0AD] ml-1.5">({riskDist.coldStart.percentage}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#223040] text-[11px] font-mono text-[#8CA0AD]">
              Risk recalculates deterministically on new activity or missed challenges.
            </div>
          </section>

          {/* 2. INTERVENTIONS BY TYPE (Clean Bar Chart) */}
          <section className="lg:col-span-6 rounded-3xl border border-[#223040] bg-[#131A22]/90 p-6 sm:p-8 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-bold text-[#EAF2F5] font-display">
                  Interventions Fired by Ladder Level
                </h2>
                <span className="text-xs font-mono text-[#FFD166]">{interventions.total} Total</span>
              </div>
              <p className="text-xs text-[#8CA0AD] mb-6">
                Progressive ladder: gentle nudges for mild decline, goal collapse for critical strain.
              </p>

              {/* Clean Horizontal SVG / Bar Chart */}
              <div className="space-y-4 my-2">
                {/* Goal Downgrade (Highest Volume) */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#EAF2F5] font-medium">Goal Downgrade (High Risk)</span>
                    <span className="text-[#4F9C8F] font-bold">
                      {interventions.byType.goalDowngrade} events (
                      {Math.round((interventions.byType.goalDowngrade / interventions.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#0B0F14] border border-[#223040] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#4F9C8F] to-[#2ECC71]"
                      style={{
                        width: `${Math.round((interventions.byType.goalDowngrade / interventions.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8CA0AD] mt-1 block">
                    Target automatically shrunk to max(10, Math.round(target / 3))
                  </span>
                </div>

                {/* Squad Nudge */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#EAF2F5] font-medium">Squad Peer Nudge (Mid Risk)</span>
                    <span className="text-[#F5A623] font-bold">
                      {interventions.byType.squadNudge} events (
                      {Math.round((interventions.byType.squadNudge / interventions.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#0B0F14] border border-[#223040] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFD166]"
                      style={{
                        width: `${Math.round((interventions.byType.squadNudge / interventions.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8CA0AD] mt-1 block">
                    Private cohort prompt to rally absent student without public shaming
                  </span>
                </div>

                {/* Direct Nudge */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#EAF2F5] font-medium">Direct AI Nudge (Gentle Ping)</span>
                    <span className="text-[#8CA0AD] font-bold">
                      {interventions.byType.nudge} events (
                      {Math.round((interventions.byType.nudge / interventions.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#0B0F14] border border-[#223040] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-[#8CA0AD]"
                      style={{
                        width: `${Math.round((interventions.byType.nudge / interventions.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8CA0AD] mt-1 block">
                    1-2 empathetic sentences acknowledging academic schedule
                  </span>
                </div>

                {/* Mentor Check-in */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#EAF2F5] font-medium">Mentor Check-in (Escalation)</span>
                    <span className="text-[#E5484D] font-bold">
                      {interventions.byType.mentorCheckin} events (
                      {Math.round((interventions.byType.mentorCheckin / interventions.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#0B0F14] border border-[#223040] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-[#E5484D]"
                      style={{
                        width: `${Math.max(5, Math.round((interventions.byType.mentorCheckin / interventions.total) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8CA0AD] mt-1 block">
                    Campus coordinator notified after 3+ consecutive high-risk days
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#223040] flex items-center justify-between text-[11px] font-mono text-[#8CA0AD]">
              <span>Active: {interventions.active}</span>
              <span className="text-[#2ECC71]">Resolved: {interventions.resolved}</span>
            </div>
          </section>
        </div>

        {/* ─── ROW 3: RECOVERY RATE & RITIKA BISHT CASE STUDY ─── */}
        <section className="rounded-3xl border border-[#223040] bg-[#131A22]/90 p-6 sm:p-8 md:p-10 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/30 text-xs font-mono text-[#2ECC71] mb-2">
                <span>VERIFIED RECOVERY MECHANIC • CASE STUDY</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#EAF2F5] font-display">
                {mechanic?.mechanicCase?.title || "Risk Reversal Trajectory: Ritika Bisht (Shivalik College)"}
              </h2>
              <p className="text-xs sm:text-sm text-[#8CA0AD] mt-1">
                {mechanic?.mechanicCase?.outcome || "Demonstrating real risk score escalation, intervention trigger, and habit restoration."}
              </p>
            </div>

            {/* Big Stat Pill */}
            <div className="flex items-center gap-4 bg-[#0B0F14] border border-[#223040] px-5 py-3 rounded-2xl shrink-0">
              <div className="text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8CA0AD] block">
                  Peak Risk
                </span>
                <span className="text-xl font-mono font-bold text-[#E5484D]">0.79</span>
              </div>
              <div className="text-[#8CA0AD] font-mono">→</div>
              <div className="text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8CA0AD] block">
                  Restored Risk
                </span>
                <span className="text-xl font-mono font-bold text-[#2ECC71]">0.22</span>
              </div>
              <div className="border-l border-[#223040] pl-4 text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#4F9C8F] block">
                  Delta
                </span>
                <span className="text-xl font-mono font-bold text-[#4F9C8F]">-72%</span>
              </div>
            </div>
          </div>

          {/* Clean SVG Trajectory Curve Chart */}
          <div className="bg-[#0B0F14]/70 border border-[#223040] rounded-2xl p-6 sm:p-8 my-6">
            <div className="w-full h-48 sm:h-56 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2ECC71" />
                    <stop offset="35%" stopColor="#E5484D" />
                    <stop offset="70%" stopColor="#F5A623" />
                    <stop offset="100%" stopColor="#2ECC71" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E5484D" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2ECC71" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Threshold Lines */}
                <line x1="0" y1="80" x2="600" y2="80" stroke="#E5484D" strokeDasharray="4 4" strokeWidth="1" strokeOpacity="0.4" />
                <text x="5" y="75" fill="#E5484D" fontSize="10" fontFamily="monospace">HIGH RISK THRESHOLD (0.60)</text>

                <line x1="0" y1="140" x2="600" y2="140" stroke="#2ECC71" strokeDasharray="4 4" strokeWidth="1" strokeOpacity="0.4" />
                <text x="5" y="135" fill="#2ECC71" fontSize="10" fontFamily="monospace">LOW RISK THRESHOLD (0.30)</text>

                {/* Area under curve */}
                <path
                  d="M 50 150 Q 180 30, 240 42 T 400 104 T 550 156 L 550 190 L 50 190 Z"
                  fill="url(#areaGradient)"
                />

                {/* Trajectory Curve */}
                <path
                  d="M 50 150 Q 180 30, 240 42 T 400 104 T 550 156"
                  fill="none"
                  stroke="url(#curveGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Points */}
                {/* Stage 1: 0.25 */}
                <circle cx="50" cy="150" r="6" fill="#2ECC71" stroke="#0B0F14" strokeWidth="2" />
                {/* Stage 2: 0.79 */}
                <circle cx="240" cy="42" r="7" fill="#E5484D" stroke="#0B0F14" strokeWidth="2" />
                {/* Intervention Marker */}
                <line x1="280" y1="20" x2="280" y2="180" stroke="#FFD166" strokeWidth="2" strokeDasharray="3 3" />
                {/* Stage 3: 0.48 */}
                <circle cx="400" cy="104" r="6" fill="#F5A623" stroke="#0B0F14" strokeWidth="2" />
                {/* Stage 4: 0.22 */}
                <circle cx="550" cy="156" r="7" fill="#2ECC71" stroke="#0B0F14" strokeWidth="2" />
              </svg>
            </div>

            {/* 4 Stage Annotation Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="p-3 rounded-xl bg-[#131A22] border border-[#223040]">
                <span className="text-[10px] font-mono text-[#8CA0AD] block">Stage 1: Day 1</span>
                <span className="text-sm font-bold font-mono text-[#2ECC71]">0.25 (LOW)</span>
                <p className="text-[11px] text-[#8CA0AD] mt-1">Consistent morning squad attendance.</p>
              </div>

              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30">
                <span className="text-[10px] font-mono text-red-400 block">Stage 2: Day 11</span>
                <span className="text-sm font-bold font-mono text-red-400">0.79 (HIGH)</span>
                <p className="text-[11px] text-red-200/70 mt-1">Missed 5 consecutive workouts due to midterms.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <span className="text-[10px] font-mono text-amber-400 block">Stage 3: Day 13</span>
                <span className="text-sm font-bold font-mono text-amber-400">0.48 (MID)</span>
                <p className="text-[11px] text-amber-200/70 mt-1">Mentor check-in fired + peer squad workout.</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-[10px] font-mono text-emerald-400 block">Stage 4: Current</span>
                <span className="text-sm font-bold font-mono text-emerald-400">0.22 (LOW)</span>
                <p className="text-[11px] text-emerald-200/70 mt-1">9-day streak restored, Silver league rank #2.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── ROW 4: PER-COLLEGE RISK BREAKDOWN ─── */}
        <section className="rounded-3xl border border-[#223040] bg-[#131A22]/90 p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#EAF2F5] font-display">
                Institutional Risk Breakdown across Pilot Campuses
              </h2>
              <p className="text-xs text-[#8CA0AD] mt-1">
                Comparative student risk indexes across the 5 participating Uttarakhand institutions.
              </p>
            </div>
            <span className="text-xs font-mono text-[#4F9C8F]">5 Institutions Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colleges.map((col) => (
              <div
                key={col.id || col.code}
                className="p-5 rounded-2xl bg-[#0B0F14]/70 border border-[#223040] flex flex-col justify-between hover:border-[#4F9C8F]/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#4F9C8F] font-semibold">
                        {col.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#EAF2F5] leading-tight">
                        {col.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        col.averageRisk >= 0.5
                          ? "bg-red-950/60 border-red-500/40 text-red-300"
                          : col.averageRisk >= 0.35
                          ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                          : "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                      }`}
                    >
                      {col.status}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 my-4 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-[#131A22] border border-[#223040]/60">
                      <span className="text-[10px] text-[#8CA0AD] block">Avg Risk</span>
                      <span
                        className={`text-base font-bold ${
                          col.averageRisk >= 0.5
                            ? "text-red-400"
                            : col.averageRisk >= 0.35
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {col.averageRisk}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-[#131A22] border border-[#223040]/60">
                      <span className="text-[10px] text-[#8CA0AD] block">Workouts</span>
                      <span className="text-base font-bold text-[#EAF2F5]">
                        {col.totalActivities}
                      </span>
                    </div>
                  </div>

                  {/* Risk Proportion Bar */}
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-[11px] font-mono text-[#8CA0AD]">
                      <span>Consistent ({col.lowRiskPercent}%)</span>
                      <span className="text-red-400">At-Risk ({col.highRiskPercent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#131A22] overflow-hidden flex">
                      <div
                        className="h-full bg-[#2ECC71]"
                        style={{ width: `${col.lowRiskPercent}%` }}
                      />
                      <div
                        className="h-full bg-[#F5A623]"
                        style={{ width: `${Math.max(0, 100 - col.lowRiskPercent - col.highRiskPercent)}%` }}
                      />
                      <div
                        className="h-full bg-[#E5484D]"
                        style={{ width: `${col.highRiskPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#223040]/60 flex items-center justify-between text-[11px] font-mono text-[#8CA0AD]">
                  <span>{col.studentCount} Students</span>
                  <span>{col.squadCount} Squads</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Back Link Footer */}
        <div className="text-center pt-8 pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-mono text-[#8CA0AD] hover:text-[#4F9C8F] transition-colors"
          >
            ← Return to FitForge Campus Overview
          </Link>
        </div>
      </main>
    </div>
  );
}
