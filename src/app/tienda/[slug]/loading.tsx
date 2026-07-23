export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <main className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          {/* Back button skeleton */}
          <div className="h-4 w-20 bg-muted rounded animate-pulse mb-8" />

          {/* Seamless Header & Store Info Skeleton */}
          <div className="mb-16">
            {/* Store Name, Avatar & Badges Header Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-border/40">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-muted shrink-0 animate-pulse" />
              <div className="flex-1 space-y-3 w-full">
                <div className="flex gap-2">
                  <div className="h-6 w-28 bg-muted rounded-full animate-pulse" />
                  <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="h-10 w-2/3 sm:w-1/2 bg-muted rounded-xl animate-pulse" />
                <div className="h-5 w-5/6 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Seamless Details Grid + Owner Skeleton */}
            <div className="pt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Info Items Column Skeleton */}
              <div className="lg:col-span-2 space-y-6">
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-muted shrink-0 animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner Column Skeleton */}
              <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-border/40 pt-8 lg:pt-0 lg:pl-10">
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-muted shrink-0 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider line skeleton */}
          <div className="h-px w-full bg-border/40 mb-12" />

          {/* Products Catalog Skeleton */}
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="h-7 w-48 bg-muted rounded-lg animate-pulse" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="aspect-[4/5] bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
