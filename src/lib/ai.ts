import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { InterventionType, RiskBand } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Context Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentNudgeContext {
  name: string;
  squadName?: string | null;
  streak?: number;
  department?: string;
  college?: string;
}

export interface RiskFactorsContext {
  score?: number | null;
  band?: RiskBand | string | null;
  topReason: string;
  daysSinceLastActivity?: number;
  completionRateLast7Days?: number;
  consecutiveMisses?: number;
  challengeMissCount?: number;
}

export interface SquadSummaryContext {
  name: string;
  memberCount: number;
  activeCount: number;
  totalMinutesThisWeek: number;
  topActivity?: string;
}

export interface AIResult<T> {
  data: T;
  provider: "gemini" | "template_fallback";
  model?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod Validation Schemas (Strict: under 200 chars, empathetic, no medical claims)
// ─────────────────────────────────────────────────────────────────────────────

// Safety filters to disallow shaming or medical claims
const FORBIDDEN_WORDS = [
  "cure",
  "diagnos",
  "disease",
  "prescription",
  "illness",
  "disgrace",
  "disappoint",
  "lazy",
  "shame",
  "fail",
  "punish",
];

function isCleanContent(text: string): boolean {
  const lower = text.toLowerCase();
  return !FORBIDDEN_WORDS.some((word) => lower.includes(word));
}

export const NudgeResponseSchema = z
  .string()
  .min(10, "Nudge is too short")
  .max(200, "Nudge exceeds maximum 200 characters limit")
  .refine(isCleanContent, {
    message: "Nudge text contains prohibited medical or shaming phrasing",
  })
  .transform((s) => s.trim().replace(/^["']|["']$/g, ""));

export const RiskExplanationSchema = z
  .string()
  .min(10, "Risk explanation is too short")
  .max(200, "Risk explanation exceeds maximum 200 characters limit")
  .refine(isCleanContent, {
    message: "Explanation contains prohibited medical or shaming phrasing",
  })
  .transform((s) => s.trim().replace(/^["']|["']$/g, ""));

export const SquadSummarySchema = z
  .string()
  .min(10, "Squad summary is too short")
  .max(200, "Squad summary exceeds maximum 200 characters limit")
  .refine(isCleanContent, {
    message: "Summary contains prohibited wording",
  })
  .transform((s) => s.trim().replace(/^["']|["']$/g, ""));

// ─────────────────────────────────────────────────────────────────────────────
// Prompt Injection Sanitizer: Ensure only safe alphanumeric characters
// ─────────────────────────────────────────────────────────────────────────────
function sanitizeText(input?: string | null): string {
  if (!input) return "";
  // Strip special control symbols, prompt injection phrases, quotes, brackets
  return input
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .slice(0, 40);
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Rate Limiter (30 requests / minute)
// ─────────────────────────────────────────────────────────────────────────────

export class SimpleRateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 30, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    this.timestamps.push(now);
    return true;
  }

  getRemaining(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  reset(): void {
    this.timestamps = [];
  }
}

export const aiRateLimiter = new SimpleRateLimiter(30, 60_000);

// ─────────────────────────────────────────────────────────────────────────────
// Empathetic Template Fallbacks (Deterministic & Zero-Fail Guarantee)
// ─────────────────────────────────────────────────────────────────────────────

export function getTemplateNudge(
  student: StudentNudgeContext,
  riskFactors: RiskFactorsContext,
  ladderLevel: InterventionType
): string {
  const safeName = sanitizeText(student.name.split(" ")[0]) || "there";
  const squad = student.squadName ? `the ${sanitizeText(student.squadName)} squad` : "your squad";

  switch (ladderLevel) {
    case InterventionType.SQUAD_NUDGE:
      return `Hey ${safeName}, your teammates in ${squad} miss you! Whenever you're ready, join back for a quick session.`;

    case InterventionType.GOAL_DOWNGRADE:
      return `Hey ${safeName}, we lowered your workout target to make getting back into rhythm smooth and stress-free. Every minute counts!`;

    case InterventionType.MENTOR_CHECKIN:
      return `Hi ${safeName}, your campus coach noticed a shift in your workout rhythm and is here to support you. Let's do a quick friendly check-in whenever you have time.`;

    case InterventionType.NUDGE:
    default:
      return `Hey ${safeName}, no pressure at all! A quick 10-minute stretch or walk today is more than enough to stay consistent.`;
  }
}

export function getTemplateRiskExplanation(
  riskFactors: RiskFactorsContext
): string {
  const reason = sanitizeText(riskFactors.topReason) || "a pause in recent sessions";
  return `Activity frequency changed due to ${reason.toLowerCase()}. Short, low-friction workouts will help rebuild your rhythm smoothly.`;
}

export function getTemplateSquadSummary(squad: SquadSummaryContext): string {
  const safeSquad = sanitizeText(squad.name) || "Squad";
  return `${safeSquad} completed ${Math.min(9999, squad.totalMinutesThisWeek)} active minutes with ${squad.activeCount} active teammates!\nKeep supporting each other.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini Helper with 8s Timeout & Safe Execution
// ─────────────────────────────────────────────────────────────────────────────

async function executeGeminiPromptWithTimeout(
  prompt: string,
  timeoutMs = 8000
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-gemini-api-key") {
    return null;
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 90,
    },
  });

  const apiPromise = (async () => {
    const res = await model.generateContent(prompt);
    return res.response.text();
  })();

  const timeoutPromise = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini call timed out after 8s")), timeoutMs)
  );

  return Promise.race([apiPromise, timeoutPromise]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core AI Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function generateNudge(
  student: StudentNudgeContext,
  riskFactors: RiskFactorsContext,
  ladderLevel: InterventionType
): Promise<string> {
  const fallback = getTemplateNudge(student, riskFactors, ladderLevel);

  if (!aiRateLimiter.isAllowed()) {
    return fallback;
  }

  const firstName = sanitizeText(student.name.split(" ")[0]) || "there";
  const safeSquad = sanitizeText(student.squadName) || "None";
  const safeReason = sanitizeText(riskFactors.topReason) || "workout frequency change";
  const daysInactive = Number(riskFactors.daysSinceLastActivity ?? 0);

  // Strictly sanitized structured prompt with numbers & enums
  const prompt = `You are FitForge Coach, an empathetic campus fitness mentor.
Write a 1-2 sentence kind, encouraging check-in message for a student.

STUDENT INFO:
- Name: ${firstName}
- Squad: ${safeSquad}
- Ladder Level: ${ladderLevel}
- Days Inactive: ${daysInactive}
- Driver: ${safeReason}

CONSTRAINTS:
1. Under 180 characters total.
2. Kind, supportive, and completely non-shaming. No guilt, no scolding.
3. No medical claims or diagnosis.
4. Plain text only, no quotes or markdown.`;

  try {
    const rawText = await executeGeminiPromptWithTimeout(prompt, 8000);
    if (!rawText) return fallback;

    const parsed = NudgeResponseSchema.safeParse(rawText);
    if (parsed.success) {
      return parsed.data;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function explainRisk(
  riskFactors: RiskFactorsContext
): Promise<string> {
  const fallback = getTemplateRiskExplanation(riskFactors);

  if (!aiRateLimiter.isAllowed()) {
    return fallback;
  }

  const safeBand = riskFactors.band || "UNKNOWN";
  const safeReason = sanitizeText(riskFactors.topReason) || "inactivity";
  const consecutiveMisses = Number(riskFactors.consecutiveMisses ?? 0);

  const prompt = `You are FitForge Coach. Explain why a student's consistency changed in 1 sentence.
BAND: ${safeBand}
REASON: ${safeReason}
MISSES: ${consecutiveMisses}

CONSTRAINTS:
1. Max 180 characters.
2. Constructive and non-judgmental.
3. No medical claims.
4. Plain text only.`;

  try {
    const rawText = await executeGeminiPromptWithTimeout(prompt, 8000);
    if (!rawText) return fallback;

    const parsed = RiskExplanationSchema.safeParse(rawText);
    if (parsed.success) {
      return parsed.data;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function squadSummary(
  squad: SquadSummaryContext
): Promise<string> {
  const fallback = getTemplateSquadSummary(squad);

  if (!aiRateLimiter.isAllowed()) {
    return fallback;
  }

  const safeSquad = sanitizeText(squad.name) || "Squad";
  const totalMins = Number(squad.totalMinutesThisWeek || 0);
  const activeCount = Number(squad.activeCount || 0);
  const totalCount = Number(squad.memberCount || 0);

  const prompt = `Write a short 2-line peer cheer for campus fitness squad ${safeSquad}.
STATS: ${totalMins} minutes logged, ${activeCount}/${totalCount} active teammates.
CONSTRAINTS: Max 180 chars, uplifting, no medical claims.`;

  try {
    const rawText = await executeGeminiPromptWithTimeout(prompt, 8000);
    if (!rawText) return fallback;

    const parsed = SquadSummarySchema.safeParse(rawText);
    if (parsed.success) {
      return parsed.data;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
