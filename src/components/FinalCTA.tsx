"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FinalCTA() {
  return (
    <section
      id="final-cta"
      className="relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#0B0F14] via-[#101720] to-[#0B0F14]"
      aria-label="Final Call to Action"
    >
      {/* Background ambient glowing spheres */}
      <div className="absolute inset-0 pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#4F9C8F]/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-[#FFD166]/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#2ECC71]/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-3xl border border-[#223040] bg-[#131A22]/80 backdrop-blur-2xl p-8 sm:p-12 md:p-16 text-center shadow-2xl shadow-black/80 overflow-hidden"
        >
          {/* Subtle accent border line on top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4F9C8F] to-transparent" />

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#223040] bg-[#0B0F14]/90 px-4 py-1.5 text-xs font-mono text-[#4F9C8F] mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
            <span>LIVE CAMPUS SYSTEM • SIH PS 26196</span>
          </div>

          {/* Headline — Playfair Display ONLY (exact text from requirement) */}
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#EAF2F5] text-balance mb-6">
            Consistency is the real problem. <br className="hidden sm:inline" />
            <span className="gradient-text italic">We solved for that.</span>
          </h2>

          {/* Subheading */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#8CA0AD] font-sans leading-relaxed mb-10 text-balance">
            By continuously monitoring early dropout indicators, auto-downgrading habit friction,
            and mobilizing peer squad support, FitForge ensures students never quit fitness in silence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {/* Primary Button — Exact text linking to /analytics */}
            <Link
              href="/analytics"
              id="view-live-dashboard-btn"
              aria-label="View the live FitForge analytics dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#4F9C8F] hover:bg-[#5db4a5] px-8 py-4 text-base font-semibold text-[#0B0F14] transition-all duration-200 shadow-lg shadow-[#4F9C8F]/20 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F9C8F]"
            >
              <span>View Live Dashboard</span>
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            {/* Secondary Button */}
            <Link
              href="/register"
              aria-label="Register and join your campus fitness squad"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-[#223040] bg-[#0B0F14]/70 hover:bg-[#131A22] px-8 py-4 text-base font-semibold text-[#8CA0AD] hover:text-[#EAF2F5] hover:border-[#4F9C8F]/40 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F9C8F]"
            >
              Join Your Campus Squad →
            </Link>
          </div>

          {/* Trust markers / Proof stats */}
          <div className="pt-8 border-t border-[#223040]/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="block text-2xl font-mono font-bold text-[#EAF2F5]">5</span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#8CA0AD]">Colleges</span>
            </div>
            <div>
              <span className="block text-2xl font-mono font-bold text-[#4F9C8F]">50</span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#8CA0AD]">Students Tracked</span>
            </div>
            <div>
              <span className="block text-2xl font-mono font-bold text-[#2ECC71]">100%</span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#8CA0AD]">Explainable Rules</span>
            </div>
            <div>
              <span className="block text-2xl font-mono font-bold text-[#FFD166]">0</span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#8CA0AD]">Broken Streaks Guilt</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
