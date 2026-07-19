"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Flame, MessageSquare, Plus, SearchX, Loader2, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

import { Question } from "./forum/forum.types";
import ForumSidebar from "./forum/ForumSidebar";
import ForumTrendingBanner from "./forum/ForumTrendingBanner";
import ForumQuestionCard from "./forum/ForumQuestionCard";
import { ForumQuestionCardSkeleton } from "./forum/ForumQuestionCardSkeleton";
import ForumStatsPanel from "./forum/ForumStatsPanel";
const ForumCreatePostModal = dynamic(() => import("./forum/ForumCreatePostModal"), { ssr: false });

type CommunityQAForumProps = {
  questions: Question[];
  activeCommunityStats: { totalMembers: string; onlineNow: string };
  topContributors: { name: string; role: string; points: string; rank: number }[];
  isStatsLoading?: boolean;
  isContributorsLoading?: boolean;
  isTrendingLoading?: boolean;
  isSearching?: boolean;
  crearNuevaPublicacion: (data: { title: string; body: string; labels: string[] }) => Promise<void> | void;
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
  searchType?: "semantic" | "textual" | null;
  totalCount?: number;
};

export default function CommunityQAForum({
  questions,
  activeCommunityStats,
  topContributors,
  isStatsLoading,
  isContributorsLoading,
  isTrendingLoading,
  isSearching,
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
  setSortBy,
  searchType,
  totalCount
}: CommunityQAForumProps) {
  const { status } = useSession();
  const { t } = useLanguage();
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
            isSearching={isSearching}
            searchType={searchType}
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
              <ForumTrendingBanner tags={trendingTags} isLoading={isTrendingLoading} />

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
                    <Sparkles className={cn("w-4 h-4", sortBy === "newest" ? "text-primary animate-pulse" : "text-muted-foreground")} /> {t.forum.sort.newest}
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
                    <Flame className={cn("w-4 h-4", sortBy === "popular" ? "text-primary animate-pulse" : "text-muted-foreground")} /> {t.forum.sort.popular}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <AnimatePresence mode="popLayout">
                    {isSearching && questions.length > 0 ? (
                      <motion.div
                        key="loading-badge"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                      >
                        <motion.div
                          animate={{ x: [-2, 2, -2], rotate: [-10, 10, -10] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        >
                          <Search className="w-3.5 h-3.5 text-primary drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]" />
                        </motion.div>
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="text-primary"
                        >
                          Actualizando...
                        </motion.span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="results-label"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                      >
                        {totalCount !== undefined 
                          ? t.forum.qaList.resultsWithTotal.replace("{count}", String(questions.length)).replace("{total}", String(totalCount))
                          : t.forum.qaList.results.replace("{count}", String(questions.length))
                        }
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {isSearching && questions.length === 0 ? (
                  <motion.div
                    key="skeleton"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ForumQuestionCardSkeleton key={i} />
                    ))}
                  </motion.div>
                ) : questions.length === 0 ? (
                  <motion.div
                    key="empty"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
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
                    <h3 className="text-lg font-semibold text-foreground/70 mb-1.5">{t.forum.qaList.noResults}</h3>
                    <p className="text-sm text-muted-foreground/60 max-w-xs leading-relaxed">
                      {t.forum.qaList.noResultsDesc}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {questions.map((q) => (
                      <ForumQuestionCard 
                        key={q.id} 
                        question={q} 
                      />
                    ))}
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
                              {t.forum.loading}
                            </>
                          ) : (
                            t.forum.qaList.loadMore
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Context & Stats */}
          <ForumStatsPanel 
            activeCommunityStats={activeCommunityStats} 
            topContributors={topContributors}
            isStatsLoading={isStatsLoading}
            isContributorsLoading={isContributorsLoading}
          />

        </div>
      </div>

      {/* Floating Action Button for mobile/global */}
      {status === "authenticated" && (
        <div className="fixed bottom-5 right-5 z-[100] md:bottom-8 md:right-8">
          <button
            aria-label={t.forum.qaList.createPostAria}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 md:px-6 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105"
          >
            <Plus className="h-6 w-6 md:h-5 md:w-5" />
            <span className="font-bold hidden md:block">{t.forum.qaList.newPost}</span>
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
