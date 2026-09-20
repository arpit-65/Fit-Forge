import HeroCanvasAnimation from "@/components/HeroCanvasAnimation";
import RiskEngineSection from "@/components/RiskEngineSection";
import AdaptFeatureSection, {
  AnalyticsSummaryProps,
} from "@/components/AdaptFeatureSection";
import GoalDowngradeShowcase, {
  GoalDowngradeData,
} from "@/components/GoalDowngradeShowcase";
import FinalCTA from "@/components/FinalCTA";
import {
  getFeaturedStudents,
  getAnalyticsSummary,
  getMechanicExample,
} from "@/lib/queries";
import { FeaturedStudentProps } from "@/components/RiskCard";

export const dynamic = "force-dynamic";

// Fallback analytics state in case of connection standby
const DEFAULT_ANALYTICS: AnalyticsSummaryProps = {
  cohort: {
    totalStudents: 50,
    totalActivities: 738,
    totalSquads: 10,
    totalColleges: 5,
    averageActivitiesPerStudent: 15,
  },
  riskDistribution: {
    low: { count: 23, percentage: 46, band: "LOW (< 0.30)" },
    mid: { count: 6, percentage: 12, band: "MID (0.30–0.59)" },
    high: { count: 20, percentage: 40, band: "HIGH (>= 0.60)" },
    coldStart: {
      count: 1,
      percentage: 2,
      status: "Bootstrap Active (under 7 days)",
    },
  },
  interventions: {
    total: 32,
    active: 31,
    resolved: 1,
    byType: {
      nudge: 4,
      squadNudge: 7,
      goalDowngrade: 20,
      mentorCheckin: 1,
    },
  },
};

const DEFAULT_DOWNGRADE_DATA: GoalDowngradeData = {
  student: "Apoorav Mehta",
  college: "Roorkee Institute of Technology",
  originalGoalMinutes: 30,
  downgradedGoalMinutes: 10,
  originalRiskScore: 0.72,
  targetRiskScore: 0.24,
  currentRiskScore: 0.72,
  topReason: "Missed 4 consecutive challenges",
  formula: "max(10, Math.round(target / 3))",
  rule: "HIGH Risk triggers automatic goal downgrade to reduce friction",
  intervention: {
    type: "GOAL_DOWNGRADE",
    message:
      "Goal requirement eased to reduce friction and encourage workout resumption.",
    firedAt: new Date(),
  },
  challengeTitle: "30-Day Campus Consistency Sprint",
};

/**
 * Landing page — Server Component.
 * FitForge: Campus Fitness Dropout Prevention Platform (SIH PS 26196).
 *
 * Ordered Page Architecture (Step 10):
 * 1. Hero (`HeroCanvasAnimation` with 500vh sticky canvas scrollytelling)
 * 2. Risk Cards (`RiskEngineSection` with 5 student personas & hover reveal)
 * 3. Adapt (`AdaptFeatureSection` with SVG scroll dial & live metrics)
 * 4. Goal Downgrade (`GoalDowngradeShowcase` before/after collapse mechanic)
 * 5. Final CTA (`FinalCTA` linking to `/analytics`)
 */
export default async function LandingPage({
  searchParams,
}: {
  searchParams?: { db_error?: string };
}) {
  let featuredStudents: FeaturedStudentProps[] = [];
  let analytics: AnalyticsSummaryProps = DEFAULT_ANALYTICS;
  let downgradeData: GoalDowngradeData = DEFAULT_DOWNGRADE_DATA;
  let fetchError: string | null = null;

  try {
    if (searchParams?.db_error === "true") {
      throw new Error("Simulated database connection failure");
    }
    const [rawStudents, rawAnalytics, rawMechanic] = await Promise.all([
      getFeaturedStudents(),
      getAnalyticsSummary(),
      getMechanicExample(),
    ]);

    featuredStudents = rawStudents as unknown as FeaturedStudentProps[];
    analytics = rawAnalytics as unknown as AnalyticsSummaryProps;
    if (rawMechanic?.goalDowngradeExample) {
      downgradeData = rawMechanic.goalDowngradeExample as unknown as GoalDowngradeData;
    }
  } catch (err: unknown) {
    console.error("[FitForge] Failed to fetch data for landing page:", err);
    fetchError =
      "Unable to connect to the campus student database right now. The fallback skeleton preview is active.";
  }

  return (
    <div className="relative overflow-hidden bg-[var(--ff-bg-primary)]">
      {/* 1. Hero: 500vh Scrollytelling Hero Canvas */}
      <HeroCanvasAnimation />

      {/* Background glow accents */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-[510vh] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--ff-accent)]/10 blur-[140px]" />
        <div className="absolute right-0 top-[560vh] h-[400px] w-[400px] rounded-full bg-[var(--ff-gold)]/5 blur-[120px]" />
        <div className="absolute left-0 bottom-0 h-[450px] w-[450px] rounded-full bg-[var(--ff-risk-low)]/5 blur-[130px]" />
      </div>

      {/* 2. Risk Cards: Risk Engine Showcase Section (id="risk-engine") */}
      <RiskEngineSection students={featuredStudents} error={fetchError} />

      {/* 3. Adapt: Adapt Feature Section with SVG Risk Dial */}
      <AdaptFeatureSection analytics={analytics} />

      {/* 4. Goal Downgrade: Core Mechanic Showcase */}
      <GoalDowngradeShowcase data={downgradeData} />

      {/* 5. Final CTA: "Consistency is the real problem. We solved for that." */}
      <FinalCTA />
    </div>
  );
}
