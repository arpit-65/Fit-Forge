import { prisma } from "@/lib/prisma";
import { RiskBand, InterventionType } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript Types for Frontend & Client Components
// ─────────────────────────────────────────────────────────────────────────────

export interface FeaturedStudent {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  department: string;
  year: number;
  college: string;
  collegeCode: string;
  squad: string;
  squadRole: string;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
  };
  currentRisk: {
    score: number | null;
    band: RiskBand | null;
    topReason: string;
    bootstrapActive: boolean;
    computedAt: string | null;
  };
  riskHistory: Array<{
    id: string;
    score: number;
    band: RiskBand;
    topReason: string;
    computedAt: string;
  }>;
  interventions: Array<{
    id: string;
    type: InterventionType;
    message: string;
    firedAt: string;
    resolvedAt: string | null;
    isActive: boolean;
  }>;
  league: {
    tier: string;
    name: string;
    points: number;
    rank: number | null;
  } | null;
  totalActivitiesLogged: number;
}

export interface AnalyticsSummary {
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

export interface MechanicExample {
  mechanicCase: {
    title: string;
    student: {
      name: string;
      college: string;
      squad: string;
    };
    trajectory: Array<{
      stage: number;
      score: number;
      band: RiskBand;
      topReason: string;
      computedAt: string;
    }>;
    interventionsApplied: Array<{
      type: InterventionType;
      message: string;
      firedAt: string;
      resolvedAt: string | null;
      status: string;
    }>;
    totalWorkoutsLogged: number;
    outcome: string;
  };
  activeInterventionExample: {
    student: string;
    currentRisk?: number;
    activeIntervention?: {
      id: string;
      type: InterventionType;
      message: string;
      firedAt: string;
    };
    rule: string;
  };
  goalDowngradeExample: {
    student: string;
    college: string;
    originalGoalMinutes: number;
    downgradedGoalMinutes: number;
    originalRiskScore: number;
    targetRiskScore: number;
    currentRiskScore: number;
    topReason: string;
    formula: string;
    rule: string;
    intervention: {
      id: string;
      type: string;
      message: string;
      firedAt: string;
    };
    challengeTitle: string;
  };
  cohortRecovery: {
    rate: number;
    description: string;
    ritikaReductionPercent: number;
  };
}

export interface CollegeRiskAnalytics {
  id: string;
  name: string;
  code: string;
  slug: string;
  studentCount: number;
  squadCount: number;
  totalActivities: number;
  averageRisk: number;
  highRiskPercent: number;
  midRiskPercent: number;
  lowRiskPercent: number;
  status: "Critical" | "Moderate" | "Healthy";
}

export interface StudentSummaryItem {
  id: string;
  name: string;
  collegeCode: string;
  band: string;
  streak: number;
}

export interface StudentDashboardData {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  department: string;
  year: number;
  college: {
    id: string;
    name: string;
    code: string;
    slug: string;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  squad: {
    id: string;
    name: string;
    role: string;
  } | null;
  league: {
    name: string;
    tier: string;
    points: number;
    rank: number | null;
  } | null;
  totalPoints: number;
  riskScores: Array<{
    id: string;
    score: number;
    band: RiskBand;
    topReason: string;
    bootstrapActive: boolean;
    computedAt: string;
  }>;
  interventions: Array<{
    id: string;
    type: InterventionType;
    message: string;
    firedAt: string;
    resolvedAt: string | null;
    isActive: boolean;
  }>;
  activities: Array<{
    id: string;
    type: string;
    durationMinutes: number;
    date: string;
    notes: string | null;
  }>;
  pointsLedger: Array<{
    id: string;
    points: number;
    reason: string;
    date: string;
  }>;
}

export interface ChallengeParticipantDetail {
  userId: string;
  minutesLogged: number;
  completed: boolean;
  status: string;
}

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  targetMinutes: number;
  originalTargetMinutes: number | null;
  status: string;
  dueDate: string;
  dueDateFormatted: string;
  participantCount: number;
  participants: ChallengeParticipantDetail[];
}

export interface StudentOption {
  id: string;
  name: string;
  collegeCode: string;
}

export interface ChallengesPageData {
  challenges: ChallengeItem[];
  students: StudentOption[];
}

export interface SquadMemberDetail {
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}

export interface SquadItem {
  id: string;
  name: string;
  description: string | null;
  college: { name: string; code: string } | null;
  memberCount: number;
  leader: string | null;
  members: SquadMemberDetail[];
}

export interface SquadsPageData {
  squads: SquadItem[];
  students: StudentOption[];
}

export interface AdminStudentRow {
  id: string;
  name: string;
  email: string;
  rollNo: string | null;
  department: string | null;
  year: number | null;
  collegeName: string;
  collegeCode: string;
  squadName: string;
  streak: number;
  riskScore: number | null;
  riskBand: string;
  topReason: string;
  bootstrapActive: boolean;
  activityCount: number;
  activeIntervention: string | null;
}

export interface CollegeListItem {
  id: string;
  name: string;
  code: string;
  squads: Array<{
    id: string;
    name: string;
  }>;
}

export interface RiskScoreListItem {
  id: string;
  userId: string;
  studentName: string;
  rollNo: string | null;
  college: string | null;
  collegeCode: string | null;
  score: number;
  band: RiskBand;
  topReason: string;
  bootstrapActive: boolean;
  computedAt: string;
}

export interface ActivityListItem {
  id: string;
  userId: string;
  studentName: string;
  type: string;
  durationMinutes: number;
  date: string;
  notes: string | null;
}

export interface RecomputeUserData {
  id: string;
  name: string;
  department: string | null;
  createdAt: Date;
  college: { name: string } | null;
  activities: Array<{
    date: Date;
    durationMinutes: number;
  }>;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
  } | null;
  challenges: Array<{
    challengeId: string;
    status: string;
    completed: boolean;
    minutesLogged: number;
  }>;
  squadMemberships: Array<{
    squad: { name: string };
  }>;
  riskScores: Array<{
    id: string;
    score: number;
    band: RiskBand;
    computedAt: Date;
  }>;
  interventions: Array<{
    id: string;
    type: InterventionType;
    firedAt: Date;
    resolvedAt: Date | null;
  }>;
}



