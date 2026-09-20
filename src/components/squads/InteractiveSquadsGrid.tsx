"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export interface SquadMemberDetail {
  userId: string;
  name: string;
  role: string;
}

export interface SquadItem {
  id: string;
  name: string;
  description: string | null;
  college: { name: string; code: string } | null;
  memberCount: number;
  leader: string | null;
  members: SquadMemberDetail[];
}

export interface StudentOption {
  id: string;
  name: string;
  collegeCode: string;
}

interface InteractiveSquadsGridProps {
  squads: SquadItem[];
  students: StudentOption[];
  initialStudentId?: string;
}

export default function InteractiveSquadsGrid({
  squads,
  students,
  initialStudentId,
}: InteractiveSquadsGridProps) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialStudentId || students[0]?.id || ""
  );
  const [loadingSquadId, setLoadingSquadId] = useState<string | null>(null);
  const [expandedSquadId, setExpandedSquadId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleJoinSquad = async (squadId: string) => {
    if (!selectedStudentId) return;
    setLoadingSquadId(squadId);
    setNotification(null);

    try {
      const res = await fetch("/api/squads/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudentId,
          squadId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to join squad");

      setNotification(`✓ ${json.data.message}`);
      router.refresh();
      setTimeout(() => setNotification(null), 3500);
    } catch (err: unknown) {
      console.error(err);
      setNotification(err instanceof Error ? err.message : "Failed to join squad");
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoadingSquadId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Student Selector Bar */}
      <div className="rounded-2xl border border-[#223040] bg-[#131A22] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4F9C8F]/15 border border-[#4F9C8F]/30 flex items-center justify-center text-[#4F9C8F] font-bold text-sm">
            👥
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#8CA0AD] block">
              Active Campus Athlete for Squad Enrollment
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

      {/* Squad Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.map((sq) => {
          const isMember = sq.members.some((m) => m.userId === selectedStudentId);

          return (
            <div
              key={sq.id}
              className={`rounded-2xl border bg-[#131A22]/90 backdrop-blur-xl p-6 transition-all flex flex-col justify-between shadow-lg ${
                isMember
                  ? "border-[#4F9C8F] shadow-[#4F9C8F]/10"
                  : "border-[#223040] hover:border-[#4F9C8F]/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#4F9C8F]/10 border border-[#4F9C8F]/30 text-xs font-mono font-semibold text-[#4F9C8F]">
                      {sq.college?.code || "CAMPUS"}
                    </span>
                    {isMember && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                        ✓ Your Squad
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[#8CA0AD]">
                    {sq.memberCount} / 10 Athletes
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#EAF2F5] mb-1 font-display">
                  {sq.name}
                </h3>
                <p className="text-xs text-[#8CA0AD] mb-4">
                  {sq.college?.name || "Campus Division"}
                </p>

                <p className="text-xs text-[#8CA0AD]/80 leading-relaxed mb-6">
                  {sq.description ||
                    "Active campus training squad collaborating on weekly consistency targets."}
                </p>

                {/* Expanded Roster Accordion */}
                {expandedSquadId === sq.id && (
                  <div className="mb-4 p-3 rounded-xl bg-[#0B0F14] border border-[#223040] space-y-2 animate-fade-in font-mono text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#8CA0AD] block">
                      Squad Roster ({sq.members.length} Athletes)
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {sq.members.map((m) => (
                        <div
                          key={m.userId}
                          className="flex items-center justify-between text-xs py-1 border-b border-[#223040]/50 last:border-0"
                        >
                          <span
                            className={
                              m.userId === selectedStudentId
                                ? "text-[#4F9C8F] font-bold"
                                : "text-[#EAF2F5]"
                            }
                          >
                            {m.name} {m.userId === selectedStudentId && "(You)"}
                          </span>
                          <span className="text-[10px] text-[#8CA0AD] uppercase">
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-[#223040] flex items-center justify-between text-xs font-mono">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSquadId(expandedSquadId === sq.id ? null : sq.id)
                  }
                  className="text-[#8CA0AD] hover:text-[#EAF2F5] underline cursor-pointer"
                >
                  {expandedSquadId === sq.id ? "Hide Roster ▲" : "View Roster ▼"}
                </button>

                {isMember ? (
                  <span className="text-emerald-400 font-bold">Enrolled</span>
                ) : (
                  <button
                    type="button"
                    disabled={loadingSquadId === sq.id || sq.memberCount >= 10}
                    onClick={() => handleJoinSquad(sq.id)}
                    className="rounded-full bg-[#4F9C8F] hover:bg-[#5db4a5] disabled:opacity-50 text-[#0B0F14] font-bold px-4 py-1.5 transition-all shadow-md shadow-[#4F9C8F]/15 cursor-pointer"
                  >
                    {loadingSquadId === sq.id
                      ? "Joining..."
                      : sq.memberCount >= 10
                      ? "Squad Full"
                      : "Join Team →"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
