"use client";

import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";

export interface AnalyticsSummaryProps {
  cohort: {
    totalStudents: number;
    totalActivities: number;
    totalSquads: number;
    totalColleges: number;
    averageActivitiesPerStudent: number;
  };
  riskDistribution: {
    low: { count: number; percentage: number; band: string };
    mid: { count: number; percentage: number; band: string };
    high: { count: number; percentage: number; band: string };
    coldStart: { count: number; percentage: number; status: string };
  };
  interventions: {
    total: number;
    active: number;
    resolved: number;
    byType: {
      nudge: number;
      squadNudge: number;
      goalDowngrade: number;
      mentorCheckin: number;
    };
  };
}

interface AdaptFeatureSectionProps {
  analytics: AnalyticsSummaryProps;
}

export default function AdaptFeatureSection({
  analytics,
}: AdaptFeatureSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll through this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <section
      ref={containerRef}
      className="relative bg-[var(--ff-bg-primary)] py-24 text-[var(--ff-text-primary)] border-t border-[var(--ff-border)]/50"
      id="adapt-features"
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Section Header (Playfair Display for section title)                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)] px-4 py-1.5 text-xs text-[var(--ff-accent)] mb-4 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ff-accent)] animate-glow" />
          Engine Mechanics & Architecture
        </div>

        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--ff-text-primary)] mb-5">
          Built to Adapt <span className="gradient-text italic">When Life Happens</span>
        </h2>

        <p className="font-sans text-base sm:text-lg text-[var(--ff-text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Traditional apps reward the top 5% who never miss. FitForge is engineered specifically to prevent the other 95% from giving up.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3-Column Alternating Container: Left / Sticky Dial / Right          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_380px_1.1fr] gap-8 lg:gap-10 items-start relative">
          {/* Sticky Center Dial Column (sticks on desktop as user scrolls through items) */}
          <div className="lg:order-2 order-first lg:sticky lg:top-28 z-20 flex justify-center pb-8 lg:pb-0">
            <SvgRiskDial
              progress={smoothProgress}
              analytics={analytics}
            />
          </div>

          {/* Feature 1: Left Text, Right Visual (Day 0–7 Bootstrap) */}
          <div className="lg:order-1 order-2 space-y-36">
            {/* Feature 1: Left Text */}
            <FeatureTextCard
              tag="Rule 1: Cold-Start Bootstrap"
              title="Personalized from day one."
              description="New students aren't thrown into aggressive algorithmic rankings. Under 7 days enrolled, the risk engine activates bootstrapActive mode, establishing baseline movement habits without premature risk penalties or pressure."
              codeAnchor="src/lib/risk/engine.ts: under 7 days -> bootstrapActive = true, score = null"
              badgeColor="border-[var(--ff-accent)]/30 text-[var(--ff-accent)]"
            />

            {/* Feature 2: Left Visual (Adapts when you slip) */}
            <FeatureStatCard
              title="Progressive Goal Easing"
              metric={`${analytics.interventions.byType.goalDowngrade} Goals Eased`}
              subtext="Automatic targets reduced by up to 66% during high dropout risk windows"
              accentColor="text-[var(--ff-risk-mid)] border-[var(--ff-risk-mid)]/30 bg-[var(--ff-risk-mid)]/5"
              stats={[
                { label: "Formula", value: "max(10, target / 3)" },
                { label: "High Risk Share", value: `${analytics.riskDistribution.high.percentage}%` },
                { label: "Coach Escalation", value: "3+ days high" },
              ]}
            />

            {/* Feature 3: Left Text */}
            <FeatureTextCard
              tag="Rule 3: Localized Divisions"
              title="Never a global leaderboard."
              description="Nothing discourages a beginner faster than sitting at #4,821 behind campus varsity athletes. FitForge groups students into localized 5-tier college leagues (Bronze to Diamond). You only compete with peers in your own rhythm tier."
              codeAnchor="prisma/schema.prisma: LeagueMember tier rankings & points ledger"
              badgeColor="border-[var(--ff-gold)]/30 text-[var(--ff-gold)]"
            />

            {/* Feature 4: Left Visual (Your squad has your back) */}
            <FeatureStatCard
              title="Cohort Accountability"
              metric={`${analytics.cohort.totalSquads} Campus Squads`}
              subtext="5–10 students per squad with automated peer nudge triggers"
              accentColor="text-[var(--ff-risk-low)] border-[var(--ff-risk-low)]/30 bg-[var(--ff-risk-low)]/5"
              stats={[
                { label: "Squad Nudges", value: `${analytics.interventions.byType.squadNudge}` },
                { label: "Avg Workouts", value: `${analytics.cohort.averageActivitiesPerStudent} / student` },
                { label: "Colleges", value: `${analytics.cohort.totalColleges}` },
              ]}
            />
          </div>

          {/* Column 3: Alternating Pairs */}
          <div className="lg:order-3 order-3 space-y-36">
            {/* Feature 1: Right Visual */}
            <FeatureStatCard
              title="Baseline Onboarding"
              metric={`${analytics.riskDistribution.coldStart.count} Enrolled`}
              subtext="Students in Day 1–7 bootstrap observation phase"
              accentColor="text-[var(--ff-accent)] border-[var(--ff-accent)]/30 bg-[var(--ff-accent)]/5"
              stats={[
                { label: "Observation Window", value: "7 Days" },
                { label: "Pre-scoring Penalties", value: "0%" },
                { label: "Status", value: "Active Tracking" },
              ]}
            />

            {/* Feature 2: Right Text */}
            <FeatureTextCard
              tag="Rule 2: The Intervention Ladder"
              title="Adapts when you slip."
              description="When attendance wavers, fitness trackers shame you with broken streaks. FitForge does the opposite: it eases the active challenge target (max(10, target / 3)) to lower cognitive friction, triggering 1-on-1 mentor support if high risk persists."
              codeAnchor="src/lib/risk/ladder.ts: evaluateInterventionLadder() -> GOAL_DOWNGRADE"
              badgeColor="border-[var(--ff-risk-high)]/30 text-[var(--ff-risk-high)]"
            />

            {/* Feature 3: Right Visual */}
            <FeatureStatCard
              title="Campus League Tiers"
              metric="5 Distinct Tiers"
              subtext="Bronze · Silver · Gold · Platinum · Diamond"
              accentColor="text-[var(--ff-gold)] border-[var(--ff-gold)]/30 bg-[var(--ff-gold)]/5"
              stats={[
                { label: "Cohort Colleges", value: `${analytics.cohort.totalColleges}` },
                { label: "Total Activities", value: `${analytics.cohort.totalActivities}` },
                { label: "Fair Matchmaking", value: "100%" },
              ]}
            />

            {/* Feature 4: Right Text */}
            <FeatureTextCard
              tag="Rule 4: Peer Support"
              title="Your squad has your back."
              description="Students don't drop out because workouts are hard — they drop out because they feel alone. In FitForge, when your consistency slips into mid-risk, your teammates receive an empathetic AI prompt to check in before you disconnect."
              codeAnchor="src/lib/ai.ts: generateNudge() with kind, non-shaming peer copy"
              badgeColor="border-[var(--ff-risk-low)]/30 text-[var(--ff-risk-low)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SvgRiskDial (Center element sweeping green -> amber -> red on scroll)
