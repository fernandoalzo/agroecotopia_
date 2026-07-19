export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col w-full h-full bg-card border border-border rounded-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 z-10 flex flex-col gap-1 p-2">
        <div className="h-3.5 w-16 rounded-sm bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
      </div>

      <div className="relative aspect-square w-full bg-secondary/40 dark:bg-[#121212] overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>

      <div className="p-3 flex flex-col flex-grow gap-1.5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-14 rounded-full bg-muted overflow-hidden relative">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            <div className="w-3 h-3 rounded-sm bg-muted overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
          </div>
        </div>

        <div className="h-3.5 w-full rounded-sm bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-3.5 w-2/3 rounded-sm bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>

        <div className="h-3 w-1/3 rounded-full bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-sm bg-muted overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
          ))}
          <div className="h-2 w-5 rounded-full bg-muted overflow-hidden relative ml-0.5">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-1.5">
          <div className="h-5 w-1/3 rounded-full bg-muted overflow-hidden relative">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>

          <div className="h-2.5 w-2/5 rounded-full bg-muted overflow-hidden relative">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>

          <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-border/50">
            <div className="h-6 w-14 rounded-full bg-muted overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden relative">
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

export default ProductCardSkeleton;
