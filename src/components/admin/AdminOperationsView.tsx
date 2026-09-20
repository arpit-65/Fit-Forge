"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface AdminStudentRow {
  id: string;
  name: string;
  email: string;
  rollNo: string | null;
  department: string | null;
  year: number | null;
  collegeName: string;
  collegeCode: string;
  squadName: string;
  streak: number;
  riskScore: number | null;
  riskBand: string;
  topReason: string;
  bootstrapActive: boolean;
  activityCount: number;
  activeIntervention: string | null;
}

interface AdminOperationsViewProps {
  students: AdminStudentRow[];
}

export default function AdminOperationsView({ students }: AdminOperationsViewProps) {
  const router = useRouter();
  const [selectedBand, setSelectedBand] = useState<string>("ALL");
  const [selectedCollege, setSelectedCollege] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [recomputing, setRecomputing] = useState(false);
  const [recomputeResult, setRecomputeResult] = useState<{
    totalUsersEvaluated: number;
    scoresUpdated: number;
    highRiskIdentified: number;
    interventionsTriggered: number;
  } | null>(null);

  const [nudgeModal, setNudgeModal] = useState<{
    studentName: string;
    message: string;
    provider: string;
  } | null>(null);
  const [nudgingStudentId, setNudgingStudentId] = useState<string | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (selectedBand !== "ALL") {
      if (selectedBand === "COLD-START" && !s.bootstrapActive && s.riskScore !== null) return false;
      if (selectedBand !== "COLD-START" && s.riskBand !== selectedBand) return false;
    }
    if (selectedCollege !== "ALL" && s.collegeCode !== selectedCollege) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleRecomputeAll = async () => {
    setRecomputing(true);
    setRecomputeResult(null);

    try {
      const res = await fetch("/api/admin/recompute", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Recomputation failed");

      setRecomputeResult(json.data);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Recomputation failed");
    } finally {
      setRecomputing(false);
    }
  };

  const handleGenerateNudge = async (student: AdminStudentRow) => {
    setNudgingStudentId(student.id);

    try {
      const res = await fetch("/api/ai/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: {
            name: student.name,
            squadName: student.squadName,
            streak: student.streak,
            department: student.department || undefined,
            college: student.collegeName,
          },
          riskFactors: {
            score: student.riskScore,
            band: student.riskBand,
            topReason: student.topReason,
          },
          ladderLevel: student.riskBand === "HIGH" ? "GOAL_DOWNGRADE" : "SQUAD_NUDGE",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to generate AI nudge");

      setNudgeModal({
        studentName: student.name,
        message: json.data.message,
        provider: json.data.provider,
      });
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to generate AI nudge");
    } finally {
      setNudgingStudentId(null);
    }
  };

  const highRiskCount = students.filter((s) => s.riskBand === "HIGH").length;
  const midRiskCount = students.filter((s) => s.riskBand === "MID").length;
  const lowRiskCount = students.filter((s) => s.riskBand === "LOW").length;

  return (
    <div className="space-y-8">
      {/* Top Operations Action Strip */}
      <div className="rounded-3xl border border-[#223040] bg-[#131A22] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#4F9C8F] block mb-1">
            Institutional Control Center • PS 26196
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#EAF2F5]">
            Campus Dropout Risk Operations
          </h2>
          <p className="text-xs sm:text-sm text-[#8CA0AD] mt-1">
            Deterministic risk algorithm monitors attendance slips, automatically lowers habit friction, and mobilizes peer nudges.
          </p>
        </div>

        <button
          type="button"
          disabled={recomputing}
          onClick={handleRecomputeAll}
          className="rounded-2xl bg-[#4F9C8F] hover:bg-[#5db4a5] disabled:opacity-50 text-[#0B0F14] font-bold px-6 py-3 text-xs sm:text-sm transition-all shadow-lg shadow-[#4F9C8F]/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {recomputing ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-[#0B0F14] border-t-transparent animate-spin" />
              <span>Evaluating All Campuses...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Run Campus-Wide Risk Recompute</span>
            </>
          )}
        </button>
      </div>

      {/* Recompute Result Notification */}
      {recomputeResult && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 font-mono text-xs text-[#EAF2F5] space-y-2 animate-fade-in shadow-lg">
          <div className="flex items-center justify-between font-bold text-emerald-400">
            <span>✓ Campus Risk Telemetry Recalculated Successfully</span>
            <button
              type="button"
              onClick={() => setRecomputeResult(null)}
              className="text-[#8CA0AD] hover:text-[#EAF2F5]"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[#8CA0AD]">
            <div>Evaluated: <strong className="text-[#EAF2F5]">{recomputeResult.totalUsersEvaluated}</strong></div>
            <div>Scores Updated: <strong className="text-[#4F9C8F]">{recomputeResult.scoresUpdated}</strong></div>
            <div>High Risk Identified: <strong className="text-red-400">{recomputeResult.highRiskIdentified}</strong></div>
            <div>Interventions Triggered: <strong className="text-amber-400">{recomputeResult.interventionsTriggered}</strong></div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="rounded-2xl border border-[#223040] bg-[#101720] p-4">
          <span className="text-[10px] text-[#8CA0AD] block mb-1">TOTAL ATHLETES</span>
          <span className="text-2xl font-black text-[#EAF2F5]">{students.length}</span>
          <span className="text-[10px] text-[#8CA0AD] block mt-1">Across 5 Campuses</span>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4">
          <span className="text-[10px] text-red-400 block mb-1">HIGH RISK (&ge;0.60)</span>
          <span className="text-2xl font-black text-red-400">{highRiskCount}</span>
          <span className="text-[10px] text-red-300/70 block mt-1">Goal Downgrades Active</span>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
          <span className="text-[10px] text-amber-400 block mb-1">MID RISK (0.30-0.59)</span>
          <span className="text-2xl font-black text-amber-400">{midRiskCount}</span>
          <span className="text-[10px] text-amber-300/70 block mt-1">Squad Nudges Dispatched</span>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <span className="text-[10px] text-emerald-400 block mb-1">LOW RISK (&lt;0.30)</span>
          <span className="text-2xl font-black text-emerald-400">{lowRiskCount}</span>
          <span className="text-[10px] text-emerald-300/70 block mt-1">Consistent Momentum</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-[#223040] bg-[#131A22] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        {/* Risk Band Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#8CA0AD] mr-1">Risk Band:</span>
          {["ALL", "HIGH", "MID", "LOW", "COLD-START"].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBand(b)}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                selectedBand === b
                  ? "bg-[#4F9C8F] text-[#0B0F14] border-[#4F9C8F] font-bold"
                  : "bg-[#0B0F14] border-[#223040] text-[#8CA0AD] hover:text-[#EAF2F5]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* College Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="rounded-lg border border-[#223040] bg-[#0B0F14] px-3 py-1.5 text-xs text-[#EAF2F5] focus:border-[#4F9C8F] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Uttarakhand Colleges</option>
            <option value="DIT">Dehradun Inst. of Tech (DIT)</option>
            <option value="RIT">Roorkee Inst. of Tech (RIT)</option>
            <option value="SCE">Shivalik College (SCE)</option>
            <option value="TULA">Tula&apos;s Institute (TULA)</option>
            <option value="ITS">ICFAI Tech School (ITS)</option>
          </select>

          <input
            type="text"
            placeholder="Search student or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-[#223040] bg-[#0B0F14] px-3 py-1.5 text-xs text-[#EAF2F5] placeholder-[#8CA0AD]/40 focus:border-[#4F9C8F] focus:outline-none w-48"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-3xl border border-[#223040] bg-[#131A22]/90 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0F14] border-b border-[#223040] text-[11px] text-[#8CA0AD] uppercase">
              <tr>
                <th className="px-5 py-3.5">Athlete</th>
                <th className="px-4 py-3.5">Campus</th>
                <th className="px-4 py-3.5">Streak</th>
                <th className="px-4 py-3.5">Dropout Risk</th>
                <th className="px-4 py-3.5">Primary Risk Reason</th>
                <th className="px-4 py-3.5">Intervention</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#223040]">
              {filteredStudents.map((s) => {
                const bandColor =
                  s.riskBand === "HIGH"
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : s.riskBand === "MID"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : s.riskBand === "COLD-START"
                    ? "bg-[#4F9C8F]/10 text-[#4F9C8F] border-[#4F9C8F]/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

                return (
                  <tr key={s.id} className="hover:bg-[#101720]/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#EAF2F5] text-sm">{s.name}</div>
                      <div className="text-[10px] text-[#8CA0AD]">
                        {s.rollNo} · {s.department} (Yr {s.year})
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-[#0B0F14] border border-[#223040] font-bold text-[#EAF2F5]">
                        {s.collegeCode}
                      </span>
                      <span className="text-[10px] text-[#8CA0AD] block mt-0.5">
                        {s.squadName}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-[#FFD166]">
                      {s.streak} days
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${bandColor}`}>
                        {s.riskScore !== null ? `${(s.riskScore * 100).toFixed(0)}%` : "Day 1-7"}{" "}
                        ({s.riskBand})
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-xs text-[#8CA0AD] text-[11px] truncate">
                      {s.topReason}
                    </td>
                    <td className="px-4 py-4">
                      {s.activeIntervention ? (
                        <span className="text-amber-400 font-semibold text-[10px]">
                          ● {s.activeIntervention}
                        </span>
                      ) : (
                        <span className="text-[#2ECC71] text-[10px]">✓ Normal</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        type="button"
                        disabled={nudgingStudentId === s.id}
                        onClick={() => handleGenerateNudge(s)}
                        className="rounded-lg border border-[#4F9C8F]/30 bg-[#4F9C8F]/10 hover:bg-[#4F9C8F]/20 text-[#4F9C8F] px-2.5 py-1 text-[11px] transition-all cursor-pointer"
                      >
                        {nudgingStudentId === s.id ? "Drafting..." : "AI Nudge"}
                      </button>
                      <Link
                        href={`/dashboard?studentId=${s.id}`}
                        className="rounded-lg border border-[#223040] bg-[#0B0F14] hover:bg-[#131A22] text-[#8CA0AD] hover:text-[#EAF2F5] px-2.5 py-1 text-[11px] transition-all inline-block"
                      >
                        Dashboard →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Nudge Modal */}
      {nudgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#4F9C8F]/40 bg-[#131A22] p-6 sm:p-8 shadow-2xl text-[#EAF2F5] space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase text-[#4F9C8F] font-bold block mb-1">
                  Gemini Dropout Intervention Generator
                </span>
                <h3 className="text-xl font-bold font-display text-[#EAF2F5]">
                  Empathetic Nudge for {nudgeModal.studentName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNudgeModal(null)}
                className="w-8 h-8 rounded-full border border-[#223040] bg-[#0B0F14] text-[#8CA0AD] hover:text-[#EAF2F5] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0F14] border border-[#223040] space-y-2">
              <span className="text-[10px] text-[#8CA0AD] uppercase block">
                Generated Message (Tone: Supportive, No Guilt):
              </span>
              <p className="text-sm text-[#4F9C8F] italic leading-relaxed">
                &ldquo;{nudgeModal.message}&rdquo;
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8CA0AD]">
              <span>Engine: {nudgeModal.provider}</span>
              <span className="text-[#2ECC71]">✓ Ready for campus push dispatch</span>
            </div>

            <button
              type="button"
              onClick={() => {
                alert(`Nudge dispatched to ${nudgeModal.studentName}'s campus squad channel!`);
                setNudgeModal(null);
              }}
              className="w-full rounded-xl bg-[#4F9C8F] hover:bg-[#5db4a5] text-[#0B0F14] font-bold py-2.5 text-xs transition-all shadow-md shadow-[#4F9C8F]/20 cursor-pointer"
            >
              Dispatch Nudge to Squad →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
