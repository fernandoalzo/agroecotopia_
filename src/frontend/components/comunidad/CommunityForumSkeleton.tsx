import { ForumQuestionCardSkeleton } from "./forum/ForumQuestionCardSkeleton";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-muted overflow-hidden relative ${className ?? ""}`}>
      <div className="absolute inset-0 skeleton-shimmer" />
    </div>
  );
}

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div className={`bg-muted overflow-hidden relative rounded-full ${className ?? ""}`}>
      <div className="absolute inset-0 skeleton-shimmer" />
    </div>
  );
}

function FilterCategorySkeleton() {
  return (
    <div className="border-b border-border/50 pb-4">
      <div className="flex items-center justify-between mb-3">
        <ShimmerBar className="h-3 w-24" />
        <ShimmerBar className="h-3 w-3" />
      </div>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerBar key={i} className="h-5 w-3/4" />
        ))}
      </div>
    </div>
  );
}

function TrendingBannerSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <SkeletonBlock className="w-5 h-5 rounded-full" />
        <ShimmerBar className="h-5 w-44" />
      </div>
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ShimmerBar key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
  );
}

function StatsPanelSkeleton() {
  return (
    <div className="space-y-10 px-2">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <SkeletonBlock className="w-3 h-3 rounded-sm" />
          <ShimmerBar className="h-3 w-28" />
        </div>
        <div className="space-y-2">
          <ShimmerBar className="h-9 w-24" />
          <ShimmerBar className="h-3 w-20" />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <SkeletonBlock className="w-3 h-3 rounded-sm" />
          <ShimmerBar className="h-3 w-24" />
        </div>
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <ShimmerBar className="h-3.5 w-28" />
                <ShimmerBar className="h-2.5 w-16" />
              </div>
              <ShimmerBar className="h-3.5 w-10" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <ShimmerBar className="h-3 w-20 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-start">
              <SkeletonBlock className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" />
              <ShimmerBar className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommunityForumSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pt-16 md:pt-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="hidden lg:block lg:col-span-3 space-y-6 lg:space-y-8">
            <ShimmerBar className="h-8 w-full" />
            <FilterCategorySkeleton />
            <FilterCategorySkeleton />
            <FilterCategorySkeleton />
          </div>

          <div className="col-span-1 lg:col-span-6 space-y-6">
            <TrendingBannerSkeleton />

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <ShimmerBar className="h-4 w-20" />
                <ShimmerBar className="h-4 w-20" />
              </div>
              <ShimmerBar className="h-4 w-32" />
            </div>

            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <ForumQuestionCardSkeleton key={i} />
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <ShimmerBar className="h-10 w-36 rounded-full" />
            </div>
          </div>

          <div className="hidden xl:block xl:col-span-3 sticky top-28">
            <StatsPanelSkeleton />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skeleton-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            oklch(0.7 0.25 150 / 0.08) 40%,
            oklch(0.8 0.15 150 / 0.14) 50%,
            oklch(0.7 0.25 150 / 0.08) 60%,
            transparent 100%
          );
          animation: skeleton-sweep 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default CommunityForumSkeleton;
