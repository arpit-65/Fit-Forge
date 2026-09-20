-- Enable Row Level Security (RLS) on all FitForge tables
-- Ensures the Supabase anonymous key (used in browser client) cannot read or write
-- tables directly via PostgREST. Prisma connecting with database credentials retains full access.

ALTER TABLE "colleges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "squads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "squad_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "challenge_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "squad_challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "risk_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interventions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "points_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "streaks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leagues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "league_members" ENABLE ROW LEVEL SECURITY;

-- Unique constraint for SquadMember [squadId, userId]
CREATE UNIQUE INDEX IF NOT EXISTS "squad_members_squadId_userId_key" ON "squad_members"("squadId", "userId");
