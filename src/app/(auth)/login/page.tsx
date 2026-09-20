"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid university email address.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isMock = !supabaseUrl || supabaseUrl.includes("YOUR_PROJECT_REF");

      if (isMock) {
        // Prototype mode fallback
        setTimeout(() => {
          setStatus("sent");
        }, 600);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        throw error;
      }

      setStatus("sent");
    } catch (err: unknown) {
      console.error("[FitForge Auth Error]", err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send magic link. Please retry."
      );
    }
  };

  const handleDemoLogin = () => {
    // Quick demonstration redirect
    router.push("/analytics");
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#EAF2F5] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#4F9C8F] selection:text-[#0B0F14]">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4F9C8F]/10 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-[#4F9C8F] animate-pulse" />
            <span className="font-display text-2xl font-bold tracking-tight text-[#EAF2F5]">
              FitForge
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#EAF2F5]">
            Sign in with Magic Link
          </h1>
          <p className="text-xs sm:text-sm text-[#8CA0AD] mt-2">
            Passwordless campus authentication powered by Supabase Auth.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-[#223040] bg-[#131A22]/90 backdrop-blur-xl p-8 shadow-2xl shadow-black/80">
          {status === "sent" ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-2xl">
                ✉️
              </div>
              <h3 className="text-lg font-bold text-[#EAF2F5]">Check your inbox</h3>
              <p className="text-xs text-[#8CA0AD] leading-relaxed">
                We sent a passwordless sign-in link to{" "}
                <span className="font-mono text-[#4F9C8F] font-semibold">{email}</span>.
                Click the link in your email to instantly enter FitForge.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="text-xs font-mono text-[#8CA0AD] hover:text-[#4F9C8F] underline pt-2"
              >
                Use a different email address
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-mono uppercase tracking-wider text-[#8CA0AD] mb-2"
                >
                  Campus Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@rit.edu.in"
                  className="w-full rounded-xl border border-[#223040] bg-[#0B0F14] px-4 py-3 text-sm text-[#EAF2F5] placeholder-[#8CA0AD]/50 focus:border-[#4F9C8F] focus:outline-none focus:ring-1 focus:ring-[#4F9C8F] transition-all font-mono"
                />
              </div>

              {status === "error" && (
                <div className="rounded-xl bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-[#4F9C8F] hover:bg-[#5db4a5] disabled:opacity-50 px-4 py-3 text-sm font-semibold text-[#0B0F14] transition-all shadow-md shadow-[#4F9C8F]/20 flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#0B0F14] border-t-transparent animate-spin" />
                    <span>Sending magic link...</span>
                  </>
                ) : (
                  <span>Send Magic Link →</span>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#223040]" />
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                  <span className="bg-[#131A22] px-2 text-[#8CA0AD]">Or evaluate platform</span>
                </div>
              </div>

              {/* 1-Click Demo Access */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#8CA0AD] block text-center uppercase tracking-wider">
                  One-Tap Athlete Sign-In:
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard?email=arpit.sharma@dit.edu.in")}
                    className="p-2 rounded-xl border border-[#223040] bg-[#0B0F14] hover:border-[#4F9C8F] hover:text-[#EAF2F5] text-[#8CA0AD] text-left transition-all"
                  >
                    <span className="font-bold text-[#4F9C8F] block">Arpit S.</span>
                    <span className="text-[10px] text-[#8CA0AD]">Low Risk · DIT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard?email=apoorav.mehta@rit.edu.in")}
                    className="p-2 rounded-xl border border-red-500/30 bg-red-950/20 hover:border-red-500 hover:text-[#EAF2F5] text-red-300 text-left transition-all"
                  >
                    <span className="font-bold text-red-400 block">Apoorav M.</span>
                    <span className="text-[10px] text-red-300/70">High Risk · RIT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard?email=ritika.bisht@sce.edu.in")}
                    className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500 hover:text-[#EAF2F5] text-emerald-300 text-left transition-all"
                  >
                    <span className="font-bold text-emerald-400 block">Ritika B.</span>
                    <span className="text-[10px] text-emerald-300/70">Recovered · SCE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard?email=pankaj.negi@its.edu.in")}
                    className="p-2 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:border-amber-500 hover:text-[#EAF2F5] text-amber-300 text-left transition-all"
                  >
                    <span className="font-bold text-amber-400 block">Pankaj N.</span>
                    <span className="text-[10px] text-amber-300/70">Squad Nudge · ITS</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full rounded-xl border border-[#223040] bg-[#0B0F14]/60 hover:bg-[#0B0F14] px-4 py-2.5 text-xs font-mono text-[#8CA0AD] hover:text-[#EAF2F5] hover:border-[#4F9C8F]/40 transition-all text-center mt-2"
              >
                🚀 Continue to Campus Analytics Dashboard
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs font-mono text-[#8CA0AD]/70 mt-8">
          FitForge SIH PS 26196 • Dehradun & Roorkee Campus Cohort
        </p>
      </div>
    </div>
  );
}
