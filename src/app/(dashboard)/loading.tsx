import { Skeleton, StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-52" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-9.5 w-32" />
      </div>
      <StatsSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}
