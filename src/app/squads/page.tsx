import React from "react";
import Link from "next/link";
import { getSquadsPageData } from "@/lib/queries";
import InteractiveSquadsGrid from "@/components/squads/InteractiveSquadsGrid";

export const revalidate = 60;

interface SquadsPageProps {
  searchParams?: {
    studentId?: string;
  };
}

export default async function SquadsPage({ searchParams }: SquadsPageProps) {
  const { squads, students } = await getSquadsPageData();

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] selection:bg-[#4F9C8F] selection:text-[#0B0F14]">

      {/* Header */}
      <div className="border-b border-[#223040] bg-[#101720]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131A22] border border-[#223040] text-[11px] font-mono text-[#8CA0AD] mb-3">
                <span>PEER MOTIVATION COHORTS</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-display text-[#EAF2F5]">
                Campus Fitness Squads
              </h1>
              <p className="text-sm text-[#8CA0AD] mt-1.5 max-w-2xl">
                Small, 10-person peer accountability groups designed to keep campus athletes engaged and eliminate silent dropout.
              </p>
            </div>
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-[#223040] bg-[#0B0F14] hover:bg-[#131A22] px-5 py-2.5 text-xs font-mono text-[#8CA0AD] hover:text-[#EAF2F5] transition-all"
              >
                <span>← Athlete Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <InteractiveSquadsGrid
          squads={squads}
          students={students}
          initialStudentId={searchParams?.studentId}
        />
      </main>
    </div>
  );
}
