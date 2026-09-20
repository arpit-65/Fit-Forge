"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  targetMinutes: number;
  originalTargetMinutes: number | null;
  status: string;
  dueDate: string;
  participantCount: number;
  participants: Array<{
    userId: string;
    minutesLogged: number;
    completed: boolean;
    status: string;
  }>;
}

export interface StudentOption {
  id: string;
  name: string;
  collegeCode: string;
}

interface InteractiveChallengesGridProps {
  challenges: ChallengeItem[];
  students: StudentOption[];
  initialStudentId?: string;
}

export default function InteractiveChallengesGrid({
  challenges,
  students,
  initialStudentId,
}: InteractiveChallengesGridProps) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialStudentId || students[0]?.id || ""
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeLogModal, setActiveLogModal] = useState<string | null>(null);
  const [logMinutes, setLogMinutes] = useState(30);
  const [notification, setNotification] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleEnroll = async (challengeId: string) => {
    if (!selectedStudentId) return;
    setActionLoading(`enroll-${challengeId}`);
    setNotification(null);

    try {
      const res = await fetch("/api/challenges/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudentId,
          challengeId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Enrollment failed");

      setNotification(`✓ ${json.data.message}`);
      router.refresh();
      setTimeout(() => setNotification(null), 3500);
    } catch (err: unknown) {
      console.error(err);
      setNotification(err instanceof Error ? err.message : "Enrollment failed");
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogMinutes = async (challengeId: string) => {
    if (!selectedStudentId) return;
    setActionLoading(`log-${challengeId}`);
    setNotification(null);

    try {
      const res = await fetch("/api/challenges/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudentId,
          challengeId,
          minutes: Number(logMinutes),
          workoutType: "gym",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Logging failed");

      setNotification(`✓ ${json.data.message}`);
      setActiveLogModal(null);
      router.refresh();
      setTimeout(() => setNotification(null), 3500);
    } catch (err: unknown) {
      console.error(err);
      setNotification(err instanceof Error ? err.message : "Logging failed");
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDowngrade = async (challengeId: string) => {
    setActionLoading(`downgrade-${challengeId}`);
    setNotification(null);

    try {
      const res = await fetch("/api/challenges/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          userId: selectedStudentId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Downgrade failed");

      setNotification(`✓ ${json.data.message}`);
      router.refresh();
      setTimeout(() => setNotification(null), 3500);
    } catch (err: unknown) {
      console.error(err);
      setNotification(err instanceof Error ? err.message : "Downgrade failed");
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Student Selector Bar */}
      <div className="rounded-2xl border border-[#223040] bg-[#131A22] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4F9C8F]/15 border border-[#4F9C8F]/30 flex items-center justify-center text-[#4F9C8F] font-bold text-sm">
            🏃
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#8CA0AD] block">
              Active Campus Athlete for Actions
            </span>
            <span className="text-sm font-bold text-[#EAF2F5]">
              {selectedStudent?.name} ({selectedStudent?.collegeCode})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8CA0AD]">Switch Athlete:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="rounded-lg border border-[#223040] bg-[#0B0F14] px-3 py-1.5 text-xs text-[#EAF2F5] focus:border-[#4F9C8F] focus:outline-none font-mono cursor-pointer"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.collegeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div className="rounded-2xl border border-[#4F9C8F]/40 bg-[#4F9C8F]/10 p-4 text-xs font-mono text-[#EAF2F5] flex items-center justify-between animate-fade-in shadow-lg">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[#8CA0AD] hover:text-[#EAF2F5]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid of Challenges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map((ch) => {
          const isDowngraded =
            ch.status === "DOWNGRADED" ||
            (ch.originalTargetMinutes && ch.originalTargetMinutes > ch.targetMinutes);

          const studentParticipation = ch.participants.find(
            (p) => p.userId === selectedStudentId
          );
          const isEnrolled = Boolean(studentParticipation);
          const minutesLogged = studentParticipation?.minutesLogged || 0;
          const isCompleted = studentParticipation?.completed || false;
          const percentProgress = Math.min(
            100,
            Math.round((minutesLogged / ch.targetMinutes) * 100)
          );

          return (
            <div
              key={ch.id}
              className="rounded-3xl border border-[#223040] bg-[#131A22]/90 backdrop-blur-xl p-8 hover:border-[#4F9C8F]/50 transition-all flex flex-col justify-between shadow-xl space-y-6"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${
                      isDowngraded
                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                        : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {isDowngraded ? "● DOWNGRADED (RECOVERY)" : "● ACTIVE SPRINT"}
                  </span>
                  <span className="text-xs font-mono text-[#8CA0AD]">
                    Due: {ch.dueDate}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[#EAF2F5] mb-2 font-display">
                  {ch.title}
                </h3>
                <p className="text-sm text-[#8CA0AD] leading-relaxed mb-6">
                  {ch.description}
                </p>

                {/* Target Metric Callout */}
                <div className="rounded-2xl border border-[#223040] bg-[#0B0F14] p-4 flex items-center justify-between font-mono mb-4">
                  <div>
                    <span className="text-xs text-[#8CA0AD] block">TARGET VOLUME</span>
                    <span className="text-xl font-bold text-[#4F9C8F]">
                      {ch.targetMinutes} minutes
                    </span>
                  </div>
                  {isDowngraded && ch.originalTargetMinutes && (
                    <div className="text-right">
                      <span className="text-xs text-[#8CA0AD] block">ORIGINAL GOAL</span>
                      <span className="text-sm text-red-400 line-through">
                        {ch.originalTargetMinutes} min
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar if enrolled */}
                {isEnrolled && (
                  <div className="rounded-2xl border border-[#4F9C8F]/30 bg-[#0B0F14] p-4 space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#8CA0AD]">
                        {selectedStudent?.name}&apos;s Progress
                      </span>
                      <span
                        className={
                          isCompleted ? "text-emerald-400 font-bold" : "text-[#4F9C8F] font-bold"
                        }
                      >
                        {isCompleted
                          ? "✓ Completed!"
                          : `${minutesLogged} / ${ch.targetMinutes} min (${percentProgress}%)`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#131A22] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-emerald-400"
                            : "bg-gradient-to-r from-[#4F9C8F] to-[#2ECC71]"
                        }`}
                        style={{ width: `${Math.max(4, percentProgress)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#223040] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-[#8CA0AD]">
                    {ch.participantCount} Students Enrolled
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Enroll Button if not enrolled */}
                    {!isEnrolled ? (
                      <button
                        type="button"
                        disabled={actionLoading === `enroll-${ch.id}`}
                        onClick={() => handleEnroll(ch.id)}
                        className="rounded-full bg-[#4F9C8F] hover:bg-[#5db4a5] disabled:opacity-50 text-[#0B0F14] font-bold px-4 py-2 transition-all shadow-md shadow-[#4F9C8F]/20 cursor-pointer"
                      >
                        {actionLoading === `enroll-${ch.id}`
                          ? "Enrolling..."
                          : "Enroll in Challenge →"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveLogModal(ch.id)}
                        className="rounded-full bg-[#4F9C8F]/15 hover:bg-[#4F9C8F]/25 text-[#4F9C8F] border border-[#4F9C8F]/30 font-bold px-4 py-2 transition-all cursor-pointer"
                      >
                        + Log Minutes
                      </button>
                    )}

                    {/* Simulate Goal Downgrade */}
                    <button
                      type="button"
                      disabled={actionLoading === `downgrade-${ch.id}`}
                      onClick={() => handleDowngrade(ch.id)}
                      className="rounded-full border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 px-3.5 py-2 font-mono transition-all cursor-pointer"
                      title="Simulate friction-reduction downgrade"
                    >
                      {actionLoading === `downgrade-${ch.id}`
                        ? "Easing..."
                        : "⚡ Auto-Downgrade"}
                    </button>
                  </div>
                </div>

                {/* Inline Minute Logger */}
                {activeLogModal === ch.id && (
                  <div className="rounded-xl border border-[#4F9C8F]/40 bg-[#0B0F14] p-3.5 flex items-center justify-between gap-3 animate-fade-in font-mono text-xs">
                    <span className="text-[#8CA0AD]">Log Workout:</span>
                    <div className="flex items-center gap-1.5">
                      {[15, 30, 45, 60].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setLogMinutes(m)}
                          className={`px-2 py-1 rounded border ${
                            logMinutes === m
                              ? "bg-[#4F9C8F] text-[#0B0F14] border-[#4F9C8F] font-bold"
                              : "border-[#223040] text-[#8CA0AD]"
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={actionLoading === `log-${ch.id}`}
                        onClick={() => handleLogMinutes(ch.id)}
                        className="rounded-lg bg-[#4F9C8F] text-[#0B0F14] px-3 py-1 font-bold hover:bg-[#5db4a5] cursor-pointer"
                      >
                        {actionLoading === `log-${ch.id}` ? "Saving..." : "Record"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLogModal(null)}
                        className="text-[#8CA0AD] hover:text-[#EAF2F5]"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
