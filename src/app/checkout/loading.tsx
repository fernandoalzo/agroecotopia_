import { Sprout } from "lucide-react";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <Sprout className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: "2s" }} />
        </div>
      </div>
    </div>
  );
}
