export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <main className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="h-4 w-20 bg-muted rounded animate-pulse mb-8" />

          {/* Hero Section Skeleton */}
          <div className="relative rounded-3xl overflow-hidden bg-secondary/30 border border-border/50 p-6 sm:p-10 mb-10 animate-pulse">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-muted shrink-0" />
              <div className="flex-1 space-y-3 w-full">
                <div className="h-8 w-1/3 bg-muted rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-6 w-28 bg-muted rounded-full" />
                  <div className="h-6 w-24 bg-muted rounded-full" />
                </div>
              </div>
            </div>
            <div className="h-16 w-3/4 bg-muted rounded-lg mt-8" />
          </div>

          {/* Details Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6 sm:p-8 animate-pulse space-y-4">
              <div className="h-4 w-24 bg-muted rounded mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-4 w-32 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 flex flex-col items-center justify-center text-center animate-pulse space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted" />
              <div className="h-5 w-28 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          </div>

          {/* Products Skeleton */}
          <div className="space-y-6">
            <div className="h-7 w-32 bg-muted rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
