"use client";

import ProductCardSkeleton from "@/components/shared/ProductCardSkeleton";
import { SmallProductCardSkeleton } from "@/components/shared/SmallProductCardSkeleton";

interface ProductsGridSkeletonProps {
  viewMode?: 'grid' | 'compact';
  count?: number;
  showPagination?: boolean;
}

export function ProductsGridSkeleton({ viewMode = 'grid', count = 20, showPagination = false }: ProductsGridSkeletonProps) {
  const grid = viewMode === 'compact' ? renderCompactGrid(count) : renderGrid(count);

  return (
    <div className="w-full">
      {grid}
      {showPagination && <PaginationSkeleton />}
    </div>
  );
}

function renderGrid(count: number) {
  const rowCount = Math.ceil(count / 5);

  return (
    <div className="w-full space-y-8 md:space-y-10">
      {Array.from({ length: rowCount }).map((_, rowIndex) => {
        const itemsInRow = rowIndex < rowCount - 1 ? 5 : count % 5 || 5;
        return (
          <div key={rowIndex} className="relative group w-full">
            <div className="flex overflow-x-auto snap-x snap-mandatory pb-3 gap-6 md:gap-8 px-1">
              {Array.from({ length: itemsInRow }).map((_, index) => (
                <div
                  key={index}
                  className="min-w-[85vw] sm:min-w-[45vw] md:min-w-[31%] lg:min-w-[23.5%] snap-center"
                >
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderCompactGrid(count: number) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SmallProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="mt-12 flex items-center justify-center gap-2 md:gap-3">
      <div className="h-10 w-24 rounded-full bg-muted overflow-hidden relative">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 w-10 rounded-full bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
      ))}
      <div className="h-10 w-24 rounded-full bg-muted overflow-hidden relative">
        <div className="absolute inset-0 skeleton-shimmer" />
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

export default ProductsGridSkeleton;
