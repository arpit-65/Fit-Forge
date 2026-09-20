import cn from "clsx";

interface SkeletonProps {
  className?: string;
}

/**
 * Reusable pulse skeleton — styled with FitForge tokens to prevent blank screens.
 * @example <Skeleton className="h-8 w-48 rounded-lg" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[var(--ff-bg-secondary)]/80 border border-[var(--ff-border)]/40",
        className,
      )}
      aria-hidden="true"
    />
  );
}
