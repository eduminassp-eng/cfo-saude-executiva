import { Skeleton } from '@/components/ui/skeleton';

function ScoreCardSkeleton() {
  return (
    <div className="glass-card p-5 flex flex-col items-center gap-3">
      <Skeleton className="w-20 h-20 rounded-full" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-2 w-10" />
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-baseline gap-1.5">
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-3 w-8" />
      </div>
      <Skeleton className="h-10 w-full rounded" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  );
}

function AlertSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4 flex items-start gap-3 border-l-4 border-l-muted">
      <Skeleton className="w-5 h-5 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="glass-card p-5 space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-64" />
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Alert */}
      <AlertSkeleton />

      {/* Score Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <ScoreCardSkeleton />
        <ScoreCardSkeleton />
        <ScoreCardSkeleton />
        <div className="hidden lg:block"><ScoreCardSkeleton /></div>
      </div>

      {/* Priority section */}
      <SectionSkeleton rows={4} />

      {/* KPI Grid */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionSkeleton rows={5} />
        <SectionSkeleton rows={5} />
      </div>
    </div>
  );
}

export function ListPageSkeleton({ title = true, cards = 6 }: { title?: boolean; cards?: number }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {title && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-3.5 w-72" />
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4 text-center space-y-2">
            <Skeleton className="h-7 w-10 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* List items */}
      <div className="space-y-2">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="glass-card p-4 flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-3 w-14 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridPageSkeleton({ title = true, cards = 8 }: { title?: boolean; cards?: number }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {title && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-3.5 w-72" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-4 text-center space-y-2">
            <Skeleton className="h-7 w-10 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-xl" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
