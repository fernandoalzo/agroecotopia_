export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-body">
      <main className="pt-24 pb-16 md:pt-32 md:pb-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="w-20 h-4 bg-muted rounded animate-pulse mb-6" />

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Image skeleton */}
            <div className="bg-secondary/30 dark:bg-[#121212] p-4 md:p-8 flex items-center justify-center h-[400px] md:h-[500px] relative rounded-3xl">
              <div className="w-full h-full bg-muted/50 rounded-2xl animate-pulse" />
            </div>

            {/* Details skeleton */}
            <div className="flex flex-col space-y-4">
              <div className="flex gap-2">
                <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
              <div className="w-3/4 h-8 bg-muted rounded animate-pulse" />
              <div className="w-1/3 h-4 bg-muted rounded animate-pulse" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
              <div className="w-1/4 h-8 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="w-full h-3 bg-muted rounded animate-pulse" />
                <div className="w-full h-3 bg-muted rounded animate-pulse" />
                <div className="w-2/3 h-3 bg-muted rounded animate-pulse" />
              </div>
              <div className="w-1/3 h-10 bg-muted rounded-xl animate-pulse mt-4" />
              <div className="w-full h-14 bg-muted rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
