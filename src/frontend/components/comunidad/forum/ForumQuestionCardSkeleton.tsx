export function ForumQuestionCardSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 py-4 px-2 -mx-2 rounded-xl border-b border-border/50">
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0 sm:w-32 pt-1 pr-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-sm bg-muted overflow-hidden relative">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
            ))}
          </div>
          <div className="h-3 w-5 rounded-full bg-muted overflow-hidden relative">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>
        </div>

        <div className="h-5 w-16 rounded bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="h-4 w-3/4 rounded-full bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>

        <div className="h-3 w-full rounded-full bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-3 w-5/6 rounded-full bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-1">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-5 w-16 rounded-md bg-muted overflow-hidden relative">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <div className="h-3 w-16 rounded-full bg-muted overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            <div className="h-3 w-4 rounded-full bg-muted overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            <div className="h-3 w-20 rounded-full bg-muted overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
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

export default ForumQuestionCardSkeleton;
