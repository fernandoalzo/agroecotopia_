import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  fullScreen?: boolean;
  text?: string;
  subtext?: string;
}

export function Loading({ 
  className, 
  fullScreen = false, 
  text = "Cosechando datos...", 
  subtext = "Conectando a la huerta digital" 
}: LoadingProps) {
  const containerClasses = cn(
    "flex flex-col items-center justify-center",
    fullScreen ? "fixed inset-x-0 top-14 md:top-20 bottom-0 z-40 bg-background/80 backdrop-blur-sm" : "py-20 w-full",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute h-24 w-24 rounded-full border-t-2 border-r-2 border-primary animate-spin opacity-20" />
        <div className="absolute h-16 w-16 rounded-full border-b-2 border-l-2 border-primary animate-spin shadow-lg shadow-primary/20 [animation-delay:200ms]" />
        <Leaf className="w-8 h-8 text-primary animate-pulse" />
      </div>
      {text && (
        <h2 className="text-xl font-display font-black text-foreground mb-2">
          {text}
        </h2>
      )}
      {subtext && (
        <p className="text-sm font-body text-muted-foreground animate-pulse">
          {subtext}
        </p>
      )}
    </div>
  );
}
