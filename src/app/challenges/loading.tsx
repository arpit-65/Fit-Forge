import { Skeleton } from "@/components/ui/Skeleton";
export default function ChallengesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Skeleton className="h-8 w-44" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
    </div>
  );
}
