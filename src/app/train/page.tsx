
import React from "react";
import { Metadata } from "next";
import nextDynamic from "next/dynamic";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FitForge Live AI Trainer | On-Device Pose Tracking",
  description:
    "Real-time edge computer vision workout monitoring with live posture correction, rep counting, and deterministic biomechanics.",
};

// Pure client-side dynamic loading with SSR disabled so landing page and other pages have 0 bundle overhead
const CameraStage = nextDynamic(
  () => import("@/components/train/CameraStage"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--ff-bg-primary)] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--ff-accent)]/20 border-t-[var(--ff-accent)] animate-spin" />
          <h2 className="text-base font-bold text-[var(--ff-text-primary)]">
            Loading FitForge AI Pose Pipeline...
          </h2>
          <p className="text-xs text-[var(--ff-text-secondary)] leading-relaxed">
            Initializing local WebAssembly biomechanics vision models directly in your browser.
          </p>
        </div>
      </div>
    ),
  }
);

export default function TrainPage() {
  return <CameraStage />;
}
