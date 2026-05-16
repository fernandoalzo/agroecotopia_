"use client";

import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";

export function AuthVisualPanel() {
  return (
    <div className="hidden relative w-1/2 bg-[#0a1f14] dark:bg-[#050b08] border-r border-border/50 overflow-hidden items-center justify-center p-12 md:flex">
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none text-emerald-400">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 100C50 100 0 50 50 0C100 50 100 100 50 100Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col max-w-lg text-white">
        <Link href="/" className="inline-flex items-center gap-2 mb-16 text-emerald-400 hover:text-emerald-300 transition-colors w-fit">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Volver a inicio</span>
        </Link>

        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
          <Leaf className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-6">
          Sembramos vida, <br />
          <span className="text-emerald-400">cosechamos futuro.</span>
        </h1>
        <p className="text-lg text-white/70 leading-relaxed font-medium">
          Únete a la comunidad de Agroecotopia. Accede a los mejores productos ecológicos y sustentables para tu cultivo, directo del campo a tus manos.
        </p>
      </div>
    </div>
  );
}
