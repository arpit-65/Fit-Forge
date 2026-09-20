import React from "react";

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-7xl mx-auto space-y-10">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-48 rounded-full bg-[#131A22] animate-pulse" />
        <div className="h-10 w-96 rounded-xl bg-[#131A22] animate-pulse" />
        <div className="h-4 w-full max-w-xl rounded-md bg-[#131A22] animate-pulse" />
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#223040] bg-[#131A22]/60 p-5 space-y-3"
          >
            <div className="h-3 w-24 rounded bg-[#223040] animate-pulse" />
            <div className="h-8 w-16 rounded bg-[#223040] animate-pulse" />
            <div className="h-3 w-32 rounded bg-[#223040] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-[#223040] bg-[#131A22]/60 p-8 h-96 animate-pulse" />
        <div className="rounded-3xl border border-[#223040] bg-[#131A22]/60 p-8 h-96 animate-pulse" />
      </div>

      {/* Trajectory Skeleton */}
      <div className="rounded-3xl border border-[#223040] bg-[#131A22]/60 p-8 h-80 animate-pulse" />
    </div>
  );
}
