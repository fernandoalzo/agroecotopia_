"use client";

import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";

export function AuthVisualPanel() {
  return (
    <div className="visual-side">
      <div className="visual-side-bg-svg">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 100C50 100 0 50 50 0C100 50 100 100 50 100Z" fill="currentColor" />
        </svg>
      </div>

      <div className="visual-side-content">
        <Link href="/" className="back-link">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Volver a inicio</span>
        </Link>

        <div className="logo-container">
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
