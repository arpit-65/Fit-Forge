import { prisma } from "../src/lib/prisma";

async function runExplain() {
  console.log("=== EXPLAIN ANALYZE ON CORE QUERIES ===");

  try {
    // 1. Query user by name (featured students / mechanic example)
    const explainUserName = await prisma.$queryRawUnsafe<any[]>(
      `EXPLAIN ANALYZE SELECT id, name, email FROM users WHERE name = 'Ritika Bisht';`
    );
    console.log("\n1. Query: SELECT user WHERE name = 'Ritika Bisht'");
    explainUserName.forEach((row: any) => console.log(row["QUERY PLAN"]));

    // 2. Query user by featured names list
    const explainFeatured = await prisma.$queryRawUnsafe<any[]>(
      `EXPLAIN ANALYZE SELECT id, name FROM users WHERE name IN ('Arpit Sharma', 'Apoorav Mehta', 'Ritika Bisht', 'Grima Rawat', 'Pankaj Negi');`
    );
    console.log("\n2. Query: SELECT users WHERE name IN (5 featured names)");
    explainFeatured.forEach((row: any) => console.log(row["QUERY PLAN"]));

    // 3. Query interventions by resolved status
    const explainInterventions = await prisma.$queryRawUnsafe<any[]>(
      `EXPLAIN ANALYZE SELECT id, type, "resolvedAt" FROM interventions WHERE "resolvedAt" IS NULL;`
    );
    console.log("\n3. Query: SELECT interventions WHERE resolvedAt IS NULL");
    explainInterventions.forEach((row: any) => console.log(row["QUERY PLAN"]));

    // 4. Query activities for user ordered by date
    const explainActivities = await prisma.$queryRawUnsafe<any[]>(
      `EXPLAIN ANALYZE SELECT id, type, "durationMinutes", date FROM activities WHERE "userId" = 'dummy' ORDER BY date DESC;`
    );
    console.log("\n4. Query: SELECT activities WHERE userId = ... ORDER BY date DESC");
    explainActivities.forEach((row: any) => console.log(row["QUERY PLAN"]));

    // 5. Query risk scores for user
    const explainRisk = await prisma.$queryRawUnsafe<any[]>(
      `EXPLAIN ANALYZE SELECT id, score, band, "computedAt" FROM risk_scores WHERE "userId" = 'dummy' ORDER BY "computedAt" DESC LIMIT 1;`
    );
    console.log("\n5. Query: SELECT risk_scores WHERE userId = ... ORDER BY computedAt DESC LIMIT 1");
    explainRisk.forEach((row: any) => console.log(row["QUERY PLAN"]));

  } catch (err) {
    console.error("EXPLAIN error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runExplain();
