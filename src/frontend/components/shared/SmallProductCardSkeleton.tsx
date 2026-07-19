/**
 * SmallProductCardSkeleton
 *
 * Pixel-perfect skeleton of the compact ProductCard variant.
 * Mirrors every section in exact order and sizing:
 *   image (aspect-[5/4]) → title → store row → 5 stars + rating →
 *   price block → delivery line → border-t qty+cart footer.
 *
 * Designed to be dropped into the same snap-center wrapper that holds a real
 * ProductCard compact, so it takes up identical space while data loads.
 */
export function SmallProductCardSkeleton() {
  return (
    <div className="flex flex-col w-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Image area — aspect-[5/4] matches compact card image container */}
      <div className="relative aspect-[5/4] w-full bg-secondary/40 dark:bg-[#121212] overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>

      {/* Content — p-2.5 to match card padding */}
      <div className="p-2.5 flex flex-col flex-grow gap-1.5">
        {/* Title (line-clamp-1 text-xs font-bold) */}
        <div className="h-2.5 w-3/4 rounded-full bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>

        {/* Store name row (text-[10px]) */}
        <div className="h-2 w-1/2 rounded-full bg-muted overflow-hidden relative">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>

        {/* Stars row — 5 × w-2.5 squares + rating text pill */}
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-sm bg-muted overflow-hidden relative flex-shrink-0"
            >
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
          ))}
          <div className="h-2 w-6 rounded-full bg-muted overflow-hidden relative ml-0.5">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>
        </div>

        {/* mt-auto block — price + delivery + footer (mirrors compact card) */}
        <div className="mt-auto flex flex-col gap-0.5">
          {/* Price (text-base font-black) */}
          <div className="h-4 w-1/2 rounded-full bg-muted overflow-hidden relative">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>

          {/* Delivery line */}
          <div className="h-2 w-3/5 rounded-full bg-muted overflow-hidden relative mt-0.5">
            <div className="absolute inset-0 skeleton-shimmer" />
          </div>

          {/* Footer: qty pill + cart button, separated by border-t */}
          <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-border/50">
            <div className="h-4 w-12 rounded-full bg-muted overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            <div className="h-5 w-5 rounded-lg bg-muted overflow-hidden relative">
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

export default SmallProductCardSkeleton;
