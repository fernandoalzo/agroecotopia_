import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { config } from "@/config/config";

export const AnimatedLogo = () => {
  return (
    <Link href="/" className="group relative flex shrink-0 items-center gap-2 lg:gap-3 font-display text-lg font-bold lg:text-2xl transition-all duration-300">
      {/* Animated Logo Container - Spectacular */}
      <div className="relative flex items-center justify-center">
        {/* Outer rotating dashed ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -z-10 h-[140%] w-[140%] -ml-[20%] -mt-[20%] rounded-full border border-dashed border-primary/60 dark:border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        />
        
        <motion.div
          animate={{
            y: [0, -3, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 flex items-center justify-center"
        >
          <motion.div
            whileHover={{ rotate: 180, scale: 1.25 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Leaf className="h-7 w-7 text-primary lg:h-9 lg:w-9 transition-colors duration-500 drop-shadow-[0_4px_6px_rgba(34,197,94,0.4)] dark:drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] group-hover:text-accent" />
          </motion.div>
          
          {/* Micro-particles on hover */}
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-primary"
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              whileHover={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.5, 0],
                x: (i === 0 ? -15 : i === 1 ? 0 : 15), 
                y: -25 - (i * 5) 
              }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>

        {/* Pulsing aura */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 -z-20 h-full w-full rounded-full bg-primary/15 dark:bg-primary/30 blur-xl group-hover:bg-accent/25 dark:group-hover:bg-accent/40 group-hover:blur-2xl transition-colors duration-500" 
        />
      </div>

      {/* Premium Typography Container with Staggered Wave */}
      <div className="relative overflow-visible px-1">
        <motion.div 
          className="flex items-center tracking-tight lg:tracking-tighter"
          initial="initial"
          whileHover="hover"
        >
          {config.app.name.split("").map((letter, i) => (
            <motion.span
              key={i}
              variants={{
                initial: { y: 0, color: "var(--color-primary)" },
                hover: { 
                  y: [-2, -8, 0], 
                  color: ["var(--color-primary)", "var(--color-accent)", "var(--color-primary)"],
                  filter: [
                    "drop-shadow(0px 0px 0px rgba(0,0,0,0))", 
                    "drop-shadow(0px 6px 8px rgba(0,0,0,0.15))", 
                    "drop-shadow(0px 2px 4px rgba(0,0,0,0.05))"
                  ]
                }
              }}
              transition={{ 
                duration: 0.5, 
                ease: "easeInOut",
                delay: i * 0.04, // Stagger effect
              }}
              className={cn(
                "inline-block",
                "font-black",
                "text-[17px] lg:text-3xl"
              )}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>

        {/* Glowing Underline that expands from center */}
        <motion.div
          className="absolute -bottom-1 left-1/2 h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent rounded-full shadow-[0_0_12px_var(--color-accent)]"
          initial={{ width: 0, x: "-50%", opacity: 0 }}
          whileHover={{ width: "110%", opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        
        {/* Sparkle effect on the corner */}
        <motion.div
          className="absolute -top-1 -right-3 h-3 w-3 bg-amber-400 dark:bg-white"
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          whileHover={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90, 180] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} // Star shape
        />
      </div>
    </Link>
  );
};
