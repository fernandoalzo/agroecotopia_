"use client";

import { Users, TrendingUp } from "lucide-react";

export default function ForumStatsPanel({
  activeCommunityStats,
  topContributors
}: {
  activeCommunityStats: any;
  topContributors: any[];
}) {
  return (
    <div className="hidden xl:block xl:col-span-3 sticky top-28 space-y-10 px-2">
      
      {/* Community Stats */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center gap-2">
          <Users className="w-3 h-3 text-primary" />
          Comunidad Activa
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block font-black text-3xl text-foreground tracking-tight">{activeCommunityStats.totalMembers}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1 block">Miembros</span>
          </div>
          <div>
            <span className="block font-black text-3xl text-accent flex items-center gap-2 tracking-tight">
              {activeCommunityStats.onlineNow}
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1 block">En línea</span>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-accent" />
          Top Contribuidores
        </h3>

        <div className="space-y-5">
          {topContributors.map((user) => (
            <div key={user.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground relative">
                <span className="text-xs font-bold text-foreground">{user.name.charAt(0)}</span>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-black text-primary">{user.rank}</span>
                </div>
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm text-foreground block">{user.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.role}</span>
              </div>
              <span className="text-xs font-black text-primary">{user.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules / Guidelines */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4">Normas del Foro</h3>
        <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <li className="flex gap-2 items-start"><span className="text-primary mt-0.5">•</span> Sé respetuoso con todos los miembros y fomenta el diálogo.</li>
          <li className="flex gap-2 items-start"><span className="text-primary mt-0.5">•</span> Verifica si tu pregunta ya fue respondida en discusiones previas.</li>
          <li className="flex gap-2 items-start"><span className="text-primary mt-0.5">•</span> Prioriza prácticas agroecológicas y soluciones orgánicas.</li>
        </ul>
      </div>

    </div>
  );
}
