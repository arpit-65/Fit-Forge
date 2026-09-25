'use client';

import React, { useState, useEffect } from 'react';

export default function ActiveHIITSession() {
  const [isHapticOn, setIsHapticOn] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(24);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = `00:${secondsRemaining < 10 ? '0' : ''}${secondsRemaining}`;

  return (
    <div className="bg-surface font-body-md text-body-md flex flex-col min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] pt-safe">
        <div className="h-16 px-gutter flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Exit Session"
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="flex flex-col">
              <span className="text-label-badge font-label-badge uppercase text-secondary-fixed tracking-wider">
                Active HIIT Session
              </span>
              <h1 className="text-headline-sm font-headline-sm text-on-surface truncate max-w-[140px]">
                Active Hiit Circuit
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <div className="flex items-center gap-1 bg-surface-container-highest px-space-xs py-1 rounded-full">
              <span className="material-symbols-outlined text-primary-container text-[14px]">repeat</span>
              <span className="font-label-data text-label-data text-primary-container tracking-wider">SET 04/12</span>
            </div>
            <button
              aria-label="Mute audio"
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-secondary-fixed transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">volume_up</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface px-gutter">
        <div className="flex flex-col w-full pb-6 space-y-space-md">
          {/* 1. Circuit Navigation Chips */}
          <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-space-2xs">
            {/* Chip 1: Completed */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant shrink-0 cursor-default select-none shadow-sm">
              <span
                className="material-symbols-outlined text-[16px] text-secondary-fixed-dim"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant">
                1. Goblet Squats
              </span>
            </div>
            {/* Chip 2: Active Highlighted */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary-container shrink-0 cursor-default select-none shadow-[0_0_16px_rgba(202,243,0,0.35)]">
              <span className="w-2 h-2 rounded-full bg-on-primary-container animate-pulse"></span>
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-primary-container">
                2. Push-ups
              </span>
            </div>
            {/* Chip 3: Upcoming */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant/70 shrink-0 cursor-default select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-variant"></span>
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant/80">
                3. Forearm Plank
              </span>
            </div>
          </div>
          {/* 2. Header & Exercise Telemetry */}
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-fixed animate-ping"></span>
                <span className="font-label-badge text-label-badge uppercase tracking-widest text-primary-fixed">
                  EXERCISE 2 OF 3 • WORK INTERVAL
                </span>
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary-fixed font-label-data text-label-data tracking-wider">
                RPE 8.0
              </div>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                Standard Military Push-ups
              </h2>
              <span className="font-label-data text-label-data text-secondary-fixed tracking-widest uppercase">
                SET 2/4
              </span>
            </div>
            {/* Telemetry Grid (4 Metric Cards) */}
            <div className="grid grid-cols-2 gap-space-xs pt-space-2xs">
              {/* LOAD */}
              <div className="p-3 rounded-xl bg-surface-container flex flex-col justify-between space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant">
                    LOAD
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim">
                    fitness_center
                  </span>
                </div>
                <div className="font-label-data text-[15px] leading-tight font-bold text-on-surface">Bodyweight</div>
              </div>
              {/* TEMPO CADENCE */}
              <div className="p-3 rounded-xl bg-surface-container flex flex-col justify-between space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant">
                    TEMPO CADENCE
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-primary-fixed">speed</span>
                </div>
                <div className="font-timer-display-mobile text-[18px] leading-tight text-primary-fixed tracking-tight">
                  2-1-1-0
                </div>
              </div>
              {/* TARGET VOLUME */}
              <div className="p-3 rounded-xl bg-surface-container flex flex-col justify-between space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant">
                    TARGET VOLUME
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim">flag</span>
                </div>
                <div className="font-label-data text-[15px] leading-tight font-bold text-on-surface">15-20 Reps</div>
              </div>
              {/* BIOMETRICS */}
              <div className="p-3 rounded-xl bg-surface-container flex flex-col justify-between space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span
                    className="material-symbols-outlined text-[18px] text-error"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                </div>
                <div className="font-label-data text-[14px] leading-tight font-bold text-on-surface">
                  158 <span className="text-secondary-fixed text-[11px] font-normal">BPM (Zone 3)</span>
                </div>
              </div>
            </div>
          </div>
          {/* 3. Circular Interval Timer Hub */}
          <div className="relative flex flex-col items-center justify-center p-space-md rounded-2xl bg-surface-container-low shadow-md overflow-hidden">
            {/* Ambient Luminous Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary-fixed/5 via-transparent to-transparent pointer-events-none"></div>
            {/* Circular Dial */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
                {/* Track */}
                <circle cx="120" cy="120" fill="transparent" r="102" stroke="#1c2025" strokeWidth="12"></circle>
                {/* Progress Arc */}
                <circle
                  className="transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_rgba(202,243,0,0.6)]"
                  cx="120"
                  cy="120"
                  fill="transparent"
                  r="102"
                  stroke="#caf300"
                  strokeDasharray="640.88"
                  strokeDashoffset={640.88 - (secondsRemaining / 45) * 640.88}
                  strokeLinecap="round"
                  strokeWidth="12"
                ></circle>
                {/* Minor Tick Dial Layer */}
                <circle
                  cx="120"
                  cy="120"
                  fill="transparent"
                  r="88"
                  stroke="#31353b"
                  strokeDasharray="2 12"
                  strokeWidth="1.5"
                ></circle>
              </svg>
              {/* Center Telemetry Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed/10 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-ping"></span>
                  <span className="font-label-badge text-label-badge uppercase tracking-widest text-primary-fixed">
                    WORK PHASE
                  </span>
                </div>
                <span
                  className="font-timer-display-mobile text-timer-display-mobile text-on-surface tracking-tighter tabular-nums drop-shadow-sm leading-none my-1"
                  id="interval-timer-digits"
                >
                  {formattedTime}
                </span>
                <span className="font-label-data text-label-data uppercase tracking-wider text-on-surface-variant">
                  REMAINING OF 45S
                </span>
              </div>
            </div>
            {/* Sub-telemetry & Live EQ Spectrum */}
            <div className="w-full grid grid-cols-2 gap-space-xs mt-space-sm pt-space-xs border-t-0 bg-surface-container/60 p-2.5 rounded-xl">
              <div className="flex flex-col justify-center">
                <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant">
                  SET CYCLE
                </span>
                <span className="font-label-data text-label-data text-on-surface font-semibold">Interval 02 / 04</span>
              </div>
              <div className="flex flex-col justify-center items-end">
                <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant">
                  PHASE TRANSITION
                </span>
                <span className="font-label-data text-label-data text-secondary-fixed font-semibold">
                  Next: 15s Rest
                </span>
              </div>
            </div>
            {/* Live HR Spectrum Bars */}
            <div className="w-full mt-space-xs flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-high/60">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[18px] text-error animate-pulse"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  ecg_heart
                </span>
                <span className="font-label-badge text-label-badge uppercase tracking-widest text-on-surface-variant">
                  HR TELEMETRY
                </span>
              </div>
              {/* Real-time Audio/Spectrum Bars */}
              <div className="flex items-end gap-1 h-5">
                <div className="w-1 h-2 rounded-full bg-secondary-fixed animate-pulse"></div>
                <div className="w-1 h-4 rounded-full bg-primary-fixed"></div>
                <div className="w-1 h-3 rounded-full bg-primary-fixed"></div>
                <div className="w-1 h-5 rounded-full bg-secondary-fixed"></div>
                <div className="w-1 h-2 rounded-full bg-secondary-fixed"></div>
                <div className="w-1 h-4 rounded-full bg-primary-fixed"></div>
                <div className="w-1 h-3 rounded-full bg-secondary-fixed"></div>
              </div>
              <span className="font-label-data text-label-data text-on-surface font-bold">
                158 <span className="text-on-surface-variant text-[10px] font-normal">BPM</span>
              </span>
            </div>
          </div>
          {/* 4. Push-ups Form Checkpoints */}
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary-fixed-dim">verified</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Form Checkpoints</h3>
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-secondary-fixed/10 text-secondary-fixed font-label-badge text-label-badge uppercase tracking-wider">
                3 OF 4 CHECKED
              </div>
            </div>
            <div className="flex flex-col space-y-2 pt-1">
              {/* Checkpoint 1: LOCKED */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container shadow-sm">
                <span
                  className="material-symbols-outlined text-secondary-fixed text-[22px] shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-[15px] leading-tight text-on-surface font-semibold truncate">
                      Rigid Plank Line &amp; Glutes Braced
                    </span>
                    <span className="font-label-badge text-label-badge uppercase text-secondary-fixed tracking-wider">
                      LOCKED
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Prevent lumbar sagging; tuck pelvis and squeeze core.
                  </p>
                </div>
              </div>
              {/* Checkpoint 2: ALIGNED */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container shadow-sm">
                <span
                  className="material-symbols-outlined text-secondary-fixed text-[22px] shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-[15px] leading-tight text-on-surface font-semibold truncate">
                      Elbows at 45° Arrow Angle
                    </span>
                    <span className="font-label-badge text-label-badge uppercase text-secondary-fixed tracking-wider">
                      ALIGNED
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Protect shoulders; avoid flaring elbows out wide.
                  </p>
                </div>
              </div>
              {/* Checkpoint 3: IN PROGRESS */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high shadow-md">
                <span className="material-symbols-outlined text-primary-fixed text-[22px] shrink-0 mt-0.5 animate-spin">
                  sync
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-[15px] leading-tight text-on-surface font-semibold truncate">
                      Full Chest-to-Deck Depth
                    </span>
                    <span className="font-label-badge text-label-badge uppercase text-primary-fixed tracking-wider">
                      IN PROGRESS
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface mt-0.5 font-medium">
                    Lower until chest hovers 1 inch off deck; neutral neck.
                  </p>
                </div>
              </div>
              {/* Checkpoint 4: UPCOMING */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container/60 opacity-80">
                <span className="material-symbols-outlined text-outline text-[22px] shrink-0 mt-0.5">
                  radio_button_unchecked
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-[15px] leading-tight text-on-surface-variant font-medium truncate">
                      Active Protraction at Lockout
                    </span>
                    <span className="font-label-badge text-label-badge uppercase text-on-surface-variant tracking-wider">
                      UPCOMING
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant/80 mt-0.5">
                    Push the floor away at peak extension; engage serratus.
                  </p>
                </div>
              </div>
            </div>
            {/* Coach Cue Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-highest mt-1 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed/15 flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-primary-fixed text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lightbulb
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                <strong className="text-primary-fixed font-headline-sm text-[13px]">Coach Cue:</strong> Corkscrew hands
                into floor to anchor external shoulder torque.
              </p>
            </div>
          </div>
          {/* 5. Action Toolbar */}
          <div className="grid grid-cols-3 gap-space-xs pt-space-2xs">
            <button
              aria-label="Add 10 seconds of rest"
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-center"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary-fixed mb-0.5">more_time</span>
              <span className="font-label-badge text-label-badge uppercase text-on-surface tracking-wider">
                +10s Rest
              </span>
            </button>
            <button
              aria-label="Add or view form note"
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-center"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant mb-0.5">edit_note</span>
              <span className="font-label-badge text-label-badge uppercase text-on-surface tracking-wider">
                Form Note
              </span>
            </button>
            <button
              aria-label="Toggle haptic feedback"
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-center"
              onClick={() => setIsHapticOn(!isHapticOn)}
            >
              <span
                className={`material-symbols-outlined text-[20px] mb-0.5 ${
                  isHapticOn ? 'text-primary-fixed' : 'text-on-surface-variant'
                }`}
              >
                {isHapticOn ? 'vibration' : 'smartphone'}
              </span>
              <span className="font-label-badge text-label-badge uppercase text-on-surface tracking-wider">
                {isHapticOn ? 'Haptics On' : 'Haptics Off'}
              </span>
            </button>
          </div>
          {/* 6. Up Next Preview */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-secondary-fixed-dim">schedule</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-badge text-label-badge uppercase text-on-surface-variant tracking-wider">
                  UP NEXT IN CIRCUIT
                </span>
                <span className="font-headline-sm text-[15px] leading-tight text-on-surface font-semibold truncate">
                  3. Sustained Forearm Plank (45s)
                </span>
              </div>
            </div>
            <span className="font-label-badge text-label-badge uppercase px-2.5 py-1 rounded-full bg-surface-container-highest text-secondary-fixed tracking-wider shrink-0">
              CORE STABILITY
            </span>
          </div>
        </div>
      </main>
      <aside className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col px-gutter py-space-xs">
          <div className="flex items-center justify-between py-space-2xs">
            <div className="flex items-center gap-space-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface-variant">
                Next: Plyo Box Jump
              </span>
            </div>
            <span className="font-label-data text-label-data text-secondary-fixed-dim">00:45 WORK</span>
          </div>
          <div className="h-14 flex items-center justify-between gap-space-md">
            <button
              aria-label="Previous Interval"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">skip_previous</span>
            </button>
            <button
              aria-label="Pause Workout"
              className="flex-1 h-12 flex items-center justify-center gap-space-xs rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_-4px_rgba(202,243,0,0.35)]"
            >
              <span className="material-symbols-outlined text-[28px]">pause</span>
              <span className="text-label-badge font-label-badge uppercase">Hold to Pause</span>
            </button>
            <button
              aria-label="Skip Interval"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">skip_next</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
