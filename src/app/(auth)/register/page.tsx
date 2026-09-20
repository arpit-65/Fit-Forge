"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CollegeOption {
  id: string;
  name: string;
  code: string;
}

const DEFAULT_COLLEGES: CollegeOption[] = [
  { id: "dit", name: "Dehradun Institute of Technology", code: "DIT" },
  { id: "rit", name: "Roorkee Institute of Technology", code: "RIT" },
  { id: "sce", name: "Shivalik College of Engineering", code: "SCE" },
  { id: "tulas", name: "Tula's Institute", code: "TULA" },
  { id: "its", name: "ICFAI Tech School Dehradun", code: "ITS" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<CollegeOption[]>(DEFAULT_COLLEGES);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rollNo: "",
    department: "Computer Science",
    year: 1,
    collegeId: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ name: string; squad: string; college: string } | null>(null);

  useEffect(() => {
    async function loadColleges() {
      try {
        const res = await fetch("/api/colleges");
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setColleges(json.data);
            setFormData((prev) => ({
              ...prev,
              collegeId: prev.collegeId || json.data[0].id,
            }));
          }
        }
      } catch {
        // Fallback to default colleges
        setFormData((prev) => ({
          ...prev,
          collegeId: prev.collegeId || DEFAULT_COLLEGES[0].id,
        }));
      }
    }
    loadColleges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          year: Number(formData.year),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed. Please check inputs.");
      }

      setSuccessInfo({
        name: data.data.user.name,
        squad: data.data.user.squad,
        college: data.data.user.college,
      });
      setStatus("success");
    } catch (err: unknown) {
      console.error("[Registration error]", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Registration error. Please retry.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#4F9C8F] selection:text-[#0B0F14]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#4F9C8F]/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-lg">
        {/* Header branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-[#4F9C8F] animate-pulse" />
            <span className="font-display text-2xl font-bold tracking-tight text-[#EAF2F5]">
              FitForge
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#EAF2F5]">
            Join Your Campus Squad
          </h1>
          <p className="text-xs sm:text-sm text-[#8CA0AD] mt-2">
            Connect with campus athletes, track team challenges, and build consistency.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[#223040] bg-[#131A22]/90 backdrop-blur-xl p-8 shadow-2xl shadow-black/80">
          {status === "success" && successInfo ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-3xl">
                🏆
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#EAF2F5] mb-1">Welcome, {successInfo.name}!</h3>
                <p className="text-xs font-mono text-[#8CA0AD]">
                  Enrolled at <span className="text-[#EAF2F5] font-semibold">{successInfo.college}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-[#4F9C8F]/30 bg-[#0B0F14] p-4 text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8CA0AD]">Assigned Squad:</span>
                  <span className="text-[#4F9C8F] font-semibold">{successInfo.squad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8CA0AD]">Initial League:</span>
                  <span className="text-amber-400 font-semibold">Bronze Tier</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8CA0AD]">Active Challenge:</span>
                  <span className="text-emerald-400 font-semibold">30-Day Campus Sprint</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/analytics")}
                  className="flex-1 rounded-xl bg-[#4F9C8F] hover:bg-[#5db4a5] px-4 py-3 text-xs font-semibold text-[#0B0F14] transition-all text-center shadow-lg shadow-[#4F9C8F]/20"
                >
                  View Campus Analytics →
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/squads")}
                  className="flex-1 rounded-xl border border-[#223040] bg-[#0B0F14] hover:bg-[#131A22] px-4 py-3 text-xs font-mono text-[#8CA0AD] hover:text-[#EAF2F5] transition-all text-center"
                >
                  Explore Squads
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-[#223040] bg-[#0B0F14] px-4 py-2.5 text-sm text-[#EAF2F5] placeholder-[#8CA0AD]/40 focus:border-[#4F9C8F] focus:outline-none focus:ring-1 focus:ring-[#4F9C8F] transition-all font-mono"
                />
              </div>

              {/* College Selection */}
              <div>
                <label
                  htmlFor="college"
                  className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-1.5"
                >
                  Campus Institution
                </label>
                <select
                  id="college"
                  required
                  value={formData.collegeId}
                  onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                  className="w-full rounded-xl border border-[#223040] bg-[#0B0F14] px-4 py-2.5 text-sm text-[#EAF2F5] focus:border-[#4F9C8F] focus:outline-none focus:ring-1 focus:ring-[#4F9C8F] transition-all font-mono"
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-1.5"
                >
                  College Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@dit.edu.in"
                  className="w-full rounded-xl border border-[#223040] bg-[#0B0F14] px-4 py-2.5 text-sm text-[#EAF2F5] placeholder-[#8CA0AD]/40 focus:border-[#4F9C8F] focus:outline-none focus:ring-1 focus:ring-[#4F9C8F] transition-all font-mono"
                />
              </div>

              {/* Roll Number & Department in two columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rollNo"
                    className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-1.5"
                  >
                    Roll Number
                  </label>
                  <input
                    id="rollNo"
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="e.g. DIT-2024-042"
                    className="w-full rounded-xl border border-[#223040] bg-[#0B0F14] px-4 py-2.5 text-sm text-[#EAF2F5] placeholder-[#8CA0AD]/40 focus:border-[#4F9C8F] focus:outline-none focus:ring-1 focus:ring-[#4F9C8F] transition-all font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-1.5"
                  >
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full rounded-xl border border-[#223040] bg-[#0B0F14] px-4 py-2.5 text-sm text-[#EAF2F5] placeholder-[#8CA0AD]/40 focus:border-[#4F9C8F] focus:outline-none focus:ring-1 focus:ring-[#4F9C8F] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Year selection */}
              <div>
                <label
                  htmlFor="year"
                  className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-1.5"
                >
                  Year of Study
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setFormData({ ...formData, year: y })}
                      className={`py-2 rounded-xl text-xs font-mono font-semibold transition-all border ${
                        formData.year === y
                          ? "bg-[#4F9C8F] text-[#0B0F14] border-[#4F9C8F]"
                          : "bg-[#0B0F14] text-[#8CA0AD] border-[#223040] hover:text-[#EAF2F5]"
                      }`}
                    >
                      Year {y}
                    </button>
                  ))}
                </div>
              </div>

              {status === "error" && (
                <div className="rounded-xl bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-xl bg-[#4F9C8F] hover:bg-[#5db4a5] disabled:opacity-50 px-4 py-3 text-sm font-semibold text-[#0B0F14] transition-all shadow-md shadow-[#4F9C8F]/20 flex items-center justify-center gap-2 mt-4"
              >
                {status === "submitting" ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#0B0F14] border-t-transparent animate-spin" />
                    <span>Enrolling in campus squad...</span>
                  </>
                ) : (
                  <span>Complete Registration & Join Squad →</span>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-[#8CA0AD]">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#4F9C8F] hover:underline">
                    Sign in here
                  </Link>
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
