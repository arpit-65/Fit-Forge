import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllStudentsSummary, getStudentDashboardData } from "@/lib/queries";
import StudentSwitcher from "@/components/dashboard/StudentSwitcher";
import WorkoutLogModal from "@/components/dashboard/WorkoutLogModal";
import RecomputeRiskButton from "@/components/dashboard/RecomputeRiskButton";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: {
    studentId?: string;
    email?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    userEmail = authUser?.email ?? null;
  } catch {
    // Supabase auth fallback
  }

  // 1. Fetch all students for the switcher via centralized queries.ts
  const allStudentsSummary = await getAllStudentsSummary();

  // 2. Determine target student via centralized queries.ts
  const requestedId = searchParams?.studentId;
  const requestedEmail = searchParams?.email || userEmail;

  const student = await getStudentDashboardData({
    studentId: requestedId,
    email: requestedEmail || undefined,
  });

  const latestRisk = student?.riskScores[0];
  const squad = student?.squad;
  const league = student?.league;
  const activeIntervention = student?.interventions.find((i) => i.resolvedAt === null);
  const totalPoints = student?.totalPoints ?? 0;

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] selection:bg-[#4F9C8F] selection:text-[#0B0F14]">
      {/* Top Header */}
      <div className="border-b border-[#223040] bg-[#101720]/80 backdrop-blur-md sticky top-16 z-30">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#131A22] border border-[#223040] text-[11px] font-mono text-[#8CA0AD] mb-2">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-ping" />
                <span>STUDENT FITNESS & STREAK TRACKING • NEON DB</span>
              </div>
              <h1 className="text-3xl font-bold font-display text-[#EAF2F5]">
                {student?.name || "Student"} — Fitness & Streak Tracking
              </h1>
              <p className="text-xs sm:text-sm text-[#8CA0AD] font-mono mt-0.5">
                {student?.college?.name} · Roll: {student?.rollNo} · Dept: {student?.department} · Year {student?.year}
              </p>
            </div>

            {/* Interactive Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/workout${student ? `?studentId=${student.id}` : ""}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent)]/40 bg-[var(--ff-accent)]/15 hover:bg-[var(--ff-accent)]/25 px-5 py-2.5 text-xs font-bold font-mono text-[var(--ff-accent)] transition-all shadow-lg shadow-[var(--ff-accent)]/10 hover:scale-[1.02]"
              >
                <span>📷 AI Camera Studio</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--ff-accent)] text-[#0B0F14] font-bold">
                  LIVE
                </span>
              </Link>
              <RecomputeRiskButton />
              {student && (
                <WorkoutLogModal userId={student.id} studentName={student.name} />
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Student Switcher: tap any persona to see their real database metrics */}
        {student && (
          <StudentSwitcher
            currentStudentId={student.id}
            allStudents={allStudentsSummary}
          />
        )}

        {/* Active Intervention Alert Banner if student is at risk */}
        {activeIntervention && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-5 sm:p-6 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg shrink-0">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                    Active Habit Intervention: {activeIntervention.type.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-mono text-[#8CA0AD]">
                    Fired {new Date(activeIntervention.firedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[#EAF2F5] mt-1 font-medium italic">
                  &ldquo;{activeIntervention.message}&rdquo;
                </p>
              </div>
            </div>

            {student && (
              <div className="shrink-0">
                <WorkoutLogModal userId={student.id} studentName={student.name} />
              </div>
            )}
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak */}
          <div className="rounded-2xl border border-[#223040] bg-[#131A22]/90 p-5 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#8CA0AD] block mb-1">🔥 ACTIVE STREAK TRACKING</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-[#FFD166]">
                  {student?.streak?.currentStreak ?? 0}
                </span>
                <span className="text-xs font-mono text-[#8CA0AD]">days active</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#8CA0AD] mt-3 block pt-2 border-t border-[#223040]">
              Personal Best: {student?.streak?.longestStreak ?? 0} days
            </span>
          </div>

          {/* Risk Score */}
          <div className="rounded-2xl border border-[#223040] bg-[#131A22]/90 p-5 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#8CA0AD] block mb-1">DROPOUT RISK TIER</span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-black font-mono ${
                    (latestRisk?.score ?? 0) >= 0.6
                      ? "text-[#E5484D]"
                      : (latestRisk?.score ?? 0) >= 0.3
                      ? "text-[#F5A623]"
                      : "text-[#2ECC71]"
                  }`}
                >
                  {latestRisk?.score !== null && latestRisk?.score !== undefined
                    ? `${(latestRisk.score * 100).toFixed(0)}%`
                    : "Bootstrap"}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    latestRisk?.band === "HIGH"
                      ? "bg-red-500/10 text-red-400 border border-red-500/30"
                      : latestRisk?.band === "MID"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {latestRisk?.band ?? "DAY 1-7"}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#8CA0AD] mt-3 block pt-2 border-t border-[#223040] line-clamp-1">
              Factor: {latestRisk?.topReason || "Consistent engagement"}
            </span>
          </div>

          {/* Squad */}
          <div className="rounded-2xl border border-[#223040] bg-[#131A22]/90 p-5 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#8CA0AD] block mb-1">ASSIGNED SQUAD</span>
              <span className="text-xl font-bold text-[#4F9C8F] block truncate">
                {squad?.name || "Campus Striders"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8CA0AD] mt-3 pt-2 border-t border-[#223040]">
              <span>Max size: 10</span>
              <Link href="/squads" className="text-[#4F9C8F] hover:underline font-bold">
                View Squad →
              </Link>
            </div>
          </div>

          {/* League Tier */}
          <div className="rounded-2xl border border-[#223040] bg-[#131A22]/90 p-5 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-[#8CA0AD] block mb-1">CAMPUS LEAGUE</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-amber-400">
                  {league?.tier ?? "Bronze"}
                </span>
                <span className="text-xs font-mono text-[#8CA0AD]">
                  {totalPoints} pts
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#8CA0AD] mt-3 block pt-2 border-t border-[#223040]">
              Division Rank: #{league?.rank ?? 1}
            </span>
          </div>
        </div>

        {/* Two-Column Grid: Workouts & Interventions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Workouts List */}
          <div className="lg:col-span-8 rounded-3xl border border-[#223040] bg-[#131A22]/90 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-[#EAF2F5]">
                  Workout Sessions Synchronized
                </h2>
                <p className="text-xs text-[#8CA0AD] font-mono mt-0.5">
                  Real-time database entries driving deterministic risk telemetry
                </p>
              </div>
              {student && (
                <WorkoutLogModal userId={student.id} studentName={student.name} />
              )}
            </div>

            {student?.activities && student.activities.length > 0 ? (
              <div className="divide-y divide-[#223040]">
                {student.activities.map((act) => (
                  <div key={act.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#4F9C8F]/10 border border-[#4F9C8F]/30 flex items-center justify-center text-xs font-bold font-mono text-[#4F9C8F] uppercase">
                        {act.type.slice(0, 3)}
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-[#EAF2F5] block capitalize">
                          {act.type} Session
                        </span>
                        <div className="flex items-center gap-2 text-xs text-[#8CA0AD] font-mono">
                          <span>
                            {new Date(act.date).toLocaleDateString("en-IN", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {act.notes && (
                            <>
                              <span>·</span>
                              <span className="italic text-[#8CA0AD]/80 line-clamp-1">{act.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-sm font-bold text-[#4F9C8F]">
                        +{act.durationMinutes} min
                      </span>
                      <span className="text-[11px] text-[#2ECC71] block">+10 pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-[#0B0F14] border border-[#223040] space-y-3">
                <span className="text-3xl block">🏋️‍♂️</span>
                <p className="text-xs font-mono text-[#8CA0AD]">
                  No workouts recorded yet for this student.
                </p>
                {student && (
                  <WorkoutLogModal userId={student.id} studentName={student.name} />
                )}
              </div>
            )}
          </div>

          {/* Risk History & Interventions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Risk History Card */}
            <div className="rounded-3xl border border-[#223040] bg-[#131A22]/90 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold font-display text-[#EAF2F5]">
                Risk Score Telemetry
              </h3>
              <p className="text-xs text-[#8CA0AD]">
                Historic risk calculations evaluated against the 14-day trailing activity window.
              </p>

              <div className="space-y-3">
                {student?.riskScores && student.riskScores.length > 0 ? (
                  student.riskScores.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-[#0B0F14] border border-[#223040] flex items-center justify-between font-mono text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              r.band === "HIGH"
                                ? "text-red-400"
                                : r.band === "MID"
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {(r.score * 100).toFixed(0)}% ({r.band})
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8CA0AD] block line-clamp-1 mt-0.5">
                          {r.topReason}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8CA0AD]">
                        {new Date(r.computedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-[#0B0F14] border border-[#223040] text-xs font-mono text-[#4F9C8F]">
                    Student in bootstrap onboarding. Algorithmic scoring begins after Day 7.
                  </div>
                )}
              </div>
            </div>

            {/* Interventions Log */}
            <div className="rounded-3xl border border-[#223040] bg-[#131A22]/90 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold font-display text-[#EAF2F5]">
                Intervention Ladder Log
              </h3>
              <div className="space-y-2.5">
                {student?.interventions && student.interventions.length > 0 ? (
                  student.interventions.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-[#0B0F14] border border-[#223040] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-[#4F9C8F] font-bold">
                          {inv.type.replace("_", " ")}
                        </span>
                        <span
                          className={
                            inv.resolvedAt ? "text-emerald-400" : "text-amber-400"
                          }
                        >
                          {inv.resolvedAt ? "✓ Resolved" : "● Active"}
                        </span>
                      </div>
                      <p className="text-[#EAF2F5] text-[11px] leading-relaxed italic">
                        &ldquo;{inv.message}&rdquo;
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-[#8CA0AD]">
                    No interventions triggered. Student habits are healthy and consistent!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
