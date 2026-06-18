"use client";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  emoji?: string | null;
  images?: string[];
}

interface RelatedProductsProps {
  products: RelatedProduct[];
  title: string;
  formatPrice: (price: number) => string;
}

export function RelatedProducts({ products, title, formatPrice }: RelatedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="border-t border-border/50 px-5 md:px-7 py-5">
      <h3 className="font-display text-sm font-black uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((rp) => (
          <div key={rp.id} className="min-w-[160px] md:min-w-[180px] shrink-0">
            <div className="bg-secondary/40 rounded-xl p-3 border border-border/40">
              <div className="text-3xl mb-2">{rp.emoji || "📦"}</div>
              <p className="text-xs font-bold truncate">{rp.name}</p>
              <p className="text-xs font-black text-primary mt-1">{formatPrice(rp.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
