"use client";

import { Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { config } from "@/config/config";
import { useLanguage } from "@/context/LanguageContext";

export default function ForumStatsPanel({
  activeCommunityStats,
  topContributors,
  isStatsLoading,
  isContributorsLoading,
}: {
  activeCommunityStats: { totalMembers: string; onlineNow: string };
  topContributors: { name: string; role: string; points: string; rank: number }[];
  isStatsLoading?: boolean;
  isContributorsLoading?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="hidden xl:block xl:col-span-3 sticky top-28 space-y-10 px-2">

      {/* Community Stats */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center gap-2">
          <Users className="w-3 h-3 text-primary" />
          {t.forum.sidebar.activeCommunity}
        </h3>

        <div className="flex">
          {isStatsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          ) : (
            <div>
              <span className="block font-black text-3xl text-foreground tracking-tight">{activeCommunityStats.totalMembers}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1 block">{t.forum.sidebar.members}</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Contributors */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-accent" />
          {t.forum.sidebar.topContributors}
        </h3>

        <div className="space-y-5">
          {isContributorsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28 rounded-md" />
                    <Skeleton className="h-2.5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3.5 w-10 rounded-md" />
                </div>
              ))}
            </>
          ) : (
            topContributors.map((user) => (
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
            ))
          )}
        </div>
      </div>

      {/* Rules / Guidelines */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4">{t.forum.sidebar.forumRules}</h3>
        <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          {config.forum.rules.map((rule, idx) => (
            <li key={idx} className="flex gap-2 items-start"><span className="text-primary mt-0.5">•</span> {rule}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}