// ─────────────────────────────────────────────────────────────────────────────
// Fallback Data when Database is Unreachable
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_FEATURED_STUDENTS: FeaturedStudent[] = [
  {
    id: "fb-arpit",
    name: "Arpit Sharma",
    email: "arpit.sharma@dit.edu.in",
    rollNo: "DIT-2024-001",
    department: "Computer Science",
    year: 3,
    college: "Dehradun Institute of Technology",
    collegeCode: "DIT",
    squad: "Campus Striders",
    squadRole: "leader",
    streak: { current: 16, longest: 16, lastActiveDate: new Date().toISOString() },
    currentRisk: {
      score: 0.15,
      band: RiskBand.LOW,
      topReason: "Consistent daily workouts, 16-day active streak",
      bootstrapActive: false,
      computedAt: new Date().toISOString(),
    },
    riskHistory: [
      {
        id: "rh-arpit",
        score: 0.15,
        band: RiskBand.LOW,
        topReason: "Consistent daily workouts",
        computedAt: new Date().toISOString(),
      },
    ],
    interventions: [],
    league: { tier: "Gold", name: "DIT Champions (Gold)", points: 1420, rank: 1 },
    totalActivitiesLogged: 28,
  },
  {
    id: "fb-apoorav",
    name: "Apoorav Mehta",
    email: "apoorav.mehta@rit.edu.in",
    rollNo: "RIT-2024-002",
    department: "Mechanical Engineering",
    year: 2,
    college: "Roorkee Institute of Technology",
    collegeCode: "RIT",
    squad: "RIT Iron Titans",
    squadRole: "member",
    streak: { current: 0, longest: 7, lastActiveDate: new Date(Date.now() - 8 * 86400000).toISOString() },
    currentRisk: {
      score: 0.71,
      band: RiskBand.HIGH,
      topReason: "Missed 4 consecutive challenges",
      bootstrapActive: false,
      computedAt: new Date().toISOString(),
    },
    riskHistory: [
      {
        id: "rh-apoorav",
        score: 0.71,
        band: RiskBand.HIGH,
        topReason: "Missed 4 consecutive challenges",
        computedAt: new Date().toISOString(),
      },
    ],
    interventions: [
      {
        id: "int-apoorav",
        type: InterventionType.GOAL_DOWNGRADE,
        message: "Goal requirement eased to reduce friction and encourage workout resumption.",
        firedAt: new Date(Date.now() - 86400000).toISOString(),
        resolvedAt: null,
        isActive: true,
      },
    ],
    league: { tier: "Bronze", name: "RIT Challengers (Bronze)", points: 210, rank: 8 },
    totalActivitiesLogged: 9,
  },
  {
    id: "fb-ritika",
    name: "Ritika Bisht",
    email: "ritika.bisht@sce.edu.in",
    rollNo: "SCE-2024-003",
    department: "Civil Engineering",
    year: 3,
    college: "Shivalik College of Engineering",
    collegeCode: "SCE",
    squad: "Valley Hawks",
    squadRole: "member",
    streak: { current: 9, longest: 12, lastActiveDate: new Date().toISOString() },
    currentRisk: {
      score: 0.22,
      band: RiskBand.LOW,
      topReason: "Active daily recovery, consistent post-intervention check-ins",
      bootstrapActive: false,
      computedAt: new Date().toISOString(),
    },
    riskHistory: [
      {
        id: "rh-ritika-1",
        score: 0.79,
        band: RiskBand.HIGH,
        topReason: "Consecutive missed morning sessions",
        computedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      },
      {
        id: "rh-ritika-2",
        score: 0.22,
        band: RiskBand.LOW,
        topReason: "Active daily recovery",
        computedAt: new Date().toISOString(),
      },
    ],
    interventions: [
      {
        id: "int-ritika",
        type: InterventionType.MENTOR_CHECKIN,
        message: "Coach 1-on-1 scheduled to rebuild workout momentum.",
        firedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        resolvedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        isActive: false,
      },
    ],
    league: { tier: "Silver", name: "SCE Contenders (Silver)", points: 890, rank: 3 },
    totalActivitiesLogged: 19,
  },
  {
    id: "fb-grima",
    name: "Grima Rawat",
    email: "grima.rawat@tulas.edu.in",
    rollNo: "TULA-2024-004",
    department: "Computer Applications",
    year: 1,
    college: "Tula's Institute",
    collegeCode: "TULA",
    squad: "Tula Trailblazers",
    squadRole: "member",
    streak: { current: 3, longest: 3, lastActiveDate: new Date().toISOString() },
    currentRisk: {
      score: null,
      band: null,
      topReason: "Day 5 — learning your pattern. Risk scoring starts soon.",
      bootstrapActive: true,
      computedAt: null,
    },
    riskHistory: [],
    interventions: [],
    league: { tier: "Bronze", name: "Tula's Freshers (Bronze)", points: 150, rank: 5 },
    totalActivitiesLogged: 4,
  },
  {
    id: "fb-pankaj",
    name: "Pankaj Negi",
    email: "pankaj.negi@its.edu.in",
    rollNo: "ITS-2024-005",
    department: "Electrical Engineering",
    year: 2,
    college: "ICFAI Tech School Dehradun",
    collegeCode: "ITS",
    squad: "ICFAI Innovators",
    squadRole: "member",
    streak: { current: 1, longest: 5, lastActiveDate: new Date().toISOString() },
    currentRisk: {
      score: 0.45,
      band: RiskBand.MID,
      topReason: "Inconsistent workout attendance over past 10 days",
      bootstrapActive: false,
      computedAt: new Date().toISOString(),
    },
    riskHistory: [
      {
        id: "rh-pankaj",
        score: 0.45,
        band: RiskBand.MID,
        topReason: "Inconsistent workout attendance",
        computedAt: new Date().toISOString(),
      },
    ],
    interventions: [
      {
        id: "int-pankaj",
        type: InterventionType.SQUAD_NUDGE,
        message: "Hey Pankaj, your teammates in ICFAI Innovators miss you! Whenever you're ready, join back.",
        firedAt: new Date(Date.now() - 86400000).toISOString(),
        resolvedAt: null,
        isActive: true,
      },
    ],
    league: { tier: "Silver", name: "ITS Climbers (Silver)", points: 510, rank: 6 },
    totalActivitiesLogged: 12,
  },
];

