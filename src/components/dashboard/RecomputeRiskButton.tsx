"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecomputeRiskButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRecompute = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/recompute", {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to recompute risk.");
      }

      setMessage("✓ Risk telemetry updated live!");
      router.refresh();

      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      console.error("[Recompute risk error]", err);
      setMessage(err instanceof Error ? err.message : "Error recomputing risk");
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-xs font-mono text-[#4F9C8F] animate-fade-in">
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={handleRecompute}
        disabled={loading}
        className="rounded-full border border-[#223040] bg-[#0B0F14] hover:bg-[#131A22] hover:border-[#4F9C8F]/40 px-3.5 py-1.5 text-xs font-mono text-[#8CA0AD] hover:text-[#EAF2F5] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
      >
        <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400 animate-spin" : "bg-[#2ECC71]"}`} />
        <span>{loading ? "Recalculating..." : "Recalculate Risk"}</span>
      </button>
    </div>
  );
}
