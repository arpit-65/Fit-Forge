"use client";

import React, { useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";

export interface FeaturedStudentProps {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  department: string;
  year: number;
  college: string;
  collegeCode: string;
  squad: string;
  squadRole: string;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | Date | null;
  };
  currentRisk: {
    score: number | null;
    band: string | null;
    topReason: string;
    bootstrapActive: boolean;
    computedAt: string | Date | null;
  };
  interventions: Array<{
    id: string;
    type: string;
    message: string;
    firedAt: string | Date;
    resolvedAt: string | Date | null;
    isActive: boolean;
  }>;
  league?: {
    tier: string;
    name: string;
    points: number;
    rank: number | null;
  } | null;
}

interface RiskCardProps {
  student: FeaturedStudentProps;
}

export default function RiskCard({ student }: RiskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);

  const isRevealed = isHovered || isTapped;

  // Determine Initials for avatar
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isColdStart =
    student.currentRisk.bootstrapActive || student.currentRisk.score === null;
  const score = student.currentRisk.score ?? 0;
  const band = student.currentRisk.band || "LOW";

  // Palette tokens based on band
  const bandStyles = isColdStart
    ? {
        border: "border-[var(--ff-accent)]/40 hover:border-[var(--ff-accent)]",
        badgeBg: "bg-[var(--ff-accent)]/10 text-[var(--ff-accent)] border-[var(--ff-accent)]/30",
        barBg: "bg-[var(--ff-accent)]",
        glow: "shadow-[0_0_20px_rgba(79,156,143,0.15)]",
        label: "COLD-START",
        textColor: "text-[var(--ff-accent)]",
      }
    : band === "HIGH"
    ? {
        border: "border-[var(--ff-risk-high)]/40 hover:border-[var(--ff-risk-high)]",
        badgeBg: "bg-[var(--ff-risk-high)]/10 text-[var(--ff-risk-high)] border-[var(--ff-risk-high)]/30",
        barBg: "bg-[var(--ff-risk-high)]",
        glow: "shadow-[0_0_25px_rgba(229,72,77,0.2)]",
        label: "HIGH RISK",
        textColor: "text-[var(--ff-risk-high)]",
      }
    : band === "MID"
    ? {
        border: "border-[var(--ff-risk-mid)]/40 hover:border-[var(--ff-risk-mid)]",
        badgeBg: "bg-[var(--ff-risk-mid)]/10 text-[var(--ff-risk-mid)] border-[var(--ff-risk-mid)]/30",
        barBg: "bg-[var(--ff-risk-mid)]",
        glow: "shadow-[0_0_20px_rgba(245,166,35,0.15)]",
        label: "MID RISK",
        textColor: "text-[var(--ff-risk-mid)]",
      }
    : {
        border: "border-[var(--ff-risk-low)]/40 hover:border-[var(--ff-risk-low)]",
        badgeBg: "bg-[var(--ff-risk-low)]/10 text-[var(--ff-risk-low)] border-[var(--ff-risk-low)]/30",
        barBg: "bg-[var(--ff-risk-low)]",
        glow: "shadow-[0_0_20px_rgba(46,204,113,0.15)]",
        label: "LOW RISK",
        textColor: "text-[var(--ff-risk-low)]",
      };

  // Find latest active or recent intervention
  const activeIntervention =
    student.interventions.find((i) => i.isActive) ||
    student.interventions[0] ||
    null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsTapped((prev) => !prev)}
      className={`group relative rounded-2xl border ${bandStyles.border} bg-[var(--ff-bg-secondary)]/85 p-6 backdrop-blur-xl transition-all duration-300 ${bandStyles.glow} flex flex-col justify-between cursor-pointer select-none`}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Card Header: Avatar, Name, College, RollNo                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm border ${bandStyles.badgeBg}`}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--ff-text-primary)] group-hover:text-white transition-colors">
                {student.name}
              </h3>
              <p className="text-xs text-[var(--ff-text-secondary)] line-clamp-1">
                {student.college}
              </p>
            </div>
          </div>

          {/* Risk Band Badge */}
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wider ${bandStyles.badgeBg}`}
          >
            {bandStyles.label}
          </span>
        </div>

        {/* Department & Year tag */}
        <div className="flex items-center gap-2 text-xs text-[var(--ff-text-secondary)] mb-5 font-mono">
          <span>{student.department}</span>
          <span>·</span>
          <span>Yr {student.year}</span>
          <span>·</span>
          <span className="text-[var(--ff-text-secondary)]/80">
            {student.rollNo}
          </span>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Risk Score Meter OR Cold-Start Message                           */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {isColdStart ? (
          <div className="rounded-xl border border-[var(--ff-accent)]/30 bg-[var(--ff-accent)]/5 p-3.5 mb-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--ff-accent)] animate-glow" />
              <span className="text-xs font-semibold text-[var(--ff-accent)] font-mono">
                BOOTSTRAP OBSERVATION
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--ff-text-primary)] leading-snug">
              Day 5 — learning your pattern. Risk scoring starts soon.
            </p>
          </div>
        ) : (
          <div className="mb-5">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-mono text-[var(--ff-text-secondary)] uppercase tracking-wider">
                Dropout Risk Score
              </span>
              <span className={`text-2xl font-black font-mono ${bandStyles.textColor}`}>
                {(score * 100).toFixed(0)}%
                <span className="text-xs text-[var(--ff-text-secondary)] font-normal ml-1">
                  ({score.toFixed(2)})
                </span>
              </span>
            </div>

            {/* Score progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ff-border)]/50 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${bandStyles.barBg}`}
                style={{ width: `${Math.min(100, Math.max(8, score * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Primary Contributing Reason (Explainable feature)                 */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--ff-border)]/60 bg-[var(--ff-bg-primary)]/50 p-3 mb-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--ff-text-secondary)] mb-1">
            Top Risk Factor
          </div>
          <p className="text-xs text-[var(--ff-text-primary)] font-medium line-clamp-2">
            {student.currentRisk.topReason}
          </p>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Streak & Squad Badges                                             */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-[var(--ff-text-secondary)] pt-1 border-t border-[var(--ff-border)]/40">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-sm">🔥</span>
            <span className={student.streak.current > 0 ? "text-[var(--ff-gold)]" : ""}>
              {student.streak.current}-day streak
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm">👥</span>
            <span className="text-[var(--ff-text-primary)] font-medium">
              {student.squad}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Interactive Intervention Drawer (Revealed on Hover / Tap)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-[var(--ff-border)]/50">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ff-text-secondary)]">
          <span>INTERVENTION STATUS</span>
          <span className="text-[var(--ff-accent)] group-hover:underline">
            {isRevealed ? "Tap to collapse ▲" : "Hover / Tap to inspect ▼"}
          </span>
        </div>

        <AnimatePresence>
          {isRevealed && (
            <m.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-[var(--ff-accent)]/30 bg-[var(--ff-bg-primary)] p-3.5 space-y-2.5">
                {activeIntervention ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ff-accent)]/15 px-2 py-0.5 text-[10px] font-bold font-mono text-[var(--ff-accent)]">
                        {activeIntervention.type.replace("_", " ")}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-medium ${
                          activeIntervention.isActive
                            ? "text-[var(--ff-risk-mid)]"
                            : "text-[var(--ff-risk-low)]"
                        }`}
                      >
                        {activeIntervention.isActive
                          ? "● Active Intervention"
                          : "✓ Resolved & Recovered"}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--ff-text-primary)] leading-relaxed italic">
                      &ldquo;{activeIntervention.message}&rdquo;
                    </p>

                    <div className="text-[10px] text-[var(--ff-text-secondary)] font-mono">
                      Fired: {new Date(activeIntervention.firedAt).toLocaleDateString()}
                      {activeIntervention.resolvedAt && (
                        <span>
                          {" "}
                          · Restored:{" "}
                          {new Date(activeIntervention.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </>
                ) : isColdStart ? (
                  <p className="text-xs text-[var(--ff-text-secondary)] leading-relaxed">
                    Student is in the 7-day onboarding period. Automated check-ins and baseline activity logging are active.
                  </p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--ff-risk-low)] font-semibold">
                       <span>✓</span>
                       <span>No Intervention Needed</span>
                    </div>
                    <p className="text-xs text-[var(--ff-text-secondary)] leading-relaxed">
                       Athlete maintains consistent session check-ins and high squad engagement.
                    </p>
                  </div>
                )}

                <Link
                  href={`/dashboard?studentId=${student.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 block text-center rounded-xl bg-[var(--ff-accent)]/15 hover:bg-[var(--ff-accent)]/25 text-[var(--ff-accent)] border border-[var(--ff-accent)]/30 py-2 text-xs font-mono font-bold transition-all"
                >
                  Open {student.name.split(" ")[0]}&apos;s Athlete Dashboard →
                </Link>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
