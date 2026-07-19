import { HomeSkeleton } from "@/components/home/HomeSkeleton";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow">
        <HomeSkeleton />
      </main>
    </div>
  );
}
