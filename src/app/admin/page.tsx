import React from "react";
import Link from "next/link";
import { getAdminStudentsList } from "@/lib/queries";
import AdminOperationsView from "@/components/admin/AdminOperationsView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const students = await getAdminStudentsList();

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] selection:bg-[#4F9C8F] selection:text-[#0B0F14]">
      {/* Top Header */}
      <div className="border-b border-[#223040] bg-[#101720]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131A22] border border-[#223040] text-[11px] font-mono text-[#8CA0AD] mb-3">
                <span className="w-2 h-2 rounded-full bg-[#4F9C8F] animate-pulse" />
                <span>SIH PS 26196 • CAMPUS ADMINISTRATOR CONSOLE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-display text-[#EAF2F5]">
                Campus Risk Monitoring & Operations
              </h1>
              <p className="text-sm text-[#8CA0AD] mt-1.5 max-w-3xl">
                Real-time surveillance of student activity telemetry, automated habit friction downgrading, and AI-powered intervention dispatch.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full border border-[#223040] bg-[#0B0F14] hover:bg-[#131A22] px-4 py-2 text-xs font-mono text-[#8CA0AD] hover:text-[#EAF2F5] transition-all"
              >
                ← Athlete View
              </Link>
              <Link
                href="/analytics"
                className="rounded-full bg-[#4F9C8F] hover:bg-[#5db4a5] px-4 py-2 text-xs font-semibold text-[#0B0F14] transition-all"
              >
                Live Analytics →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <AdminOperationsView students={students} />
      </main>
    </div>
  );
}
