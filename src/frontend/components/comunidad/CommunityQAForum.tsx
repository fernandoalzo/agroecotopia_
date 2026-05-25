"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Flame, MessageSquare, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

import { Question, mockQuestions } from "./forum/forum.types";
import ForumSidebar from "./forum/ForumSidebar";
import ForumTrendingBanner from "./forum/ForumTrendingBanner";
import ForumQuestionCard from "./forum/ForumQuestionCard";
import ForumStatsPanel from "./forum/ForumStatsPanel";
import ForumCreatePostModal from "./forum/ForumCreatePostModal";

type CommunityQAForumProps = {
  questions: Question[];
  activeCommunityStats: any;
  topContributors: any[];
  crearNuevaPublicacion: (data: any) => void;
  handleRate: (itemId: string, rating: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCrop: string;
  setFilterCrop: (f: string) => void;
  filterSoil: string;
  setFilterSoil: (f: string) => void;
};

export default function CommunityQAForum({
  questions,
  activeCommunityStats,
  topContributors,
  crearNuevaPublicacion,
  handleRate,
  searchQuery,
  setSearchQuery,
  filterCrop,
  setFilterCrop,
  filterSoil,
  setFilterSoil
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
            filterCrop={filterCrop}
            setFilterCrop={setFilterCrop}
            filterSoil={filterSoil}
            setFilterSoil={setFilterSoil}
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
              <ForumTrendingBanner />

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <button className="text-primary font-bold flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4" /> Nuevos
                  </button>
                  <button className="text-muted-foreground hover:text-foreground font-medium flex items-center gap-2 text-sm transition-colors">
                    <Flame className="w-4 h-4" /> Populares
                  </button>
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {questions.length} resultados
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((q) => (
                  <ForumQuestionCard 
                    key={q.id} 
                    question={q} 
                    onRate={handleRate} 
                  />
                ))}
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
