"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface WorkoutLogModalProps {
  userId: string;
  studentName: string;
}

const WORKOUT_TYPES = [
  { id: "gym", label: "Gym / Strength", icon: "🏋️" },
  { id: "run", label: "Running", icon: "🏃" },
  { id: "hiit", label: "HIIT Circuit", icon: "⚡" },
  { id: "yoga", label: "Yoga / Mobility", icon: "🧘" },
  { id: "sport", label: "Campus Sport", icon: "🏸" },
  { id: "swim", label: "Swimming", icon: "🏊" },
  { id: "walk", label: "Campus Walk", icon: "🚶" },
];

const QUICK_DURATIONS = [15, 30, 45, 60];

export default function WorkoutLogModal({ userId, studentName }: WorkoutLogModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("gym");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setFeedback("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type,
          durationMinutes: Number(duration),
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to log workout session.");
      }

      setStatus("success");
      setFeedback(json.data.message || "Workout recorded successfully!");

      // Refresh data on page and close after 1.4s
      setTimeout(() => {
        router.refresh();
        setIsOpen(false);
        setStatus("idle");
        setNotes("");
      }, 1400);
    } catch (err: unknown) {
      console.error("[Workout log error]", err);
      setStatus("error");
      setFeedback(err instanceof Error ? err.message : "Error logging session.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[#4F9C8F] hover:bg-[#5db4a5] px-5 py-2.5 text-xs font-bold text-[#0B0F14] transition-all shadow-lg shadow-[#4F9C8F]/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <span className="text-base leading-none">＋</span>
        <span>Log Workout Session</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#223040] bg-[#131A22] p-6 sm:p-8 shadow-2xl text-[#EAF2F5] space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#4F9C8F] block mb-1">
                  Synchronized with Dropout Engine
                </span>
                <h3 className="text-2xl font-bold font-display text-[#EAF2F5]">
                  Log Workout for {studentName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-[#223040] bg-[#0B0F14] text-[#8CA0AD] hover:text-[#EAF2F5] hover:border-[#4F9C8F]/40 flex items-center justify-center text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {status === "success" ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-3xl animate-bounce">
                  ✓
                </div>
                <h4 className="text-xl font-bold text-[#EAF2F5]">Workout Recorded!</h4>
                <p className="text-sm font-mono text-[#2ECC71]">{feedback}</p>
                <span className="text-xs font-mono text-[#8CA0AD] block">
                  +10 Points added to Ledger · Streak preserved
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Activity Type Picker */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-2">
                    Activity Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WORKOUT_TYPES.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setType(w.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-mono transition-all ${
                          type === w.id
                            ? "bg-[#4F9C8F]/15 border-[#4F9C8F] text-[#4F9C8F] font-bold shadow-md shadow-[#4F9C8F]/10"
                            : "bg-[#0B0F14] border-[#223040] text-[#8CA0AD] hover:text-[#EAF2F5]"
                        }`}
                      >
                        <span className="text-base">{w.icon}</span>
                        <span className="truncate">{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Picker */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-2">
                    Duration (Minutes)
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    {QUICK_DURATIONS.map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuration(dur)}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
                          duration === dur
                            ? "bg-[#4F9C8F] text-[#0B0F14] border-[#4F9C8F]"
                            : "bg-[#0B0F14] text-[#8CA0AD] border-[#223040] hover:text-[#EAF2F5]"
                        }`}
                      >
                        {dur}m
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#223040] bg-[#0B0F14] px-4 py-2 text-sm text-[#EAF2F5] font-mono focus:border-[#4F9C8F] focus:outline-none focus:ring-1 focus:ring-[#4F9C8F]"
                    placeholder="Custom duration (min)"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-1.5">
                    Session Notes (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Upper body focus with campus cohort"
                    className="w-full rounded-xl border border-[#223040] bg-[#0B0F14] px-4 py-2.5 text-xs text-[#EAF2F5] placeholder-[#8CA0AD]/40 focus:border-[#4F9C8F] focus:outline-none focus:ring-1 focus:ring-[#4F9C8F] font-mono"
                  />
                </div>

                {status === "error" && (
                  <div className="rounded-xl bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-300">
                    {feedback}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-xl border border-[#223040] bg-[#0B0F14] hover:bg-[#131A22] py-2.5 text-xs font-mono text-[#8CA0AD] hover:text-[#EAF2F5] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="flex-2 rounded-xl bg-[#4F9C8F] hover:bg-[#5db4a5] disabled:opacity-50 py-2.5 text-xs font-bold text-[#0B0F14] transition-all shadow-md shadow-[#4F9C8F]/20 flex items-center justify-center gap-2"
                  >
                    {status === "submitting" ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#0B0F14] border-t-transparent animate-spin" />
                        <span>Saving to Neon DB...</span>
                      </>
                    ) : (
                      <span>Record & Sync Session →</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
