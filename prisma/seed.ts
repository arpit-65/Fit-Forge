import {
  PrismaClient,
  RiskBand,
  InterventionType,
  ChallengeStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

// ─── Deterministic PRNG (Mulberry32) ──────────────────────────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function randomInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

async function main() {
  console.log("🌱 Starting FitForge idempotent database seed...");

  const now = new Date();
  now.setSeconds(0, 0);

  // 1. Upsert Colleges
  console.log("🏫 Upserting 5 Uttarakhand engineering colleges...");
  const collegesData = [
    { name: "Dehradun Institute of Technology", code: "DIT", slug: "dit-dehradun" },
    { name: "Roorkee Institute of Technology", code: "RIT", slug: "rit-roorkee" },
    { name: "Shivalik College of Engineering", code: "SCE", slug: "sce-dehradun" },
    { name: "Tula's Institute", code: "TULA", slug: "tulas-dehradun" },
    { name: "ICFAI Tech School Dehradun", code: "ITS", slug: "its-dehradun" },
  ];

  const colleges: Record<string, { id: string; name: string; code: string }> = {};
  for (const col of collegesData) {
    const record = await prisma.college.upsert({
      where: { code: col.code },
      update: { name: col.name, slug: col.slug },
      create: col,
    });
    colleges[col.name] = record;
  }

  // 2. Upsert Campus Leagues (Bronze, Silver, Gold) per college
  console.log("🏆 Upserting tiered campus leagues...");
  const leagues: Record<string, { bronze: string; silver: string; gold: string }> = {};

  for (const [colName, col] of Object.entries(colleges)) {
    const season = "Season 1 - 2026";
    const startDate = new Date(now.getTime() - 30 * 86400000);
    const endDate = new Date(now.getTime() + 60 * 86400000);

    const bronze = await prisma.league.findFirst({
      where: { collegeId: col.id, tier: "Bronze" },
    }) || await prisma.league.create({
      data: {
        collegeId: col.id,
        name: `${col.code} Freshers (Bronze)`,
        tier: "Bronze",
        season,
        startDate,
        endDate,
      },
    });

    const silver = await prisma.league.findFirst({
      where: { collegeId: col.id, tier: "Silver" },
    }) || await prisma.league.create({
      data: {
        collegeId: col.id,
        name: `${col.code} Contenders (Silver)`,
        tier: "Silver",
        season,
        startDate,
        endDate,
      },
    });

    const gold = await prisma.league.findFirst({
      where: { collegeId: col.id, tier: "Gold" },
    }) || await prisma.league.create({
      data: {
        collegeId: col.id,
        name: `${col.code} Champions (Gold)`,
        tier: "Gold",
        season,
        startDate,
        endDate,
      },
    });

    leagues[colName] = {
      bronze: bronze.id,
      silver: silver.id,
      gold: gold.id,
    };
  }

  // 3. Upsert Fitness Squads (2 per college)
  console.log("🛡️ Upserting campus peer squads...");
  const squadNames: Record<string, string[]> = {
    "Dehradun Institute of Technology": ["Campus Striders", "DIT Iron Hawks"],
    "Roorkee Institute of Technology": ["RIT Iron Titans", "Roorkee Runners"],
    "Shivalik College of Engineering": ["Valley Hawks", "Shivalik Spartans"],
    "Tula's Institute": ["Tula Trailblazers", "Doon Dominators"],
    "ICFAI Tech School Dehradun": ["ICFAI Innovators", "Pahadi Powerlifters"],
  };

  const squads: Record<string, string[]> = {};
  for (const [colName, names] of Object.entries(squadNames)) {
    squads[colName] = [];
    const col = colleges[colName];
    for (const name of names) {
      const existing = await prisma.squad.findFirst({
        where: { name, collegeId: col.id },
      });
      if (existing) {
        squads[colName].push(existing.id);
      } else {
        const created = await prisma.squad.create({
          data: {
            name,
            description: `Campus squad at ${col.name}`,
            collegeId: col.id,
            maxSize: 10,
          },
        });
        squads[colName].push(created.id);
      }
    }
  }

  // 4. Upsert Challenges
  console.log("🎯 Upserting campus challenges...");
  const challenge1 = await prisma.challenge.findFirst({
    where: { title: "30-Day Campus Consistency Sprint" },
  }) || await prisma.challenge.create({
    data: {
      title: "30-Day Campus Consistency Sprint",
      description: "Log at least 600 minutes of workouts within 30 days.",
      targetMinutes: 600,
      originalTargetMinutes: null,
      status: ChallengeStatus.ACTIVE,
      dueDate: new Date(now.getTime() + 7 * 86400000),
    },
  });

  const challenge2 = await prisma.challenge.findFirst({
    where: { title: "Mid-Term Recovery Challenge" },
  }) || await prisma.challenge.create({
    data: {
      title: "Mid-Term Recovery Challenge",
      description: "Goal downgraded to 10 min to help at-risk students rebuild momentum.",
      targetMinutes: 200,
      originalTargetMinutes: 450,
      status: ChallengeStatus.DOWNGRADED,
      dueDate: new Date(now.getTime() + 5 * 86400000),
    },
  });

  // Batch collector arrays
  const allActivities: Array<{
    userId: string;
    type: string;
    durationMinutes: number;
    date: Date;
    notes: string | null;
  }> = [];

  const allStreaks: Array<{
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date;
  }> = [];

  const allRiskScores: Array<{
    userId: string;
    score: number;
    band: RiskBand;
    topReason: string;
    bootstrapActive: boolean;
    computedAt: Date;
  }> = [];

  const allInterventions: Array<{
    userId: string;
    type: InterventionType;
    message: string;
    firedAt: Date;
    resolvedAt: Date | null;
  }> = [];

  const allSquadMembers: Array<{
    userId: string;
    squadId: string;
    role: string;
  }> = [];

  const allLeagueMembers: Array<{
    leagueId: string;
    userId: string;
    points: number;
    rank: number;
  }> = [];

  const allChallengeParticipants: Array<{
    userId: string;
    challengeId: string;
    minutesLogged: number;
    status: ChallengeStatus;
    completed: boolean;
  }> = [];

  // Track seeded user IDs to clean only their child records before re-inserting
  const seededUserIds: string[] = [];

  // 5. Featured Students
  console.log("⭐ Upserting 5 featured students with exact specifications...");

  // ── 1. Arpit Sharma (DIT)
  // 16-day streak, Gold league, risk about 0.15
  const arpit = await prisma.user.upsert({
    where: { email: "arpit.sharma@dit.edu.in" },
    update: {
      name: "Arpit Sharma",
      rollNo: "DIT-2024-001",
      department: "Computer Science",
      year: 3,
      collegeId: colleges["Dehradun Institute of Technology"].id,
    },
    create: {
      name: "Arpit Sharma",
      email: "arpit.sharma@dit.edu.in",
      rollNo: "DIT-2024-001",
      department: "Computer Science",
      year: 3,
      collegeId: colleges["Dehradun Institute of Technology"].id,
    },
  });
  seededUserIds.push(arpit.id);

  allStreaks.push({
    userId: arpit.id,
    currentStreak: 16,
    longestStreak: 16,
    lastActiveDate: now,
  });

  allLeagueMembers.push({
    leagueId: leagues["Dehradun Institute of Technology"].gold,
    userId: arpit.id,
    points: 1420,
    rank: 1,
  });

  allSquadMembers.push({
    userId: arpit.id,
    squadId: squads["Dehradun Institute of Technology"][0],
    role: "leader",
  });

  allRiskScores.push({
    userId: arpit.id,
    score: 0.15,
    band: RiskBand.LOW,
    topReason: "Consistent daily workouts, 16-day active streak",
    bootstrapActive: false,
    computedAt: now,
  });

  // Arpit: 16-day active streak matching activity history (day 0 to day 15)
  for (let d = 25; d >= 0; d--) {
    // Only missed 2 days in the distant past (>16 days ago) to maintain exactly 16-day streak
    if (d === 18 || d === 22) continue;
    const actDate = new Date(now.getTime() - d * 86400000);
    allActivities.push({
      userId: arpit.id,
      type: randomChoice(["gym", "run", "hiit"]),
      durationMinutes: randomInt(45, 60),
      date: actDate,
      notes: "Solid high-intensity session with squad.",
    });
  }

  // ── 2. Apoorav Mehta (RIT)
  // risk about 0.71, topReason "Missed 4 consecutive challenges"
  const apoorav = await prisma.user.upsert({
    where: { email: "apoorav.mehta@rit.edu.in" },
    update: {
      name: "Apoorav Mehta",
      rollNo: "RIT-2024-002",
      department: "Mechanical Engineering",
      year: 2,
      collegeId: colleges["Roorkee Institute of Technology"].id,
    },
    create: {
      name: "Apoorav Mehta",
      email: "apoorav.mehta@rit.edu.in",
      rollNo: "RIT-2024-002",
      department: "Mechanical Engineering",
      year: 2,
      collegeId: colleges["Roorkee Institute of Technology"].id,
    },
  });
  seededUserIds.push(apoorav.id);

  const apooravLastActive = new Date(now.getTime() - 8 * 86400000);
  allStreaks.push({
    userId: apoorav.id,
    currentStreak: 0,
    longestStreak: 7,
    lastActiveDate: apooravLastActive,
  });

  allLeagueMembers.push({
    leagueId: leagues["Roorkee Institute of Technology"].bronze,
    userId: apoorav.id,
    points: 210,
    rank: 8,
  });

  allSquadMembers.push({
    userId: apoorav.id,
    squadId: squads["Roorkee Institute of Technology"][0],
    role: "member",
  });

  allRiskScores.push({
    userId: apoorav.id,
    score: 0.71,
    band: RiskBand.HIGH,
    topReason: "Missed 4 consecutive challenges",
    bootstrapActive: false,
    computedAt: now,
  });

  allInterventions.push({
    userId: apoorav.id,
    type: InterventionType.GOAL_DOWNGRADE,
    message: "Hey Apoorav, we lowered your workout target to make getting back into rhythm smooth and stress-free. Every minute counts!",
    firedAt: new Date(now.getTime() - 86400000),
    resolvedAt: null,
  });

  // Apoorav: inactive for the last 8 days (matches 0 streak and high risk)
  for (let d = 26; d >= 8; d -= 2) {
    allActivities.push({
      userId: apoorav.id,
      type: "gym",
      durationMinutes: randomInt(30, 45),
      date: new Date(now.getTime() - d * 86400000),
      notes: "Gym session.",
    });
  }

  allChallengeParticipants.push({
    userId: apoorav.id,
    challengeId: challenge1.id,
    minutesLogged: 60,
    status: ChallengeStatus.EXPIRED,
    completed: false,
  });

  // ── 3. Ritika Bisht (SCE)
  // risk 0.79 eleven days ago, an intervention fired, now 0.22, with full risk history rows and a resolved intervention
  const ritika = await prisma.user.upsert({
    where: { email: "ritika.bisht@sce.edu.in" },
    update: {
      name: "Ritika Bisht",
      rollNo: "SCE-2024-003",
      department: "Civil Engineering",
      year: 3,
      collegeId: colleges["Shivalik College of Engineering"].id,
    },
    create: {
      name: "Ritika Bisht",
      email: "ritika.bisht@sce.edu.in",
      rollNo: "SCE-2024-003",
      department: "Civil Engineering",
      year: 3,
      collegeId: colleges["Shivalik College of Engineering"].id,
    },
  });
  seededUserIds.push(ritika.id);

  allStreaks.push({
    userId: ritika.id,
    currentStreak: 9,
    longestStreak: 12,
    lastActiveDate: now,
  });

  allLeagueMembers.push({
    leagueId: leagues["Shivalik College of Engineering"].silver,
    userId: ritika.id,
    points: 890,
    rank: 3,
  });

  allSquadMembers.push({
    userId: ritika.id,
    squadId: squads["Shivalik College of Engineering"][0],
    role: "member",
  });

  // Full risk history rows for Ritika: 0.79 -> 0.52 -> 0.22
  allRiskScores.push(
    {
      userId: ritika.id,
      score: 0.79,
      band: RiskBand.HIGH,
      topReason: "Missed 7 consecutive days of scheduled workouts",
      bootstrapActive: false,
      computedAt: new Date(now.getTime() - 11 * 86400000),
    },
    {
      userId: ritika.id,
      score: 0.52,
      band: RiskBand.MID,
      topReason: "Resuming post-intervention sessions",
      bootstrapActive: false,
      computedAt: new Date(now.getTime() - 6 * 86400000),
    },
    {
      userId: ritika.id,
      score: 0.22,
      band: RiskBand.LOW,
      topReason: "Active daily recovery, consistent post-intervention check-ins",
      bootstrapActive: false,
      computedAt: now,
    }
  );

  // Resolved mentor checkin intervention
  allInterventions.push({
    userId: ritika.id,
    type: InterventionType.MENTOR_CHECKIN,
    message: "Hi Ritika, your campus coach noticed a shift in your workout rhythm and is here to support you. Let's do a quick friendly check-in whenever you have time.",
    firedAt: new Date(now.getTime() - 11 * 86400000),
    resolvedAt: new Date(now.getTime() - 3 * 86400000), // Resolved!
  });

  // Ritika activity history: gap between day 18 and day 10, then active daily for last 9 days!
  for (let d = 28; d >= 18; d--) {
    allActivities.push({
      userId: ritika.id,
      type: "yoga",
      durationMinutes: 30,
      date: new Date(now.getTime() - d * 86400000),
      notes: "Early semester morning yoga.",
    });
  }
  // Resumed workouts after intervention: days 8 down to 0 (9-day streak)
  for (let d = 8; d >= 0; d--) {
    allActivities.push({
      userId: ritika.id,
      type: "gym",
      durationMinutes: randomInt(35, 45),
      date: new Date(now.getTime() - d * 86400000),
      notes: "Post-intervention squad recovery session.",
    });
  }

  // ── 4. Grima Rawat (Tula's)
  // joined 5 days ago, bootstrapActive = true, NO risk score row
  const grimaRegistration = new Date(now.getTime() - 5 * 86400000);
  const grima = await prisma.user.upsert({
    where: { email: "grima.rawat@tulas.edu.in" },
    update: {
      name: "Grima Rawat",
      rollNo: "TULA-2024-004",
      department: "Computer Applications",
      year: 1,
      collegeId: colleges["Tula's Institute"].id,
      createdAt: grimaRegistration,
    },
    create: {
      name: "Grima Rawat",
      email: "grima.rawat@tulas.edu.in",
      rollNo: "TULA-2024-004",
      department: "Computer Applications",
      year: 1,
      collegeId: colleges["Tula's Institute"].id,
      createdAt: grimaRegistration,
    },
  });
  seededUserIds.push(grima.id);

  allStreaks.push({
    userId: grima.id,
    currentStreak: 3,
    longestStreak: 3,
    lastActiveDate: now,
  });

  allLeagueMembers.push({
    leagueId: leagues["Tula's Institute"].bronze,
    userId: grima.id,
    points: 150,
    rank: 5,
  });

  allSquadMembers.push({
    userId: grima.id,
    squadId: squads["Tula's Institute"][0],
    role: "member",
  });

  // NO risk score row for Grima as required!
  // 4 activities in her first 5 days
  for (let d = 3; d >= 0; d--) {
    allActivities.push({
      userId: grima.id,
      type: "walk",
      durationMinutes: randomInt(20, 30),
      date: new Date(now.getTime() - d * 86400000),
      notes: "Campus onboarding walk.",
    });
  }

  // ── 5. Pankaj Negi (ITS)
  // risk about 0.45, active SQUAD_NUDGE intervention
  const pankaj = await prisma.user.upsert({
    where: { email: "pankaj.negi@its.edu.in" },
    update: {
      name: "Pankaj Negi",
      rollNo: "ITS-2024-005",
      department: "Electrical Engineering",
      year: 2,
      collegeId: colleges["ICFAI Tech School Dehradun"].id,
    },
    create: {
      name: "Pankaj Negi",
      email: "pankaj.negi@its.edu.in",
      rollNo: "ITS-2024-005",
      department: "Electrical Engineering",
      year: 2,
      collegeId: colleges["ICFAI Tech School Dehradun"].id,
    },
  });
  seededUserIds.push(pankaj.id);

  const pankajLastActive = new Date(now.getTime() - 3 * 86400000);
  allStreaks.push({
    userId: pankaj.id,
    currentStreak: 0,
    longestStreak: 5,
    lastActiveDate: pankajLastActive,
  });

  allLeagueMembers.push({
    leagueId: leagues["ICFAI Tech School Dehradun"].silver,
    userId: pankaj.id,
    points: 510,
    rank: 6,
  });

  allSquadMembers.push({
    userId: pankaj.id,
    squadId: squads["ICFAI Tech School Dehradun"][0],
    role: "member",
  });

  allRiskScores.push({
    userId: pankaj.id,
    score: 0.45,
    band: RiskBand.MID,
    topReason: "Missed 3 consecutive days of scheduled workouts",
    bootstrapActive: false,
    computedAt: now,
  });

  allInterventions.push({
    userId: pankaj.id,
    type: InterventionType.SQUAD_NUDGE,
    message: "Hey Pankaj, your teammates in ICFAI Innovators miss you! Whenever you're ready, join back for a quick session.",
    firedAt: new Date(now.getTime() - 86400000),
    resolvedAt: null, // ACTIVE!
  });

  for (let d = 25; d >= 3; d -= 2) {
    allActivities.push({
      userId: pankaj.id,
      type: "sport",
      durationMinutes: randomInt(30, 45),
      date: new Date(now.getTime() - d * 86400000),
      notes: "Campus badminton court.",
    });
  }

  // 6. 45 Additional Students Across 5 Colleges (9 per college)
  console.log("👥 Upserting 45 additional students across the 5 colleges...");
  // Distribution: 40% consistent (18), 25% declining (11), 20% sporadic (9), 15% dropout (7)
  const cohortProfiles = [
    ...Array(18).fill("consistent"),
    ...Array(11).fill("declining"),
    ...Array(9).fill("sporadic"),
    ...Array(7).fill("dropout"),
  ];

  const firstNames = [
    "Aarav", "Aditi", "Ananya", "Aryan", "Bhavya", "Dev", "Diya", "Ishaan",
    "Kavya", "Karan", "Khushi", "Manish", "Meera", "Neha", "Nikhil", "Pranav",
    "Pooja", "Rahul", "Riya", "Rohan", "Sanjay", "Sneha", "Tanvi", "Utkarsh",
    "Vaibhav", "Varun", "Vipul", "Yash", "Aditya", "Akash", "Ankit", "Deepak",
    "Gaurav", "Harsh", "Kunal", "Mayank", "Mohit", "Praveen", "Rajat", "Sachin",
    "Saurabh", "Shubham", "Tarun", "Vikas", "Vivek"
  ];

  const collegeList = Object.values(colleges);

  for (let i = 0; i < 45; i++) {
    const col = collegeList[i % 5];
    const name = `${firstNames[i]} ${String.fromCharCode(65 + (i % 26))}.`;
    const email = `student_${i + 6}@${col.code.toLowerCase()}.edu.in`;
    const rollNo = `${col.code}-2024-${String(i + 6).padStart(3, "0")}`;
    const profile = cohortProfiles[i];

    const student = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        rollNo,
        department: "Engineering",
        year: (i % 4) + 1,
        collegeId: col.id,
      },
      create: {
        name,
        email,
        rollNo,
        department: "Engineering",
        year: (i % 4) + 1,
        collegeId: col.id,
      },
    });
    seededUserIds.push(student.id);

    // Squad membership
    const colSquads = squads[col.name];
    allSquadMembers.push({
      userId: student.id,
      squadId: colSquads[i % colSquads.length],
      role: "member",
    });

    // League membership
    const colLeagues = leagues[col.name];
    const leagueTier = profile === "consistent" ? colLeagues.gold : profile === "declining" ? colLeagues.silver : colLeagues.bronze;
    allLeagueMembers.push({
      leagueId: leagueTier,
      userId: student.id,
      points: profile === "consistent" ? randomInt(800, 1300) : randomInt(100, 500),
      rank: (i % 10) + 1,
    });

    if (profile === "consistent") {
      // 40% consistent: active streak, workouts 4-5 days/week, risk ~0.10 - 0.25
      allStreaks.push({
        userId: student.id,
        currentStreak: randomInt(6, 20),
        longestStreak: randomInt(12, 25),
        lastActiveDate: now,
      });

      allRiskScores.push({
        userId: student.id,
        score: randomInt(10, 24) / 100,
        band: RiskBand.LOW,
        topReason: "Consistent workout rhythm and streak maintained",
        bootstrapActive: false,
        computedAt: now,
      });

      for (let d = 29; d >= 0; d--) {
        if (d % 3 === 0) continue; // 4-5 workouts per week
        allActivities.push({
          userId: student.id,
          type: randomChoice(["gym", "run", "hiit", "walk"]),
          durationMinutes: randomInt(30, 55),
          date: new Date(now.getTime() - d * 86400000),
          notes: "Regular training session.",
        });
      }
    } else if (profile === "declining") {
      // 25% declining: dropped in past 7 days, risk ~0.40 - 0.58
      const lastActiveDaysAgo = randomInt(2, 4);
      allStreaks.push({
        userId: student.id,
        currentStreak: 0,
        longestStreak: randomInt(5, 10),
        lastActiveDate: new Date(now.getTime() - lastActiveDaysAgo * 86400000),
      });

      allRiskScores.push({
        userId: student.id,
        score: randomInt(40, 58) / 100,
        band: RiskBand.MID,
        topReason: "Workout frequency dropped sharply over past 7 days",
        bootstrapActive: false,
        computedAt: now,
      });

      allInterventions.push({
        userId: student.id,
        type: InterventionType.SQUAD_NUDGE,
        message: `Hey ${firstNames[i]}, your squad misses you on the track! Drop in for a quick session whenever you can.`,
        firedAt: new Date(now.getTime() - 86400000),
        resolvedAt: null,
      });

      // Active earlier in the month, but quiet recently
      for (let d = 29; d >= 8; d -= 2) {
        allActivities.push({
          userId: student.id,
          type: "gym",
          durationMinutes: randomInt(30, 45),
          date: new Date(now.getTime() - d * 86400000),
          notes: "Routine workout.",
        });
      }
    } else if (profile === "sporadic") {
      // 20% sporadic: 1-2 days/week, gaps of 4-6 days, risk ~0.35 - 0.50
      const lastActiveDaysAgo = randomInt(3, 5);
      allStreaks.push({
        userId: student.id,
        currentStreak: 1,
        longestStreak: 3,
        lastActiveDate: new Date(now.getTime() - lastActiveDaysAgo * 86400000),
      });

      allRiskScores.push({
        userId: student.id,
        score: randomInt(35, 50) / 100,
        band: RiskBand.MID,
        topReason: "Weekly session completion fell below 50% target",
        bootstrapActive: false,
        computedAt: now,
      });

      for (let d = 29; d >= 5; d -= 5) {
        allActivities.push({
          userId: student.id,
          type: "walk",
          durationMinutes: randomInt(20, 40),
          date: new Date(now.getTime() - d * 86400000),
          notes: "Irregular session.",
        });
      }
    } else {
      // 15% dropout: zero activity for 10-18 days, high risk (>= 0.60)
      const lastActiveDaysAgo = randomInt(10, 18);
      allStreaks.push({
        userId: student.id,
        currentStreak: 0,
        longestStreak: randomInt(4, 8),
        lastActiveDate: new Date(now.getTime() - lastActiveDaysAgo * 86400000),
      });

      allRiskScores.push({
        userId: student.id,
        score: randomInt(68, 85) / 100,
        band: RiskBand.HIGH,
        topReason: `Zero workout activity logged in the past ${lastActiveDaysAgo} days`,
        bootstrapActive: false,
        computedAt: now,
      });

      allInterventions.push({
        userId: student.id,
        type: InterventionType.GOAL_DOWNGRADE,
        message: `Hey ${firstNames[i]}, we eased your target to 10 minutes so you can rebuild your streak stress-free!`,
        firedAt: new Date(now.getTime() - 2 * 86400000),
        resolvedAt: null,
      });

      for (let d = 29; d >= lastActiveDaysAgo; d -= 3) {
        allActivities.push({
          userId: student.id,
          type: "run",
          durationMinutes: 30,
          date: new Date(now.getTime() - d * 86400000),
          notes: "Old session before dropout.",
        });
      }
    }
  }

  // 7. Fast Idempotent Batch Reset of Child Data for Seeded Users
  console.log("⚡ Cleaning previous child records for seeded users...");
  await prisma.$transaction([
    prisma.activity.deleteMany({ where: { userId: { in: seededUserIds } } }),
    prisma.streak.deleteMany({ where: { userId: { in: seededUserIds } } }),
    prisma.riskScore.deleteMany({ where: { userId: { in: seededUserIds } } }),
    prisma.intervention.deleteMany({ where: { userId: { in: seededUserIds } } }),
    prisma.squadMember.deleteMany({ where: { userId: { in: seededUserIds } } }),
    prisma.leagueMember.deleteMany({ where: { userId: { in: seededUserIds } } }),
    prisma.challengeParticipant.deleteMany({ where: { userId: { in: seededUserIds } } }),
  ]);

  // 8. Bulk Create Child Data in Fast Batches
  console.log(`⚡ Inserting ${allActivities.length} activities...`);
  await prisma.activity.createMany({ data: allActivities });

  console.log(`⚡ Inserting ${allStreaks.length} streaks...`);
  await prisma.streak.createMany({ data: allStreaks });

  console.log(`⚡ Inserting ${allRiskScores.length} risk scores...`);
  await prisma.riskScore.createMany({ data: allRiskScores });

  console.log(`⚡ Inserting ${allInterventions.length} interventions...`);
  await prisma.intervention.createMany({ data: allInterventions });

  console.log(`⚡ Inserting ${allSquadMembers.length} squad memberships...`);
  await prisma.squadMember.createMany({ data: allSquadMembers, skipDuplicates: true });

  console.log(`⚡ Inserting ${allLeagueMembers.length} league memberships...`);
  await prisma.leagueMember.createMany({ data: allLeagueMembers, skipDuplicates: true });

  if (allChallengeParticipants.length > 0) {
    console.log(`⚡ Inserting ${allChallengeParticipants.length} challenge participants...`);
    await prisma.challengeParticipant.createMany({
      data: allChallengeParticipants,
      skipDuplicates: true,
    });
  }

  // 9. Summary Check (Sequential to safely respect connection_limit=1 pooler)
  const userCount = await prisma.user.count();
  const activityCount = await prisma.activity.count();
  const collegeCount = await prisma.college.count();
  const squadCount = await prisma.squad.count();
  const riskCount = await prisma.riskScore.count();
  const interventionCount = await prisma.intervention.count();
  const streakCount = await prisma.streak.count();

  console.log("\n==================================================");
  console.log("✅ FitForge Seed Successfully Completed!");
  console.log(`🏫 Colleges:           ${collegeCount}`);
  console.log(`👥 Students (Users):    ${userCount}`);
  console.log(`🏃 Activities:         ${activityCount}`);
  console.log(`🔥 Streaks:            ${streakCount}`);
  console.log(`🛡️ Squads:             ${squadCount}`);
  console.log(`📉 Risk Scores:        ${riskCount}`);
  console.log(`🚨 Interventions:      ${interventionCount}`);
  console.log("==================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
