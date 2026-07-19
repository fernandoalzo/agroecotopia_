import { ProductCardSkeleton } from "@/components/shared/ProductCardSkeleton";

function ShimmerBlock({ className }: { className?: string }) {
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

function HeaderSkeleton() {
  return (
    <div className="container mx-auto px-4 md:px-6 mb-12 md:mb-20">
      <div className="flex flex-col items-center text-center gap-4">
        <ShimmerBar className="h-6 w-48" />
        <ShimmerBar className="h-10 md:h-14 w-64 md:w-96" />
        <ShimmerBar className="h-1 w-48" />
      </div>
    </div>
  );
}

function ToolbarDesktopSkeleton() {
  return (
    <div className="hidden md:flex flex-col border-b border-border/80 pb-10">
      <div className="flex flex-row gap-8 justify-between items-center">
        <div className="relative w-full md:w-[350px]">
          <div className="w-full h-12 pl-10 pr-10 border-b-2 border-border/50 bg-transparent" />
        </div>

        <div className="flex items-center gap-3 bg-card/30 backdrop-blur-md border border-border/60 p-1.5 rounded-2xl">
          <div className="flex items-center gap-2 px-3 border-r border-border/60">
            <ShimmerBlock className="w-4 h-4 rounded-sm" />
            <ShimmerBar className="h-8 w-20" />
          </div>

          <div className="flex gap-1">
            <ShimmerBlock className="h-10 w-14 rounded-xl" />
            <ShimmerBlock className="h-10 w-14 rounded-xl" />
          </div>

          <ShimmerBlock className="h-10 w-24 rounded-xl border border-border/60" />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-4 w-full">
          <ShimmerBar className="h-px flex-1" />
          <div className="flex items-center gap-2.5 shrink-0">
            <ShimmerBar className="h-3 w-24" />
            <ShimmerBlock className="w-3 h-3 rounded-sm" />
          </div>
          <ShimmerBar className="h-px flex-1" />
        </div>
      </div>
    </div>
  );
}

function ToolbarMobileSkeleton() {
  return (
    <div className="md:hidden flex flex-col gap-4">
      <div className="relative w-full">
        <div className="w-full h-12 pl-10 pr-10 border-b-2 border-border/50 bg-transparent" />
      </div>
      <div className="border-t border-border/40 pt-4 mt-2">
        <div className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-3">
            <ShimmerBlock className="w-8 h-8 rounded-xl" />
            <ShimmerBar className="h-3 w-24" />
          </div>
          <ShimmerBlock className="w-7 h-7 rounded-full" />
        </div>
      </div>
      <div className="border-t border-border/80 my-2" />
      <div className="flex items-center justify-between bg-card/30 backdrop-blur-md border border-border/60 p-1.5 rounded-2xl w-full">
        <div className="flex items-center gap-2 px-3 border-r border-border/60">
          <ShimmerBlock className="w-4 h-4 rounded-sm" />
          <ShimmerBar className="h-8 w-20" />
        </div>
        <div className="flex gap-1">
          <ShimmerBlock className="h-10 w-14 rounded-xl" />
          <ShimmerBlock className="h-10 w-14 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="w-full space-y-8 md:space-y-10">
      {Array.from({ length: 4 }).map((_, rowIndex) => (
        <div key={rowIndex} className="relative group w-full">
          <div className="flex overflow-x-auto snap-x snap-mandatory pb-3 gap-6 md:gap-8 px-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="min-w-[85vw] sm:min-w-[45vw] md:min-w-[31%] lg:min-w-[23.5%] snap-center"
              >
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="mt-12 flex items-center justify-center gap-2 md:gap-3">
      <ShimmerBar className="h-10 w-24" />
      {Array.from({ length: 5 }).map((_, i) => (
        <ShimmerBar key={i} className="h-10 w-10" />
      ))}
      <ShimmerBar className="h-10 w-24" />
    </div>
  );
}

export function ProductsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-body">
      <main className="pt-24 pb-16 md:pt-32 md:pb-32">
        <HeaderSkeleton />

        <div className="container mx-auto px-4 md:px-6 mb-12">
          <ToolbarDesktopSkeleton />
          <ToolbarMobileSkeleton />
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="min-h-[500px]">
            <GridSkeleton />
            <PaginationSkeleton />
          </div>
        </div>
      </main>

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

export default ProductsPageSkeleton;
