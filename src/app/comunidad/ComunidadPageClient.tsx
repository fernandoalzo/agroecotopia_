"use client";

import { useState, useEffect } from "react";
import CommunityQAForum from "@/frontend/components/comunidad/CommunityQAForum";
import { Question, mockQuestions } from "@/frontend/components/comunidad/forum/forum.types";
import { config } from "@/config/config";

export default function ComunidadPageClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeCommunityStats, setActiveCommunityStats] = useState({ totalMembers: "0", onlineNow: "0" });
  const [topContributors, setTopContributors] = useState<any[]>([]);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleSetFilter = (category: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [category]: value }));
  };

  const obtenerPublicaciones = () => {
    console.log("obtenerPublicaciones(): Obteniendo publicaciones mockeadas de la DB...");
    setQuestions(mockQuestions);
  };

  const obtenerComunidadActiva = () => {
    console.log("obtenerComunidadActiva(): Obteniendo estadísticas de la comunidad...");
    setActiveCommunityStats({
      totalMembers: "12.4k",
      onlineNow: "342"
    });
  };

  const obtenerTopContributors = () => {
    console.log("obtenerTopContributors(): Obteniendo top contributors...");
    setTopContributors([
      { name: "Ing. Roberto M.", role: "Experto en Suelos", points: "4.2k", rank: 1 },
      { name: "Finca El Paraíso", role: "Agricultura Regenerativa", points: "3.8k", rank: 2 },
      { name: "Dra. Sofía L.", role: "Fitopatóloga", points: "3.1k", rank: 3 }
    ]);
  };

  useEffect(() => {
    obtenerPublicaciones();
    obtenerComunidadActiva();
    obtenerTopContributors();
  }, []);

  const filtrarPosts = () => {
    console.log("filtrarPosts(): Filtrando publicaciones en base a:", { activeFilters, searchQuery });
    // Aquí iría la llamada real para filtrar desde el servidor o DB
  };

  useEffect(() => {
    filtrarPosts();
  }, [activeFilters, searchQuery]);

  const filteredQuestions = questions.filter((q) => {
    const matchesFilters = Object.entries(activeFilters).every(([cat, val]) => {
      if (val === "Todos" || !val) return true;
      // Compatibilidad con los mock questions legacy
      return [q.cropType, q.soilType, q.plantType].includes(val);
    });

    const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        q.plantType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilters && matchSearch;
  });

  const crearNuevaPublicacion = (postData: { title: string; body: string; labels: string[] }) => {
    console.log("crearNuevaPublicacion(): Guardando nueva publicación...", postData);
    // Derive mock values from labels for backward compatibility with current UI
    const allCategories = config.forum.labels as Record<string, readonly string[]>;
    const cropType = postData.labels.find(l => allCategories.cultivos?.includes(l)) || "Todos";
    const soilType = postData.labels.find(l => allCategories.suelos?.includes(l)) || "Todos";
    const plantType = postData.labels[0] || "General";

    const newQuestion: Question = {
      id: `q${Date.now()}`,
      title: postData.title,
      body: postData.body,
      author: "Tú",
      cropType,
      plantType,
      soilType,
      rating: 0,
      ratingCount: 0,
      timestamp: "Justo ahora",
      answers: [],
    };
    setQuestions([newQuestion, ...questions]);
  };

  const handleRate = (itemId: string, rating: number) => {
    console.log(`Calificando post ${itemId} con ${rating} estrellas`);
    setQuestions(questions.map(q => {
      if (q.id === itemId) {
        const newCount = q.ratingCount + 1;
        const newRating = ((q.rating * q.ratingCount) + rating) / newCount;
        return { ...q, rating: Math.round(newRating * 10) / 10, ratingCount: newCount };
      }
      return q;
    }));
  };

  return (
    <main className="min-h-screen bg-background">
      <CommunityQAForum 
        questions={filteredQuestions}
        activeCommunityStats={activeCommunityStats}
        topContributors={topContributors}
        crearNuevaPublicacion={crearNuevaPublicacion}
        handleRate={handleRate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilters={activeFilters}
        setActiveFilter={handleSetFilter}
      />
    </main>
  );
}
