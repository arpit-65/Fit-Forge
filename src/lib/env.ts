import "server-only";
import { z } from "zod";

/**
 * Server-side Environment Variables Validation Schema
 * Enforces presence and structure of required secrets and connection strings.
 */
const envSchema = z.object({
  // Supabase PostgreSQL Database Connections
  DATABASE_URL: z.string().min(1, "DATABASE_URL (Supabase connection pooler) is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL (Supabase direct connection) is required"),

  // Supabase Auth & Storage Public Credentials
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // Service role key for admin tasks (server-only)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Cron & API Security
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required for protected recomputation tasks"),
  RISK_RECOMPUTE_SECRET: z.string().optional(),

  // Optional AI Integration
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((err: z.ZodIssue) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");

    console.error(
      `\n❌ [FitForge] Environment validation failed:\n${formattedErrors}\n`
    );

    // In production or test environments, warn or throw clear error
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid environment variables:\n${formattedErrors}`);
    }
  }

  return (result.success ? result.data : process.env) as Env;
}

export const env = validateEnv();
