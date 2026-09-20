"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FitForge Analytics Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl border border-[#223040] bg-[#131A22] p-8 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 text-xl font-mono">
          !
        </div>
        <h2 className="text-xl font-bold font-display text-[#EAF2F5] mb-2">
          Unable to Load Analytics
        </h2>
        <p className="text-xs text-[#8CA0AD] leading-relaxed mb-6">
          The analytics engine encountered an issue reaching the database. You can retry loading
          or return to the overview page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="rounded-full bg-[#4F9C8F] hover:bg-[#5db4a5] px-6 py-2.5 text-xs font-semibold text-[#0B0F14] transition-all"
          >
            Retry Analytics
          </button>
          <Link
            href="/"
            className="rounded-full border border-[#223040] bg-[#0B0F14] hover:bg-[#131A22] px-6 py-2.5 text-xs font-semibold text-[#8CA0AD] hover:text-[#EAF2F5] transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
