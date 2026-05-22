const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-gray-200/80 via-gray-100 to-gray-200/80 dark:from-gray-800 dark:via-gray-700/70 dark:to-gray-800 ${className}`}
    />
  );
};

export const StatCardSkeleton = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-start justify-between gap-4">
      <div className="w-full space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-44" />
      </div>
      <Skeleton className="h-12 w-12 rounded-2xl" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 6 }) => (
  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800 md:grid-cols-[1.5fr_1fr_1fr_0.8fr]"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-20 md:ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-4 w-[32rem] max-w-full" />
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  </div>
);

export default Skeleton;
