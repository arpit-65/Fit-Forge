import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Root-level loading state shown while the page shell loads.
 * Styled with FitForge layout metrics and theme tokens.
 */
export default function RootLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-8 px-6 py-24">
      {/* Badge skeleton */}
      <Skeleton className="h-8 w-48 rounded-full" />
      {/* Heading skeleton */}
      <Skeleton className="h-16 w-full max-w-2xl rounded-2xl" />
      {/* Paragraph skeleton */}
      <Skeleton className="h-6 w-full max-w-lg rounded-xl" />
      {/* Actions */}
      <div className="flex gap-4 mt-2">
        <Skeleton className="h-12 w-36 rounded-full" />
        <Skeleton className="h-12 w-36 rounded-full" />
      </div>
      {/* Cards preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
