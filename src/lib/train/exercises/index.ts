import { ExerciseConfig } from "./types";
import { squatConfig } from "./squat";
import { pushupConfig } from "./pushup";
import { plankConfig } from "./plank";

export * from "./types";
export * from "./squat";
export * from "./pushup";
export * from "./plank";

export const EXERCISE_REGISTRY: Record<string, ExerciseConfig> = {
  squat: squatConfig,
  pushup: pushupConfig,
  plank: plankConfig,
};

export function getExerciseConfig(id: string): ExerciseConfig | undefined {
  return EXERCISE_REGISTRY[id];
}