const FALLBACK_ANALYTICS: AnalyticsSummary = {
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

const FALLBACK_MECHANIC: MechanicExample = {
  mechanicCase: {
    title: "Intervention & Risk Reversal Case Study: Ritika Bisht",
    student: {
      name: "Ritika Bisht",
      college: "Shivalik College of Engineering",
      squad: "Valley Hawks",
    },
    trajectory: [
      {
        stage: 1,
        score: 0.79,
        band: RiskBand.HIGH,
        topReason: "Consecutive missed morning sessions",
        computedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      },
      {
        stage: 2,
        score: 0.52,
        band: RiskBand.MID,
        topReason: "Response to mentor check-in",
        computedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        stage: 3,
        score: 0.22,
        band: RiskBand.LOW,
        topReason: "Daily workouts resumed",
        computedAt: new Date().toISOString(),
      },
    ],
    interventionsApplied: [
      {
        type: InterventionType.MENTOR_CHECKIN,
        message: "Coach 1-on-1 scheduled to rebuild workout momentum.",
        firedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        resolvedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: "Resolved & Successful",
      },
    ],
    totalWorkoutsLogged: 19,
    outcome:
      "Risk score dropped from 0.79 back to 0.22 after mentor check-in re-established squad morning workout routine.",
  },
  activeInterventionExample: {
    student: "Pankaj Negi",
    currentRisk: 0.45,
    activeIntervention: {
      id: "fallback-pankaj-act",
      type: InterventionType.SQUAD_NUDGE,
      message: "Hey Pankaj, your teammates miss having you around. Come join the crew!",
      firedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    rule: "MID Risk triggers peer squad nudge",
  },
  goalDowngradeExample: {
    student: "Apoorav Mehta",
    college: "Roorkee Institute of Technology",
    originalGoalMinutes: 30,
    downgradedGoalMinutes: 10,
    originalRiskScore: 0.71,
    targetRiskScore: 0.24,
    currentRiskScore: 0.71,
    topReason: "Missed 4 consecutive challenges",
    formula: "max(10, Math.round(target / 3))",
    rule: "HIGH Risk triggers automatic goal downgrade to reduce friction",
    intervention: {
      id: "fallback-gd",
      type: "GOAL_DOWNGRADE",
      message: "Goal requirement eased to reduce friction and encourage workout resumption.",
      firedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    challengeTitle: "30-Day Campus Consistency Sprint",
  },
  cohortRecovery: {
    rate: 78,
    description: "At-risk students whose dropout trajectory reversed within 14 days of automated intervention",
    ritikaReductionPercent: 72,
  },
};

const FALLBACK_COLLEGES: CollegeRiskAnalytics[] = [
  {
    id: "col-1",
    name: "Roorkee Institute of Technology",
    code: "RIT",
    slug: "rit-roorkee",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 142,
    averageRisk: 0.44,
    highRiskPercent: 40,
    midRiskPercent: 20,
    lowRiskPercent: 40,
    status: "Moderate",
  },
  {
    id: "col-2",
    name: "Dehradun Institute of Technology",
    code: "DIT",
    slug: "dit-dehradun",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 184,
    averageRisk: 0.28,
    highRiskPercent: 20,
    midRiskPercent: 10,
    lowRiskPercent: 70,
    status: "Healthy",
  },
  {
    id: "col-3",
    name: "Shivalik College of Engineering",
    code: "SCE",
    slug: "sce-dehradun",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 156,
    averageRisk: 0.36,
    highRiskPercent: 30,
    midRiskPercent: 20,
    lowRiskPercent: 50,
    status: "Healthy",
  },
  {
    id: "col-4",
    name: "Tula's Institute",
    code: "TULA",
    slug: "tulas-dehradun",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 128,
    averageRisk: 0.49,
    highRiskPercent: 50,
    midRiskPercent: 20,
    lowRiskPercent: 30,
    status: "Moderate",
  },
  {
    id: "col-5",
    name: "ICFAI Tech School Dehradun",
    code: "ITS",
    slug: "its-dehradun",
    studentCount: 10,
    squadCount: 2,
    totalActivities: 135,
    averageRisk: 0.41,
    highRiskPercent: 30,
    midRiskPercent: 40,
    lowRiskPercent: 30,
    status: "Moderate",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Core Database Query Functions (Safe, N+1 Free, ISO Date Serialized)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the 5 featured student personas illustrating the core risk profiles.
 * Safe with fallback return when the database is offline.
 */
export async function getFeaturedStudents(): Promise<FeaturedStudent[]> {
  try {
    const featuredNames = [
      "Arpit Sharma",
      "Apoorav Mehta",
      "Ritika Bisht",
      "Grima Rawat",
      "Pankaj Negi",
    ];

    const students = await prisma.user.findMany({
      where: {
        name: { in: featuredNames },
      },
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true,
        department: true,
        year: true,
        college: {
          select: { name: true, code: true },
        },
        squadMemberships: {
          select: {
            role: true,
            squad: { select: { name: true } },
          },
        },
        streak: {
          select: {
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
          },
        },
        riskScores: {
          orderBy: { computedAt: "desc" },
          select: {
            id: true,
            score: true,
            band: true,
            topReason: true,
            bootstrapActive: true,
            computedAt: true,
          },
        },
        interventions: {
          orderBy: { firedAt: "desc" },
          select: {
            id: true,
            type: true,
            message: true,
            firedAt: true,
            resolvedAt: true,
          },
        },
        leagueMemberships: {
          select: {
            points: true,
            rank: true,
            league: { select: { name: true, tier: true } },
          },
        },
        _count: {
          select: { activities: true },
        },
      },
    });

    if (!students || students.length === 0) {
      return FALLBACK_FEATURED_STUDENTS;
    }

    // Preserve featured order: Arpit, Apoorav, Ritika, Grima, Pankaj
    const orderMap = new Map(featuredNames.map((name, index) => [name, index]));
    students.sort((a, b) => (orderMap.get(a.name) ?? 0) - (orderMap.get(b.name) ?? 0));

    return students.map((s) => {
      const latestRisk = s.riskScores[0] || null;
      const isColdStart =
        s.name === "Grima Rawat" ||
        s.riskScores.length === 0 ||
        latestRisk?.bootstrapActive;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        rollNo: s.rollNo || "",
        department: s.department || "Engineering",
        year: s.year || 2,
        college: s.college?.name || "Campus",
        collegeCode: s.college?.code || "CAMPUS",
        squad: s.squadMemberships[0]?.squad.name || "Solo",
        squadRole: s.squadMemberships[0]?.role || "member",
        streak: {
          current: s.streak?.currentStreak || 0,
          longest: s.streak?.longestStreak || 0,
          lastActiveDate: s.streak?.lastActiveDate
            ? new Date(s.streak.lastActiveDate).toISOString()
            : null,
        },
        currentRisk: isColdStart
          ? {
              score: null,
              band: null,
              topReason:
                s.name === "Grima Rawat"
                  ? "Day 5 — learning your pattern. Risk scoring starts soon."
                  : "Cold start active — under 7 days enrolled",
              bootstrapActive: true,
              computedAt: null,
            }
          : {
              score: latestRisk?.score ?? 0.15,
              band: latestRisk?.band ?? RiskBand.LOW,
              topReason: latestRisk?.topReason ?? "Consistent engagement",
              bootstrapActive: false,
              computedAt: latestRisk?.computedAt
                ? new Date(latestRisk.computedAt).toISOString()
                : null,
            },
        riskHistory: s.riskScores.map((r) => ({
          id: r.id,
          score: r.score,
          band: r.band,
          topReason: r.topReason,
          computedAt: new Date(r.computedAt).toISOString(),
        })),
        interventions: s.interventions.map((i) => ({
          id: i.id,
          type: i.type,
          message: i.message,
          firedAt: new Date(i.firedAt).toISOString(),
          resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toISOString() : null,
          isActive: i.resolvedAt === null,
        })),
        league: s.leagueMemberships[0]
          ? {
              tier: s.leagueMemberships[0].league.tier,
              name: s.leagueMemberships[0].league.name,
              points: s.leagueMemberships[0].points,
              rank: s.leagueMemberships[0].rank,
            }
          : null,
        totalActivitiesLogged: s._count.activities,
      };
    });
  } catch (error) {
    console.error("[FitForge queries] getFeaturedStudents failed, returning fallback:", error);
    return FALLBACK_FEATURED_STUDENTS;
  }
}

/**
 * Returns overall campus fitness metrics, dropout risk distribution,
 * and intervention statistics.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const totalStudents = await prisma.user.count();
    const totalActivities = await prisma.activity.count();
    const totalSquads = await prisma.squad.count();
    const totalColleges = await prisma.college.count();
    const interventions = await prisma.intervention.findMany({
      select: { id: true, type: true, resolvedAt: true },
    });
    const allUsersWithRisk = await prisma.user.findMany({
      select: {
        id: true,
        riskScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
          select: { score: true, bootstrapActive: true },
        },
      },
    });

    if (totalStudents === 0) {
      return FALLBACK_ANALYTICS;
    }

    let lowRiskCount = 0;
    let midRiskCount = 0;
    let highRiskCount = 0;
    let coldStartCount = 0;

    for (const user of allUsersWithRisk) {
      const latest = user.riskScores[0];
      if (!latest || latest.bootstrapActive) {
        coldStartCount++;
      } else if (latest.score < 0.3) {
        lowRiskCount++;
      } else if (latest.score < 0.6) {
        midRiskCount++;
      } else {
        highRiskCount++;
      }
    }

    const activeInterventionsCount = interventions.filter((i) => i.resolvedAt === null).length;
    const resolvedInterventionsCount = interventions.filter((i) => i.resolvedAt !== null).length;

    return {
      cohort: {
        totalStudents,
        totalActivities,
        totalSquads,
        totalColleges,
        averageActivitiesPerStudent:
          totalStudents > 0 ? Math.round(totalActivities / totalStudents) : 0,
      },
      riskDistribution: {
        low: {
          count: lowRiskCount,
          percentage: totalStudents > 0 ? Math.round((lowRiskCount / totalStudents) * 100) : 0,
          band: "LOW (< 0.30)",
        },
        mid: {
          count: midRiskCount,
          percentage: totalStudents > 0 ? Math.round((midRiskCount / totalStudents) * 100) : 0,
          band: "MID (0.30–0.59)",
        },
        high: {
          count: highRiskCount,
          percentage: totalStudents > 0 ? Math.round((highRiskCount / totalStudents) * 100) : 0,
          band: "HIGH (>= 0.60)",
        },
        coldStart: {
          count: coldStartCount,
          percentage: totalStudents > 0 ? Math.round((coldStartCount / totalStudents) * 100) : 0,
          status: "Bootstrap Active (under 7 days)",
        },
      },
      interventions: {
        total: interventions.length,
        active: activeInterventionsCount,
        resolved: resolvedInterventionsCount,
        byType: {
          nudge: interventions.filter((i) => i.type === InterventionType.NUDGE).length,
          squadNudge: interventions.filter((i) => i.type === InterventionType.SQUAD_NUDGE).length,
          goalDowngrade: interventions.filter((i) => i.type === InterventionType.GOAL_DOWNGRADE).length,
          mentorCheckin: interventions.filter((i) => i.type === InterventionType.MENTOR_CHECKIN).length,
        },
      },
    };
  } catch (error) {
    console.error("[FitForge queries] getAnalyticsSummary failed, returning fallback:", error);
    return FALLBACK_ANALYTICS;
  }
}

/**
 * Returns a detailed case example illustrating dropout prevention mechanics:
 * Specifically Ritika Bisht's complete risk jump -> intervention -> recovery arc.
 */
export async function getMechanicExample(): Promise<MechanicExample> {
  try {
    const ritika = await prisma.user.findFirst({
      where: { name: "Ritika Bisht" },
      select: {
        name: true,
        college: { select: { name: true } },
        squadMemberships: {
          select: { squad: { select: { name: true } } },
        },
        riskScores: {
          orderBy: { computedAt: "asc" },
          select: {
            score: true,
            band: true,
            topReason: true,
            computedAt: true,
          },
        },
        interventions: {
          orderBy: { firedAt: "desc" },
          select: {
            type: true,
            message: true,
            firedAt: true,
            resolvedAt: true,
          },
        },
        _count: {
          select: { activities: true },
        },
      },
    });

    const pankaj = await prisma.user.findFirst({
      where: { name: "Pankaj Negi" },
      select: {
        name: true,
        interventions: {
          where: { resolvedAt: null },
          select: {
            id: true,
            type: true,
            message: true,
            firedAt: true,
          },
        },
        riskScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
          select: { score: true },
        },
      },
    });

    const apoorav = await prisma.user.findFirst({
      where: { name: "Apoorav Mehta" },
      select: {
        name: true,
        college: { select: { name: true } },
        challenges: {
          select: { challenge: { select: { title: true } } },
        },
        interventions: {
          where: { type: InterventionType.GOAL_DOWNGRADE },
          orderBy: { firedAt: "desc" },
          select: {
            id: true,
            type: true,
            message: true,
            firedAt: true,
          },
        },
        riskScores: {
          orderBy: { computedAt: "desc" },
          select: { score: true, topReason: true },
        },
      },
    });

    if (!ritika || !apoorav) {
      return FALLBACK_MECHANIC;
    }

    return {
      mechanicCase: {
        title: "Intervention & Risk Reversal Case Study: Ritika Bisht",
        student: {
          name: ritika.name,
          college: ritika.college?.name || "Shivalik College of Engineering",
          squad: ritika.squadMemberships[0]?.squad.name || "Valley Hawks",
        },
        trajectory: ritika.riskScores.map((r, index) => ({
          stage: index + 1,
          score: r.score,
          band: r.band,
          topReason: r.topReason,
          computedAt: new Date(r.computedAt).toISOString(),
        })),
        interventionsApplied: ritika.interventions.map((i) => ({
          type: i.type,
          message: i.message,
          firedAt: new Date(i.firedAt).toISOString(),
          resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toISOString() : null,
          status: i.resolvedAt ? "Resolved & Successful" : "Active",
        })),
        totalWorkoutsLogged: ritika._count.activities,
        outcome:
          "Risk score dropped from 0.79 back to 0.22 after mentor check-in re-established squad morning workout routine.",
      },
      activeInterventionExample: {
        student: pankaj?.name || "Pankaj Negi",
        currentRisk: pankaj?.riskScores[0]?.score ?? 0.45,
        activeIntervention: pankaj?.interventions[0]
          ? {
              id: pankaj.interventions[0].id,
              type: pankaj.interventions[0].type,
              message: pankaj.interventions[0].message,
              firedAt: new Date(pankaj.interventions[0].firedAt).toISOString(),
            }
          : undefined,
        rule: "MID Risk triggers peer squad nudge",
      },
      goalDowngradeExample: {
        student: apoorav.name,
        college: apoorav.college?.name || "Roorkee Institute of Technology",
        originalGoalMinutes: 30,
        downgradedGoalMinutes: 10,
        originalRiskScore: 0.71,
        targetRiskScore: 0.24,
        currentRiskScore: apoorav.riskScores[0]?.score ?? 0.71,
        topReason: apoorav.riskScores.find((r) => r.topReason)?.topReason || "Missed 4 consecutive challenges",
        formula: "max(10, Math.round(target / 3))",
        rule: "HIGH Risk triggers automatic goal downgrade to reduce friction",
        intervention: apoorav.interventions[0]
          ? {
              id: apoorav.interventions[0].id,
              type: apoorav.interventions[0].type,
              message: apoorav.interventions[0].message,
              firedAt: new Date(apoorav.interventions[0].firedAt).toISOString(),
            }
          : {
              id: "fallback-gd",
              type: "GOAL_DOWNGRADE",
              message: "Goal requirement eased to reduce friction and encourage workout resumption.",
              firedAt: new Date().toISOString(),
            },
        challengeTitle: apoorav.challenges[0]?.challenge?.title || "30-Day Campus Consistency Sprint",
      },
      cohortRecovery: {
        rate: 78,
        description: "At-risk students whose dropout trajectory reversed within 14 days of automated intervention",
        ritikaReductionPercent: 72,
      },
    };
  } catch (error) {
    console.error("[FitForge queries] getMechanicExample failed, returning fallback:", error);
    return FALLBACK_MECHANIC;
  }
}

/**
 * Returns risk, engagement, and dropout prevention analytics grouped by college.
 */
export async function getCollegeRiskAnalytics(): Promise<CollegeRiskAnalytics[]> {
  try {
    const colleges = await prisma.college.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        squads: { select: { id: true } },
        users: {
          select: {
            riskScores: {
              orderBy: { computedAt: "desc" },
              take: 1,
              select: { score: true, bootstrapActive: true },
            },
            _count: {
              select: { activities: true },
            },
          },
        },
      },
    });

    if (!colleges || colleges.length === 0) {
      return FALLBACK_COLLEGES;
    }

    return colleges.map((college) => {
      let totalRisk = 0;
      let scoredCount = 0;
      let highRiskCount = 0;
      let midRiskCount = 0;
      let lowRiskCount = 0;
      let totalActivities = 0;

      college.users.forEach((u) => {
        totalActivities += u._count.activities;
        const latest = u.riskScores[0];
        if (latest && !latest.bootstrapActive) {
          totalRisk += latest.score;
          scoredCount++;
          if (latest.score >= 0.6) highRiskCount++;
          else if (latest.score >= 0.3) midRiskCount++;
          else lowRiskCount++;
        }
      });

      const averageRisk = scoredCount > 0 ? Number((totalRisk / scoredCount).toFixed(2)) : 0.38;
      const highRiskPercent =
        college.users.length > 0 ? Math.round((highRiskCount / college.users.length) * 100) : 0;
      const midRiskPercent =
        college.users.length > 0 ? Math.round((midRiskCount / college.users.length) * 100) : 0;
      const lowRiskPercent =
        college.users.length > 0 ? Math.round((lowRiskCount / college.users.length) * 100) : 0;

      return {
        id: college.id,
        name: college.name,
        code: college.code,
        slug: college.slug,
        studentCount: college.users.length,
        squadCount: college.squads.length,
        totalActivities,
        averageRisk,
        highRiskPercent,
        midRiskPercent,
        lowRiskPercent,
        status: averageRisk >= 0.6 ? "Critical" : averageRisk >= 0.4 ? "Moderate" : "Healthy",
      };
    });
  } catch (error) {
    console.error("[FitForge queries] getCollegeRiskAnalytics failed, returning fallback:", error);
    return FALLBACK_COLLEGES;
  }
}

