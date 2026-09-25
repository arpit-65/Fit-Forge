"use client";

/**
 * AthleteViewerControls
 * ──────────────────────
 * UI strip rendered below (or above) the 3D canvas with:
 *  • Front / Side view toggle
 *  • Slow-motion speed slider (0.25× – 1×)
 *  • Coach tips caption for the active exercise
 */

import React from "react";
import { EXERCISE_CONFIG, ViewAngle } from "./AthleteViewer";

interface AthleteViewerControlsProps {
  exercise: string;
  motionSpeed: number;
  onSpeedChange: (v: number) => void;
  viewAngle: ViewAngle;
  onViewAngleChange: (v: ViewAngle) => void;
}

export default function AthleteViewerControls({
  exercise,
  motionSpeed,
  onSpeedChange,
  viewAngle,
  onViewAngleChange,
}: AthleteViewerControlsProps) {
  const cfg = EXERCISE_CONFIG[exercise] ?? EXERCISE_CONFIG.squat;
  const speedLabel = `${motionSpeed.toFixed(2)}×`;

  return (
    <div className="w-full px-4 py-3 space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-[#8CA0AD] mr-1">View:</span>
          <button
            type="button"
            onClick={() => onViewAngleChange("front")}
            aria-pressed={viewAngle === "front"}
            className={`px-3 py-1 text-xs font-mono rounded-l-lg border transition-all ${
              viewAngle === "front"
                ? "bg-[#4FC3B8] text-[#0B0F14] border-[#4FC3B8] font-bold"
                : "bg-[#131A22] text-[#8CA0AD] border-[#223040] hover:text-[#EAF2F5]"
            }`}
          >
            ◀ Front
          </button>
          <button
            type="button"
            onClick={() => onViewAngleChange("side")}
            aria-pressed={viewAngle === "side"}
            className={`px-3 py-1 text-xs font-mono rounded-r-lg border transition-all ${
              viewAngle === "side"
                ? "bg-[#4FC3B8] text-[#0B0F14] border-[#4FC3B8] font-bold"
                : "bg-[#131A22] text-[#8CA0AD] border-[#223040] hover:text-[#EAF2F5]"
            }`}
          >
            Side ▶
          </button>
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <span className="text-[11px] font-mono text-[#8CA0AD] shrink-0">Speed:</span>
          <input
            type="range"
            min={0.25}
            max={1}
            step={0.05}
            value={motionSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            aria-label="Motion playback speed"
            className="flex-1 h-1.5 accent-[#4FC3B8] cursor-pointer"
          />
          <span className="text-[11px] font-mono text-[#4FC3B8] w-9 text-right shrink-0">
            {speedLabel}
          </span>
        </div>
      </div>

      {/* Coach tips */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#131A22] border border-[#223040]">
        <span className="text-base shrink-0">🎯</span>
        <div className="space-y-1">
          <p className="text-[11px] font-bold font-mono text-[#4FC3B8] uppercase tracking-wide">
            Form Cues
          </p>
          <ul className="space-y-0.5">
            {cfg.tips.map((tip, i) => (
              <li key={i} className="text-xs text-[#C4D4DC] flex items-start gap-1.5">
                <span className="text-[#4FC3B8] mt-0.5 shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
