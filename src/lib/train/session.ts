import { CompletedRep } from "./repCounter";

export interface SessionIssue {
  issue: string;
  count: number;
}

export interface SessionSummary {
  exerciseId: string;
  totalReps: number;
  goodReps: number;
  formScore: number; // 0–100
  averageDepth: number; // Average inflection angle in degrees
  topIssues: SessionIssue[]; // Top 3 issues by occurrence count
  durationSeconds: number;
  reps: CompletedRep[];
}

export class WorkoutSessionTracker {
  private exerciseId: string;
  private startTime: number;
  private reps: CompletedRep[] = [];
  private issueCounts: Map<string, number> = new Map();

  constructor(exerciseId: string) {
    this.exerciseId = exerciseId;
    this.startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  public recordRep(rep: CompletedRep) {
    this.reps.push(rep);

    // Track issue counts
    rep.faults.forEach((fault) => {
      const current = this.issueCounts.get(fault) || 0;
      this.issueCounts.set(fault, current + 1);
    });
  }

  public getSummary(now?: number): SessionSummary {
    const currentTime = now ?? (typeof performance !== "undefined" ? performance.now() : Date.now());
    const durationSeconds = Math.max(0, Math.round((currentTime - this.startTime) / 1000));

    const totalReps = this.reps.length;
    const goodReps = this.reps.filter((r) => r.good).length;

    // Form score 0–100: percentage of good reps, or 100 if no reps yet
    const formScore =
      totalReps > 0 ? Math.round((goodReps / totalReps) * 100) : 100;

    // Average depth: mean of minimum angles recorded
    const averageDepth =
      totalReps > 0
        ? Math.round(
            (this.reps.reduce((sum, r) => sum + r.minAngle, 0) / totalReps) * 10
          ) / 10
        : 0;

    // Sort issues by count descending, take top 3
    const sortedIssues: SessionIssue[] = Array.from(this.issueCounts.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      exerciseId: this.exerciseId,
      totalReps,
      goodReps,
      formScore,
      averageDepth,
      topIssues: sortedIssues,
      durationSeconds,
      reps: [...this.reps],
    };
  }

  public reset(exerciseId?: string) {
    if (exerciseId) {
      this.exerciseId = exerciseId;
    }
    this.startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.reps = [];
    this.issueCounts.clear();
  }
}
