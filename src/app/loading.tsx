import { Leaf } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-x-0 top-14 md:top-20 bottom-0 z-40 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute h-24 w-24 rounded-full border-t-2 border-r-2 border-primary animate-spin opacity-20" />
        <div className="absolute h-16 w-16 rounded-full border-b-2 border-l-2 border-primary animate-spin shadow-lg shadow-primary/20 animation-delay-200" />
        <Leaf className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <h2 className="text-xl font-display font-black text-foreground mb-2">
        Cosechando datos...
      </h2>
      <p className="text-sm font-body text-muted-foreground animate-pulse">
        Conectando a la huerta digital
      </p>
    </div>
  );
}
