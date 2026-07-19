"use client";

import React from "react";
import { SmallProductCardSkeleton } from "@/components/shared/SmallProductCardSkeleton";


export function HomeSkeleton() {
  return (
    <div className="relative w-full bg-background flex flex-col z-10 min-h-screen overflow-x-hidden">
      
      {/* PERSISTENT HUD: Navigation dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-4 items-center bg-background/30 backdrop-blur-md px-3 py-6 rounded-full border border-primary/10 shadow-lg">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="w-4 h-4 flex items-center justify-center relative"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-muted/40 overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
        <div className="absolute inset-0 opacity-40 dark:opacity-60">
          <div className="absolute top-[-10%] left-[-10%] w-[130%] h-[130%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-primary/5 to-transparent blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-accent/5 to-transparent blur-[100px]" />
        </div>
      </div>

      {/* SECTIONS LAYOUT */}
      <div className="relative z-10 w-full flex flex-col">
        
        {/* STAGE 1: WELCOME / HERO */}
        <section className="w-full min-h-screen flex items-center justify-center p-4 relative border-b border-border/5">
          <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-4 text-center flex flex-col items-center">
            {/* Badge */}
            <div className="mb-5 h-5 w-40 rounded-full bg-muted/60 overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>

            {/* Title */}
            <div className="w-3/4 sm:w-2/3 h-10 sm:h-16 rounded-2xl bg-muted/80 overflow-hidden relative mb-4">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            <div className="w-1/2 sm:w-1/3 h-8 sm:h-12 rounded-2xl bg-muted/80 overflow-hidden relative mb-6">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>

            {/* Decorative line */}
            <div className="h-0.5 w-20 sm:w-24 bg-gradient-to-r from-primary/20 via-accent/20 to-transparent rounded-full mb-6 mx-auto relative overflow-hidden">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>

            {/* Description */}
            <div className="w-full max-w-xl flex flex-col gap-2 mb-10 items-center">
              <div className="h-4 w-5/6 rounded-full bg-muted/50 overflow-hidden relative">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
              <div className="h-4 w-4/5 rounded-full bg-muted/50 overflow-hidden relative">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
              <div className="h-4 w-2/3 rounded-full bg-muted/50 overflow-hidden relative">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
            </div>

            {/* Button */}
            <div className="h-14 w-56 rounded-2xl bg-primary/20 overflow-hidden relative shadow-lg">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
          </div>
        </section>

        {/* STAGE 2: SOBERANÍA */}
        <section className="w-full min-h-screen flex items-center justify-center p-4 relative border-b border-border/5">
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12 xl:gap-20 items-center">
              
              {/* Left text column */}
              <div className="flex flex-col">
                {/* Badge */}
                <div className="mb-4 sm:mb-6 h-5 w-32 rounded-full bg-muted/60 overflow-hidden relative">
                  <div className="absolute inset-0 skeleton-shimmer" />
                </div>
                {/* Title */}
                <div className="w-4/5 h-10 sm:h-14 rounded-2xl bg-muted/80 overflow-hidden relative mb-4">
                  <div className="absolute inset-0 skeleton-shimmer" />
                </div>
                <div className="w-3/5 h-8 sm:h-12 rounded-2xl bg-muted/80 overflow-hidden relative mb-6">
                  <div className="absolute inset-0 skeleton-shimmer" />
                </div>
                {/* Line */}
                <div className="h-0.5 w-24 bg-gradient-to-r from-primary/20 via-accent/20 to-transparent rounded-full mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shimmer" />
                </div>
                {/* Desc */}
                <div className="w-full max-w-xl flex flex-col gap-2">
                  <div className="h-4 w-full rounded-full bg-muted/50 overflow-hidden relative">
                    <div className="absolute inset-0 skeleton-shimmer" />
                  </div>
                  <div className="h-4 w-11/12 rounded-full bg-muted/50 overflow-hidden relative">
                    <div className="absolute inset-0 skeleton-shimmer" />
                  </div>
                  <div className="h-4 w-4/5 rounded-full bg-muted/50 overflow-hidden relative">
                    <div className="absolute inset-0 skeleton-shimmer" />
                  </div>
                </div>
              </div>

              {/* Right pillars column */}
              <div className="flex flex-col gap-4 sm:gap-5 mt-8 lg:mt-0">
                {[0, 1].map((pillarIdx) => (
                  <div
                    key={pillarIdx}
                    className="relative rounded-2xl border border-white/[0.08] p-5 sm:p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl"
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted/40 relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 skeleton-shimmer" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                        <div className="h-4 w-1/3 rounded-full bg-muted/70 overflow-hidden relative">
                          <div className="absolute inset-0 skeleton-shimmer" />
                        </div>
                        <div className="h-3 w-11/12 rounded-full bg-muted/50 overflow-hidden relative">
                          <div className="absolute inset-0 skeleton-shimmer" />
                        </div>
                        <div className="h-3 w-4/5 rounded-full bg-muted/50 overflow-hidden relative">
                          <div className="absolute inset-0 skeleton-shimmer" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* STAGE 3: PRODUCTS */}
        <section className="w-full min-h-screen flex items-center justify-center p-4 sm:p-8 relative border-b border-border/5">
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            {/* Badge */}
            <div className="mb-4 sm:mb-6 h-5 w-40 rounded-full bg-muted/60 overflow-hidden relative">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            {/* Title */}
            <div className="w-3/5 sm:w-2/5 h-10 sm:h-14 rounded-2xl bg-muted/80 overflow-hidden relative mb-6">
              <div className="absolute inset-0 skeleton-shimmer" />
            </div>
            {/* Description */}
            <div className="w-full max-w-xl flex flex-col gap-2 mb-10 items-center">
              <div className="h-4 w-11/12 rounded-full bg-muted/50 overflow-hidden relative">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
              <div className="h-4 w-4/5 rounded-full bg-muted/50 overflow-hidden relative">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
            </div>

            {/* Slider Skeleton */}
            <div className="relative w-full flex items-center justify-center px-6 sm:px-12 mt-4">
              <div className="flex overflow-hidden gap-2 sm:gap-3 py-1 sm:py-2 px-1 w-full justify-center">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="relative shrink-0 w-[130px] sm:w-[160px] lg:w-[180px] hidden sm:first:block sm:[&:nth-child(-n+3)]:block lg:[&:nth-child(-n+5)]:block first:block [&:nth-child(2)]:block"
                  >
                    <SmallProductCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STAGE 4: COMMUNITY */}
        <section className="w-full min-h-screen flex items-center justify-center p-4 relative">
          <div className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
            
            {/* Left text column */}
            <div className="flex flex-col">
              {/* Badge */}
              <div className="mb-4 sm:mb-6 h-5 w-36 rounded-full bg-muted/60 overflow-hidden relative">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
              {/* Title */}
              <div className="w-4/5 h-10 sm:h-14 rounded-2xl bg-muted/80 overflow-hidden relative mb-4">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
              <div className="w-2/3 h-8 sm:h-12 rounded-2xl bg-muted/80 overflow-hidden relative mb-6">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
              {/* Line */}
              <div className="h-0.5 w-24 bg-gradient-to-r from-accent/20 via-primary/20 to-transparent rounded-full mb-6 relative overflow-hidden">
                <div className="absolute inset-0 skeleton-shimmer" />
              </div>
              {/* Desc */}
              <div className="w-full max-w-xl flex flex-col gap-2 mb-8">
                <div className="h-4 w-full rounded-full bg-muted/50 overflow-hidden relative">
                  <div className="absolute inset-0 skeleton-shimmer" />
                </div>
                <div className="h-4 w-11/12 rounded-full bg-muted/50 overflow-hidden relative">
                  <div className="absolute inset-0 skeleton-shimmer" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md w-full">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl flex flex-col items-center justify-center text-center"
                  >
                    <div className="h-5 w-10 rounded-full bg-muted/70 overflow-hidden relative mb-2">
                      <div className="absolute inset-0 skeleton-shimmer" />
                    </div>
                    <div className="h-3.5 w-14 rounded-full bg-muted/50 overflow-hidden relative">
                      <div className="absolute inset-0 skeleton-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right stacked cards column */}
            <div className="relative w-full h-[320px] sm:h-[400px] flex items-center justify-center">
              {[0, 1, 2].map((i) => {
                const isTop = i === 0;
                return (
                  <div
                    key={i}
                    className="absolute w-[280px] sm:w-[350px] p-5 sm:p-6 rounded-3xl border border-white/[0.08] bg-card backdrop-blur-xl transition-all duration-300"
                    style={{
                      transform: `translateY(${i * 40}px) scale(${1 - i * 0.08})`,
                      opacity: isTop ? 1 : 0.6 - i * 0.15,
                      zIndex: 10 - i,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-muted/40 overflow-hidden relative shrink-0">
                        <div className="absolute inset-0 skeleton-shimmer" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-3 w-1/3 rounded-full bg-muted/70 overflow-hidden relative">
                          <div className="absolute inset-0 skeleton-shimmer" />
                        </div>
                        <div className="h-2 w-1/4 rounded-full bg-muted/50 overflow-hidden relative">
                          <div className="absolute inset-0 skeleton-shimmer" />
                        </div>
                      </div>
                    </div>
                    <div className="h-4 w-11/12 rounded-full bg-muted/70 overflow-hidden relative mb-3">
                      <div className="absolute inset-0 skeleton-shimmer" />
                    </div>
                    <div className="h-3.5 w-4/5 rounded-full bg-muted/50 overflow-hidden relative mb-6">
                      <div className="absolute inset-0 skeleton-shimmer" />
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                      <div className="h-3.5 w-20 rounded-full bg-muted/50 overflow-hidden relative">
                        <div className="absolute inset-0 skeleton-shimmer" />
                      </div>
                      <div className="h-3.5 w-16 rounded-full bg-muted/50 overflow-hidden relative">
                        <div className="absolute inset-0 skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

      </div>

      <style>{`
        @keyframes skeleton-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            oklch(0.7 0.25 150 / 0.08) 40%,
            oklch(0.8 0.15 150 / 0.14) 50%,
            oklch(0.7 0.25 150 / 0.08) 60%,
            transparent 100%
          );
          animation: skeleton-sweep 1.6s ease-in-out infinite;
        }

      `}</style>
    </div>
  );
}

export default HomeSkeleton;
