import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <Skeleton className="h-9.5 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9.5 flex-1 max-w-sm" />
        <Skeleton className="h-9.5 w-36" />
      </div>
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}
