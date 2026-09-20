import { Skeleton } from "@/components/ui/Skeleton";
export default function ChallengeDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-96" />
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="col-span-2 h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
