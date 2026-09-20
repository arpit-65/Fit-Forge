"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import RiskCard, { FeaturedStudentProps } from "@/components/RiskCard";
import { Skeleton } from "@/components/ui/Skeleton";

interface RiskEngineSectionProps {
  students: FeaturedStudentProps[];
  error?: string | null;
}

export default function RiskEngineSection({
  students,
  error,
}: RiskEngineSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    });
  };

  const hasError = Boolean(error) || students.length === 0;

  return (
    <section
      id="risk-engine"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-8"
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Section Header (Playfair Display for section title)                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)] px-4 py-1.5 text-xs text-[var(--ff-accent)] mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ff-accent)] animate-glow" />
          Deterministic · Rule-Based · Explainable
        </div>

        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance text-[var(--ff-text-primary)] mb-5">
          The <span className="gradient-text italic">Campus Risk Engine</span>
        </h2>

        <p className="font-sans text-base sm:text-lg text-[var(--ff-text-secondary)] leading-relaxed text-balance">
          FitForge predicts dropout patterns using 14-day activity velocity, streak breaks, and cohort misses. Hover or tap any student card to see their progressive intervention.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Fallback View: Error Message + Retry Button + 5 Skeleton Cards      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {hasError ? (
        <div className="space-y-8">
          {/* Friendly alert box */}
          <div className="glass rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/90 p-6 sm:p-8 max-w-2xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--ff-risk-mid)]/15 border border-[var(--ff-risk-mid)]/30 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--ff-text-primary)] mb-1">
                Database Connection Standby
              </h3>
              <p className="text-sm text-[var(--ff-text-secondary)] leading-relaxed">
                {error ||
                  "Unable to connect to the campus student database right now. The fallback skeleton preview is active."}
              </p>
            </div>

            <button
              onClick={handleRetry}
              disabled={isPending || isRetrying}
              type="button"
              aria-label={
                isPending || isRetrying
                  ? "Reconnecting to database…"
                  : "Retry fetching student data from database"
              }
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ff-accent)] hover:brightness-110 px-6 py-2.5 text-sm font-semibold text-[var(--ff-bg-primary)] transition-all glow-accent cursor-pointer disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ff-accent)]"
            >
              <span className={isPending || isRetrying ? "animate-spin" : ""}>
                ↻
              </span>
              <span>
                {isPending || isRetrying ? "Reconnecting..." : "Retry Database Fetch"}
              </span>
            </button>
          </div>

          {/* 5 Skeleton Cards (Never blank screen) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/60 p-6 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>

                <Skeleton className="h-16 w-full rounded-xl" />

                <div className="flex justify-between pt-2 border-t border-[var(--ff-border)]/40">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────────── */
        /* Real Database Grid: 5 Featured Student Personas                   */
        /* ───────────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <RiskCard key={student.id} student={student} />
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Legend & Policy Reference                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="mt-14 pt-8 border-t border-[var(--ff-border)]/50 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ff-text-secondary)] font-mono">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-[var(--ff-text-primary)]">
            RISK TIERS:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ff-risk-low)]" />
            LOW (&lt; 0.30)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ff-risk-mid)]" />
            MID (0.30–0.59)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ff-risk-high)]" />
            HIGH (&ge; 0.60)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ff-accent)]" />
            COLD START (Day 1–7)
          </span>
        </div>

        <div>SIH PS 26196 · Progressive Intervention Ladder Active</div>
      </div>
    </section>
  );
}
