import { prisma } from "../src/lib/prisma";

async function applyIndexes() {
  console.log("Applying missing performance indexes...");

  const indexStatements = [
    `CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users"("name");`,
    `CREATE INDEX IF NOT EXISTS "users_collegeId_idx" ON "users"("collegeId");`,
    `CREATE INDEX IF NOT EXISTS "activities_date_idx" ON "activities"("date");`,
    `CREATE INDEX IF NOT EXISTS "challenge_participants_challengeId_idx" ON "challenge_participants"("challengeId");`,
    `CREATE INDEX IF NOT EXISTS "risk_scores_computedAt_idx" ON "risk_scores"("computedAt");`,
    `CREATE INDEX IF NOT EXISTS "risk_scores_band_idx" ON "risk_scores"("band");`,
    `CREATE INDEX IF NOT EXISTS "interventions_resolvedAt_idx" ON "interventions"("resolvedAt");`,
    `CREATE INDEX IF NOT EXISTS "interventions_type_idx" ON "interventions"("type");`,
  ];

  for (const sql of indexStatements) {
    console.log(`Executing: ${sql}`);
    await prisma.$executeRawUnsafe(sql);
  }

  console.log("All performance indexes applied successfully!");
}

applyIndexes()
  .catch((err) => {
    console.error("Failed to apply indexes:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