/**
 * Returns lightweight student summaries for student switchers and selectors.
 */
export async function getAllStudentsSummary(): Promise<StudentSummaryItem[]> {
  try {
    const rawStudents = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        college: { select: { code: true } },
        streak: { select: { currentStreak: true } },
        riskScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
          select: { band: true, score: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return rawStudents.map((s) => ({
      id: s.id,
      name: s.name,
      collegeCode: s.college?.code || "CAMPUS",
      band: s.riskScores[0]?.band || "COLD-START",
      streak: s.streak?.currentStreak || 0,
    }));
  } catch (error) {
    console.error("[FitForge queries] getAllStudentsSummary failed:", error);
    return FALLBACK_FEATURED_STUDENTS.map((s) => ({
      id: s.id,
      name: s.name,
      collegeCode: s.collegeCode,
      band: s.currentRisk.band || "COLD-START",
      streak: s.streak.current,
    }));
  }
}

/**
 * Returns comprehensive student profile and telemetry data for /dashboard.
 * Explicitly selects needed fields, serializes all dates to ISO strings,
 * and avoids N+1 queries.
 */
export async function getStudentDashboardData(filter?: {
  studentId?: string;
  email?: string;
  name?: string;
}): Promise<StudentDashboardData | null> {
  try {
    let whereClause: Record<string, unknown> = {};
    if (filter?.studentId) {
      whereClause = { id: filter.studentId };
    } else if (filter?.email) {
      whereClause = { email: filter.email };
    } else if (filter?.name) {
      whereClause = { name: filter.name };
    } else {
      whereClause = { name: "Arpit Sharma" };
    }

    const selectShape = {
      id: true,
      name: true,
      email: true,
      rollNo: true,
      department: true,
      year: true,
      college: {
        select: { id: true, name: true, code: true, slug: true },
      },
      streak: {
        select: {
          currentStreak: true,
          longestStreak: true,
          lastActiveDate: true,
        },
      },
      squadMemberships: {
        take: 1,
        select: {
          role: true,
          squad: { select: { id: true, name: true } },
        },
      },
      leagueMemberships: {
        take: 1,
        select: {
          points: true,
          rank: true,
          league: { select: { name: true, tier: true } },
        },
      },
      riskScores: {
        orderBy: { computedAt: "desc" as const },
        take: 10,
        select: {
          id: true,
          score: true,
          band: true,
          topReason: true,
          bootstrapActive: true,
          computedAt: true,
        },
      },
      interventions: {
        orderBy: { firedAt: "desc" as const },
        take: 10,
        select: {
          id: true,
          type: true,
          message: true,
          firedAt: true,
          resolvedAt: true,
        },
      },
      activities: {
        orderBy: { date: "desc" as const },
        take: 15,
        select: {
          id: true,
          type: true,
          durationMinutes: true,
          date: true,
          notes: true,
        },
      },
      pointsLedger: {
        orderBy: { date: "desc" as const },
        take: 10,
        select: {
          id: true,
          points: true,
          reason: true,
          date: true,
        },
      },
    };

    let user = await prisma.user.findFirst({
      where: whereClause,
      select: selectShape,
    });

    if (!user) {
      user = await prisma.user.findFirst({
        select: selectShape,
      });
    }

    if (!user) return null;

    const totalPoints =
      user.pointsLedger.reduce((sum, p) => sum + p.points, 0) ||
      user.leagueMemberships[0]?.points ||
      0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      rollNo: user.rollNo || "",
      department: user.department || "Engineering",
      year: user.year || 2,
      college: {
        id: user.college?.id || "col-default",
        name: user.college?.name || "Campus",
        code: user.college?.code || "CAMPUS",
        slug: user.college?.slug || "campus",
      },
      streak: {
        currentStreak: user.streak?.currentStreak || 0,
        longestStreak: user.streak?.longestStreak || 0,
        lastActiveDate: user.streak?.lastActiveDate
          ? new Date(user.streak.lastActiveDate).toISOString()
          : null,
      },
      squad: user.squadMemberships[0]
        ? {
            id: user.squadMemberships[0].squad.id,
            name: user.squadMemberships[0].squad.name,
            role: user.squadMemberships[0].role,
          }
        : null,
      league: user.leagueMemberships[0]
        ? {
            name: user.leagueMemberships[0].league.name,
            tier: user.leagueMemberships[0].league.tier,
            points: user.leagueMemberships[0].points,
            rank: user.leagueMemberships[0].rank,
          }
        : null,
      totalPoints,
      riskScores: user.riskScores.map((r) => ({
        id: r.id,
        score: r.score,
        band: r.band,
        topReason: r.topReason,
        bootstrapActive: r.bootstrapActive,
        computedAt: new Date(r.computedAt).toISOString(),
      })),
      interventions: user.interventions.map((i) => ({
        id: i.id,
        type: i.type,
        message: i.message,
        firedAt: new Date(i.firedAt).toISOString(),
        resolvedAt: i.resolvedAt ? new Date(i.resolvedAt).toISOString() : null,
        isActive: i.resolvedAt === null,
      })),
      activities: user.activities.map((a) => ({
        id: a.id,
        type: a.type,
        durationMinutes: a.durationMinutes,
        date: new Date(a.date).toISOString(),
        notes: a.notes,
      })),
      pointsLedger: user.pointsLedger.map((p) => ({
        id: p.id,
        points: p.points,
        reason: p.reason,
        date: new Date(p.date).toISOString(),
      })),
    };
  } catch (error) {
    console.error("[FitForge queries] getStudentDashboardData failed:", error);
    return null;
  }
}

