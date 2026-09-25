import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function RiskEngineSkeleton() {
  return (
    <section
      id="risk-engine"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-8"
      aria-label="Loading Campus Risk Engine"
    >
      <div className="text-center max-w-3xl mx-auto mb-14 flex flex-col items-center">
        <Skeleton className="h-6 w-56 rounded-full mb-4" />
        <Skeleton className="h-12 w-80 sm:w-96 rounded-xl mb-5" />
        <Skeleton className="h-5 w-full max-w-md rounded-lg" />
      </div>

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
    </section>
  );
}

export function AdaptFeatureSkeleton() {
  return (
    <section
      className="relative bg-[var(--ff-bg-primary)] py-24 text-[var(--ff-text-primary)] border-t border-[var(--ff-border)]/50"
      aria-label="Loading Mechanics"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-16 flex flex-col items-center">
        <Skeleton className="h-6 w-60 rounded-full mb-4" />
        <Skeleton className="h-12 w-72 sm:w-96 rounded-xl mb-5" />
        <Skeleton className="h-5 w-full max-w-lg rounded-lg" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_380px_1.1fr] gap-8 items-start">
          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--ff-border)]/60 bg-[var(--ff-bg-secondary)]/40 p-6 space-y-4"
              >
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-[340px] rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/80 p-6 h-[380px] flex flex-col items-center justify-between">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-44 w-44 rounded-full" />
              <Skeleton className="h-12 w-28 rounded-lg" />
            </div>
          </div>

          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--ff-border)]/60 bg-[var(--ff-bg-secondary)]/40 p-6 space-y-4"
              >
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function GoalDowngradeSkeleton() {
  return (
    <section
      className="relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0B0F14] via-[#0e141c] to-[#0B0F14]"
      aria-label="Loading Retention Showcase"
    >
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <Skeleton className="h-6 w-64 rounded-full mb-5" />
        <Skeleton className="h-12 w-80 sm:w-96 rounded-xl mb-6" />
        <Skeleton className="h-5 w-full max-w-md rounded-lg mb-16" />

        <div className="w-full rounded-3xl border border-[#223040] bg-[#10161E]/80 p-8 h-[360px] flex flex-col justify-between">
          <Skeleton className="h-8 w-60 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-10 w-44 rounded-xl mx-auto" />
        </div>
      </div>
    </section>
  );
}

export function FinalCTASkeleton() {
  return (
    <section className="relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto rounded-3xl border border-[#223040] bg-[#131A22]/80 p-8 sm:p-12 text-center flex flex-col items-center space-y-6">
        <Skeleton className="h-6 w-52 rounded-full" />
        <Skeleton className="h-14 w-80 sm:w-96 rounded-xl" />
        <Skeleton className="h-6 w-full max-w-lg rounded-lg" />
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-12 w-44 rounded-full" />
          <Skeleton className="h-12 w-44 rounded-full" />
        </div>
      </div>
    </section>
  );
}

export function BelowHeroSkeleton() {
  return (
    <div className="space-y-4">
      <RiskEngineSkeleton />
      <AdaptFeatureSkeleton />
      <GoalDowngradeSkeleton />
      <FinalCTASkeleton />
    </div>
  );
}
