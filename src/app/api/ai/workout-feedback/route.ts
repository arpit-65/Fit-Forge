import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WorkoutFeedbackSchema = z.object({
  exercise: z.string().min(1),
  totalReps: z.number().int().min(0),
  goodReps: z.number().int().min(0),
  faults: z.array(z.string()).default([]),
  durationSeconds: z.number().int().min(1),
  studentName: z.string().optional().default("Athlete"),
});

export interface WorkoutFeedbackResponse {
  grade: "A+" | "A" | "B+" | "B" | "C";
  scorePercent: number;
  coachSummary: string;
  topFix: string;
  streakEncouragement: string;
  pointsAwarded: number;
  provider: "gemini" | "biomechanics_rules";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = WorkoutFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid workout session data." } },
        { status: 400 }
      );
    }

    const { exercise, totalReps, goodReps, faults, durationSeconds, studentName } = parsed.data;

    // Calculate score percentage
    const scorePercent =
      totalReps > 0
        ? Math.round((goodReps / totalReps) * 100)
        : faults.length === 0
        ? 100
        : 75;

    // Determine letter grade
    let grade: WorkoutFeedbackResponse["grade"] = "B";
    if (scorePercent >= 92) grade = "A+";
    else if (scorePercent >= 82) grade = "A";
    else if (scorePercent >= 70) grade = "B+";
    else if (scorePercent >= 55) grade = "B";
    else grade = "C";

    // Award bonus points for high form accuracy
    const basePoints = 10;
    const formBonus = scorePercent >= 85 ? 5 : 0;
    const pointsAwarded = basePoints + formBonus;

    // Check for Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are FitForge AI, an encouraging campus fitness coach helping college students build workout consistency without guilt.
Review this student's live camera workout session:
- Student: ${studentName}
- Exercise: ${exercise}
- Total Reps: ${totalReps} (${goodReps} clean reps)
- Form Accuracy: ${scorePercent}%
- Detected Form Faults: ${faults.length > 0 ? faults.join(", ") : "None. Clean posture maintained."}
- Duration: ${durationSeconds} seconds

Respond strictly in valid JSON matching this schema:
{
  "coachSummary": "2-3 empathetic sentences praising effort and highlighting technique observations.",
  "topFix": "1 direct actionable biomechanics tip to focus on for their next set.",
  "streakEncouragement": "1 inspiring sentence celebrating their habit streak."
}`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        });

        const text = result.response.text();
        const aiJson = JSON.parse(text);

        return NextResponse.json({
          data: {
            grade,
            scorePercent,
            coachSummary: aiJson.coachSummary,
            topFix: aiJson.topFix,
            streakEncouragement: aiJson.streakEncouragement,
            pointsAwarded,
            provider: "gemini",
          },
        });
      } catch (geminiError) {
        console.warn("[Gemini AI feedback error, falling back to rules]:", geminiError);
      }
    }

    // Fallback: Deterministic Biomechanics Rules
    let defaultFix = "Maintain controlled tempo on the eccentric (lowering) phase.";
    if (faults.some((f) => f.includes("valgus") || f.includes("cave"))) {
      defaultFix = "Focus on corkscrewing your feet into the floor to keep knees tracking outward over your pinky toes.";
    } else if (faults.some((f) => f.includes("lean") || f.includes("collapsing") || f.includes("Chest"))) {
      defaultFix = "Fix your gaze forward and keep your chest proud throughout the entire rep.";
    } else if (faults.some((f) => f.includes("sagging") || f.includes("Hips"))) {
      defaultFix = "Squeeze your glutes and draw your navel toward your spine to keep a rigid plank line.";
    } else if (totalReps > 0 && goodReps / totalReps < 0.8) {
      defaultFix = "Focus on full range of motion. Touch parallel depth before initiating the upward drive.";
    }

    const defaultSummary =
      totalReps > 0
        ? `Great intensity! You powered through ${totalReps} ${exercise}s with a ${scorePercent}% form precision rating. Every completed rep directly reduces your campus dropout risk score.`
        : `Solid form drill session. You maintained strong focus on ${exercise} alignment and body control.`;

    const defaultEncouragement =
      "Showing up is the entire battle. Your consistency streak is secure for today!";

    return NextResponse.json({
      data: {
        grade,
        scorePercent,
        coachSummary: defaultSummary,
        topFix: defaultFix,
        streakEncouragement: defaultEncouragement,
        pointsAwarded,
        provider: "biomechanics_rules",
      },
    });
  } catch (error) {
    console.error("[Workout Feedback API Error]:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate workout feedback." } },
      { status: 500 }
    );
  }
}