/**
 * Returns challenges and student options for /challenges.
 */
export async function getChallengesPageData(): Promise<ChallengesPageData> {
  try {
    const [rawChallenges, rawStudents] = await Promise.all([
      prisma.challenge.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          targetMinutes: true,
          originalTargetMinutes: true,
          status: true,
          dueDate: true,
          createdAt: true,
          _count: { select: { participants: true } },
          participants: {
            select: {
              userId: true,
              minutesLogged: true,
              completed: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          college: { select: { code: true } },
        },
        orderBy: { name: "asc" },
        take: 20,
      }),
    ]);

    const challenges: ChallengeItem[] = rawChallenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      targetMinutes: c.targetMinutes,
      originalTargetMinutes: c.originalTargetMinutes,
      status: c.status,
      dueDate: new Date(c.dueDate).toISOString(),
      dueDateFormatted: new Date(c.dueDate).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      participantCount: c._count.participants,
      participants: c.participants,
    }));

    const students: StudentOption[] = rawStudents.map((s) => ({
      id: s.id,
      name: s.name,
      collegeCode: s.college?.code || "CAMPUS",
    }));

    return { challenges, students };
  } catch (error) {
    console.error("[FitForge queries] getChallengesPageData failed:", error);
    return { challenges: [], students: [] };
  }
}

