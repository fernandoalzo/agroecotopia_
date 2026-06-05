"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Flame, MessageSquare, Plus, SearchX } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

import { Question } from "./forum/forum.types";
import ForumSidebar from "./forum/ForumSidebar";
import ForumTrendingBanner from "./forum/ForumTrendingBanner";
import ForumQuestionCard from "./forum/ForumQuestionCard";
import ForumStatsPanel from "./forum/ForumStatsPanel";
import ForumCreatePostModal from "./forum/ForumCreatePostModal";

type CommunityQAForumProps = {
  questions: Question[];
  activeCommunityStats: any;
  topContributors: any[];
  crearNuevaPublicacion: (data: any) => Promise<void> | void;
  handleRate: (itemId: string, rating: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilters: Record<string, string[]>;
  setActiveFilter: (category: string, value: string) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  trendingTags: string[];
  sortBy: "newest" | "popular";
  setSortBy: (val: "newest" | "popular") => void;
};

export default function CommunityQAForum({
  questions,
  activeCommunityStats,
  topContributors,
  crearNuevaPublicacion,
  handleRate,
  searchQuery,
  setSearchQuery,
  activeFilters,
  setActiveFilter,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  trendingTags,
  sortBy,
  setSortBy
}: CommunityQAForumProps) {
  const { status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pt-16 md:pt-20">
      {/* Background Aurora / Glassmorphism */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: Filters & Navigation */}
          <ForumSidebar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilters={activeFilters}
            setActiveFilter={setActiveFilter}
          />

          {/* MIDDLE COLUMN: Feed */}
          <div className="col-span-1 lg:col-span-6 space-y-6">
            <motion.div
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <ForumTrendingBanner tags={trendingTags} />

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSortBy("newest")}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-all duration-300",
                      sortBy === "newest" 
                        ? "text-primary font-bold scale-105" 
                        : "text-muted-foreground hover:text-foreground font-medium"
                    )}
                  >
                    <Sparkles className={cn("w-4 h-4", sortBy === "newest" ? "text-primary animate-pulse" : "text-muted-foreground")} /> Nuevos
                  </button>
                  <button 
                    onClick={() => setSortBy("popular")}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-all duration-300",
                      sortBy === "popular" 
                        ? "text-primary font-bold scale-105" 
                        : "text-muted-foreground hover:text-foreground font-medium"
                    )}
                  >
                    <Flame className={cn("w-4 h-4", sortBy === "popular" ? "text-primary animate-pulse" : "text-muted-foreground")} /> Populares
                  </button>
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {questions.length} resultados
                </span>
              </div>

              <div className="space-y-4">
                {questions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center py-24 px-6 text-center"
                  >
                    <motion.div 
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm border border-border/20 flex items-center justify-center"
                    >
                      <SearchX className="w-9 h-9 text-muted-foreground/50" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-foreground/70 mb-1.5">No se encontraron resultados</h3>
                    <p className="text-sm text-muted-foreground/60 max-w-xs leading-relaxed">
                      Intenta probar con otros términos o ajustar los filtros.
                    </p>
                  </motion.div>
                ) : (
                  questions.map((q) => (
                    <ForumQuestionCard 
                      key={q.id} 
                      question={q} 
                    />
                  ))
                )}
                
                {hasNextPage && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => fetchNextPage?.()}
                      disabled={isFetchingNextPage}
                      className="px-6 py-2.5 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        "Cargar más publicaciones"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Context & Stats */}
          <ForumStatsPanel 
            activeCommunityStats={activeCommunityStats} 
            topContributors={topContributors} 
          />

        </div>
      </div>

      {/* Floating Action Button for mobile/global */}
      {status === "authenticated" && (
        <div className="fixed bottom-5 right-5 z-[100] md:bottom-8 md:right-8">
          <button
            aria-label="Crear nueva publicación"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 md:px-6 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105"
          >
            <Plus className="h-6 w-6 md:h-5 md:w-5" />
            <span className="font-bold hidden md:block">Nueva Publicación</span>
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      <ForumCreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={crearNuevaPublicacion} 
      />

    </div>
  );
}