// ─────────────────────────────────────────────────────────────────────────────

interface SvgRiskDialProps {
  progress: MotionValue<number>;
  analytics: AnalyticsSummaryProps;
}

function SvgRiskDial({ progress, analytics }: SvgRiskDialProps) {
  // Map progress (0 to 1) to rotation (-100 to +100 degrees)
  const needleRotation = useTransform(progress, [0, 1], [-100, 100]);

  // Dynamic color interpolation: Green -> Amber -> Red
  const arcStroke = useTransform(
    progress,
    [0, 0.35, 0.7, 1],
    ["#2ECC71", "#F5A623", "#E5484D", "#E5484D"]
  );

  const [score, setScore] = React.useState(0);
  const [riskLabel, setRiskLabel] = React.useState("LOW RISK");
  const [riskBandColor, setRiskBandColor] = React.useState("text-[var(--ff-risk-low)]");

  React.useEffect(() => {
    return progress.on("change", (v) => {
      const s = Math.min(100, Math.max(0, Math.round(v * 100)));
      setScore(s);
      if (v < 0.28) {
        setRiskLabel("LOW RISK");
        setRiskBandColor("text-[var(--ff-risk-low)]");
      } else if (v < 0.65) {
        setRiskLabel("MID RISK");
        setRiskBandColor("text-[var(--ff-risk-mid)]");
      } else {
        setRiskLabel("HIGH RISK");
        setRiskBandColor("text-[var(--ff-risk-high)]");
      }
    });
  }, [progress]);

  // SVG Gauge geometry constants
  const size = 300;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth - 10;
  // Circumference of semi-circle arc
  const arcLength = Math.PI * radius;

  // Stroke dash offset mapped to progress
  const strokeDashoffset = useTransform(progress, [0, 1], [arcLength, 0]);

  return (
    <div className="w-full max-w-[340px] rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-bg-secondary)]/90 p-6 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-center">
      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ff-text-secondary)] mb-2">
        <span>CAMPUS RISK DIAL</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--ff-accent)] animate-glow" />
          LIVE
        </span>
      </div>

      {/* SVG Speedometer Gauge */}
      <div className="relative flex items-center justify-center -my-2">
        <svg width={size} height={size * 0.68} viewBox={`0 0 ${size} ${size * 0.7}`}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2ECC71" />
              <stop offset="50%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#E5484D" />
            </linearGradient>
            <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#4F9C8F" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="rgba(34, 48, 64, 0.45)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Animated Sweeping Arc */}
          <motion.path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke={arcStroke}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            filter="url(#dialGlow)"
          />

          {/* Ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const angle = -Math.PI + ratio * Math.PI;
            const x1 = center + (radius - 12) * Math.cos(angle);
            const y1 = center + (radius - 12) * Math.sin(angle);
            const x2 = center + (radius + 2) * Math.cos(angle);
            const y2 = center + (radius + 2) * Math.sin(angle);
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(140, 160, 173, 0.4)"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Center Needle Pivot */}
          <motion.g
            style={{
              originX: `${center}px`,
              originY: `${center}px`,
              rotate: needleRotation,
            }}
          >
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - radius + 14}
              stroke="#EAF2F5"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={center} cy={center} r={7} fill="#EAF2F5" />
            <circle cx={center} cy={center} r={3} fill="#0B0F14" />
          </motion.g>
        </svg>
      </div>

      {/* Real Database Readouts */}
      <div className="space-y-3 pt-2">
        <div>
          <div className="text-4xl font-black font-mono tracking-tight text-[var(--ff-text-primary)]">
            <span>{score}</span>
            <span className="text-xl text-[var(--ff-text-secondary)] font-normal ml-0.5">
              %
            </span>
          </div>

          <div
            className={`text-xs font-bold font-mono tracking-wider uppercase mt-0.5 ${riskBandColor}`}
          >
            <span>{riskLabel}</span>
          </div>
        </div>

        {/* Live Database Distribution Breakdown */}
        <div className="rounded-xl border border-[var(--ff-border)]/60 bg-[var(--ff-bg-primary)]/70 p-3 text-left space-y-2">
          <div className="text-[10px] font-mono uppercase text-[var(--ff-text-secondary)] tracking-wider flex justify-between">
            <span>Database Cohort</span>
            <span>{analytics.cohort.totalStudents} Students</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
            <div className="rounded-lg bg-[var(--ff-risk-low)]/10 p-1.5 border border-[var(--ff-risk-low)]/25">
              <div className="text-[var(--ff-risk-low)] font-bold">
                {analytics.riskDistribution.low.percentage}%
              </div>
              <div className="text-[9px] text-[var(--ff-text-secondary)]">LOW</div>
            </div>

            <div className="rounded-lg bg-[var(--ff-risk-mid)]/10 p-1.5 border border-[var(--ff-risk-mid)]/25">
              <div className="text-[var(--ff-risk-mid)] font-bold">
                {analytics.riskDistribution.mid.percentage}%
              </div>
              <div className="text-[9px] text-[var(--ff-text-secondary)]">MID</div>
            </div>

            <div className="rounded-lg bg-[var(--ff-risk-high)]/10 p-1.5 border border-[var(--ff-risk-high)]/25">
              <div className="text-[var(--ff-risk-high)] font-bold">
                {analytics.riskDistribution.high.percentage}%
              </div>
              <div className="text-[9px] text-[var(--ff-text-secondary)]">HIGH</div>
            </div>
          </div>

          {/* Interventions Fired Banner */}
          <div className="pt-2 border-t border-[var(--ff-border)]/50 flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--ff-text-secondary)]">Interventions:</span>
            <span className="font-bold text-[var(--ff-accent)]">
              {analytics.interventions.total} Fired ({analytics.interventions.byType.goalDowngrade} Downgrades)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Text Card (Left/Right narrative explanation)