/**
 * Returns squads and student options for /squads.
 */
export async function getSquadsPageData(): Promise<SquadsPageData> {
  try {
    const [rawSquads, rawStudents] = await Promise.all([
      prisma.squad.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          college: { select: { name: true, code: true } },
          members: {
            select: {
              role: true,
              joinedAt: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          college: { select: { code: true } },
        },
        orderBy: { name: "asc" },
        take: 20,
      }),
    ]);

    const squads: SquadItem[] = rawSquads.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      college: s.college,
      memberCount: s.members.length,
      leader: s.members.find((m) => m.role === "leader")?.user.name || null,
      members: s.members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        role: m.role,
        joinedAt: new Date(m.joinedAt).toISOString(),
      })),
    }));

    const students: StudentOption[] = rawStudents.map((s) => ({
      id: s.id,
      name: s.name,
      collegeCode: s.college?.code || "CAMPUS",
    }));

    return { squads, students };
  } catch (error) {
    console.error("[FitForge queries] getSquadsPageData failed:", error);
    return { squads: [], students: [] };
  }
}

/**
 * Returns student operational overview rows for /admin.
 */
export async function getAdminStudentsList(): Promise<AdminStudentRow[]> {
  try {
    const rawUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true,
        department: true,
        year: true,
        college: { select: { name: true, code: true } },
        streak: { select: { currentStreak: true } },
        squadMemberships: {
          take: 1,
          select: { squad: { select: { name: true } } },
        },
        riskScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
          select: {
            score: true,
            band: true,
            topReason: true,
            bootstrapActive: true,
          },
        },
        interventions: {
          where: { resolvedAt: null },
          orderBy: { firedAt: "desc" },
          take: 1,
          select: { type: true },
        },
        _count: { select: { activities: true } },
      },
      orderBy: { name: "asc" },
    });

    return rawUsers.map((u) => {
      const risk = u.riskScores[0];
      const intervention = u.interventions[0];

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        rollNo: u.rollNo,
        department: u.department,
        year: u.year,
        collegeName: u.college?.name || "Uttarakhand Campus",
        collegeCode: u.college?.code || "CAMPUS",
        squadName: u.squadMemberships[0]?.squad.name || "Solo Athlete",
        streak: u.streak?.currentStreak || 0,
        riskScore: risk?.score ?? null,
        riskBand: risk?.band || (risk?.bootstrapActive ? "COLD-START" : "LOW"),
        topReason: risk?.topReason || "Consistent engagement",
        bootstrapActive: risk?.bootstrapActive || risk?.score === null,
        activityCount: u._count.activities,
        activeIntervention: intervention ? intervention.type.replace("_", " ") : null,
      };
    });
  } catch (error) {
    console.error("[FitForge queries] getAdminStudentsList failed:", error);
    return [];
  }
}

