"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface StudentSummary {
  id: string;
  name: string;
  collegeCode: string;
  band: string;
  streak: number;
}

interface StudentSwitcherProps {
  currentStudentId: string;
  allStudents: StudentSummary[];
}

const FEATURED_NAMES = [
  "Arpit Sharma",
  "Apoorav Mehta",
  "Ritika Bisht",
  "Grima Rawat",
  "Pankaj Negi",
];

export default function StudentSwitcher({
  currentStudentId,
  allStudents,
}: StudentSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("studentId", id);
    router.push(`/dashboard?${params.toString()}`);
  };

  const featuredStudents = allStudents.filter((s) =>
    FEATURED_NAMES.includes(s.name)
  );

  return (
    <div className="rounded-2xl border border-[#223040] bg-[#101720]/80 p-3 sm:p-4 backdrop-blur-md mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4F9C8F] animate-pulse" />
          <span className="text-[11px] font-mono text-[#8CA0AD] uppercase tracking-wider">
            Switch Athlete Persona (Live Database Telemetry)
          </span>
        </div>

        {/* Full student roster dropdown */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#8CA0AD] hidden md:inline">Or select from 50 students:</span>
          <select
            value={currentStudentId}
            onChange={(e) => handleSelect(e.target.value)}
            className="rounded-lg border border-[#223040] bg-[#0B0F14] px-3 py-1.5 text-xs text-[#EAF2F5] focus:border-[#4F9C8F] focus:outline-none font-mono cursor-pointer"
          >
            {allStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.collegeCode}) — {s.band} ({s.streak}d streak)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick-tap Persona Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
        {featuredStudents.map((s) => {
          const isSelected = s.id === currentStudentId;
          const bandColor =
            s.band === "HIGH"
              ? "text-red-400 border-red-500/40"
              : s.band === "MID"
              ? "text-amber-400 border-amber-500/40"
              : s.band === "COLD-START"
              ? "text-[#4F9C8F] border-[#4F9C8F]/40"
              : "text-emerald-400 border-emerald-500/40";

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[#4F9C8F]/15 border-[#4F9C8F] text-[#EAF2F5] shadow-lg shadow-[#4F9C8F]/10 scale-[1.02]"
                  : "bg-[#0B0F14] border-[#223040] text-[#8CA0AD] hover:text-[#EAF2F5] hover:border-[#4F9C8F]/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#8CA0AD] font-bold">{s.collegeCode}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded border ${bandColor}`}>
                  {s.band}
                </span>
              </div>
              <span className="font-bold text-xs truncate text-[#EAF2F5]">{s.name}</span>
              <span className="text-[10px] text-[#8CA0AD] mt-1">
                🔥 {s.streak}d streak
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