// ─────────────────────────────────────────────────────────────────────────────

interface FeatureTextCardProps {
  tag: string;
  title: string;
  description: string;
  codeAnchor: string;
  badgeColor: string;
}

function FeatureTextCard({
  tag,
  title,
  description,
  codeAnchor,
  badgeColor,
}: FeatureTextCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-4"
    >
      <div
        className={`inline-flex items-center gap-2 rounded-full border bg-[var(--ff-bg-secondary)] px-3.5 py-1 text-xs font-mono ${badgeColor}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {tag}
      </div>

      <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--ff-text-primary)]">
        {title}
      </h3>

      <p className="font-sans text-sm sm:text-base text-[var(--ff-text-secondary)] leading-relaxed">
        {description}
      </p>

      <div className="rounded-xl border border-[var(--ff-border)]/60 bg-[var(--ff-bg-secondary)]/60 p-2.5 font-mono text-[11px] text-[var(--ff-accent)] line-clamp-1">
        <span className="text-[var(--ff-text-secondary)]">Logic: </span>
        {codeAnchor}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Stat Card (Left/Right visual badge & live numbers)
// ─────────────────────────────────────────────────────────────────────────────

interface FeatureStatCardProps {
  title: string;
  metric: string;
  subtext: string;
  accentColor: string;
  stats: Array<{ label: string; value: string }>;
}

function FeatureStatCard({
  title,
  metric,
  subtext,
  accentColor,
  stats,
}: FeatureStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`rounded-2xl border p-6 backdrop-blur-xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)] ${accentColor}`}
    >
      <div className="text-xs font-mono uppercase tracking-wider text-[var(--ff-text-secondary)] mb-2">
        {title}
      </div>

      <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--ff-text-primary)] mb-1">
        {metric}
      </div>

      <p className="text-xs text-[var(--ff-text-secondary)] mb-5 leading-relaxed">
        {subtext}
      </p>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--ff-border)]/40 font-mono">
        {stats.map((s, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="text-[10px] text-[var(--ff-text-secondary)] truncate">
              {s.label}
            </div>
            <div className="text-xs font-bold text-[var(--ff-text-primary)] truncate">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