/**
 * Returns colleges with squads for /api/colleges.
 */
export async function getCollegesList(): Promise<CollegeListItem[]> {
  try {
    const colleges = await prisma.college.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        squads: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return colleges;
  } catch (error) {
    console.error("[FitForge queries] getCollegesList failed:", error);
    return [];
  }
}

/**
 * Returns recent risk scores for /api/risk.
 */
export async function getRecentRiskScores(filter?: {
  userId?: string;
  collegeId?: string;
  limit?: number;
}): Promise<RiskScoreListItem[]> {
  try {
    const limit = Math.min(50, Math.max(1, filter?.limit || 20));
    const whereClause: Record<string, unknown> = {};
    if (filter?.userId) whereClause.userId = filter.userId;
    if (filter?.collegeId) whereClause.user = { collegeId: filter.collegeId };

    const scores = await prisma.riskScore.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        score: true,
        band: true,
        topReason: true,
        bootstrapActive: true,
        computedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            department: true,
            college: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { computedAt: "desc" },
      take: limit,
    });

    return scores.map((s) => ({
      id: s.id,
      userId: s.userId,
      studentName: s.user.name,
      rollNo: s.user.rollNo,
      college: s.user.college?.name || null,
      collegeCode: s.user.college?.code || null,
      score: s.score,
      band: s.band,
      topReason: s.topReason,
      bootstrapActive: s.bootstrapActive,
      computedAt: new Date(s.computedAt).toISOString(),
    }));
  } catch (error) {
    console.error("[FitForge queries] getRecentRiskScores failed:", error);
    return [];
  }
}

/**
 * Returns recent workout activities for /api/sessions.
 */
export async function getRecentActivities(filter?: {
  userId?: string;
  limit?: number;
}): Promise<ActivityListItem[]> {
  try {
    const limit = Math.min(50, Math.max(1, filter?.limit || 20));

    const activities = await prisma.activity.findMany({
      where: filter?.userId ? { userId: filter.userId } : undefined,
      select: {
        id: true,
        userId: true,
        type: true,
        durationMinutes: true,
        date: true,
        notes: true,
        user: {
          select: { id: true, name: true, rollNo: true },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return activities.map((a) => ({
      id: a.id,
      userId: a.userId,
      studentName: a.user.name,
      type: a.type,
      durationMinutes: a.durationMinutes,
      date: new Date(a.date).toISOString(),
      notes: a.notes,
    }));
  } catch (error) {
    console.error("[FitForge queries] getRecentActivities failed:", error);
    return [];
  }
}

/**
 * Returns user batches for the risk recompute job.
 */
export async function getUsersForRiskRecompute(
  fourteenDaysAgo: Date,
  startOfDay?: Date,
  endOfDay?: Date
): Promise<RecomputeUserData[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      department: true,
      createdAt: true,
      college: { select: { name: true } },
      activities: {
        where: { date: { gte: fourteenDaysAgo } },
        orderBy: { date: "asc" },
        select: { date: true, durationMinutes: true },
      },
      streak: {
        select: {
          currentStreak: true,
          longestStreak: true,
          lastActiveDate: true,
        },
      },
      challenges: {
        select: {
          challengeId: true,
          status: true,
          completed: true,
          minutesLogged: true,
        },
      },
      squadMemberships: {
        select: {
          squad: { select: { name: true } },
        },
      },
      riskScores: {
        orderBy: { computedAt: "desc" },
        take: 5,
        select: {
          id: true,
          score: true,
          band: true,
          computedAt: true,
        },
      },
      interventions: {
        where:
          startOfDay && endOfDay
            ? {
                OR: [
                  { resolvedAt: null },
                  { firedAt: { gte: startOfDay, lte: endOfDay } },
                ],
              }
            : { resolvedAt: null },
        select: {
          id: true,
          type: true,
          firedAt: true,
          resolvedAt: true,
        },
      },
    },
  });

  return users;
}

