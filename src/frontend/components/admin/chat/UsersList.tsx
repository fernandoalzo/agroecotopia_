import React from "react";
import { Search, User, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { User as UserType } from "./types";
import { Loading } from "@/components/ui/Loading";

interface UsersListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoadingUsers: boolean;
  usersList: UserType[];
  handleSelectUserChat: (userId: string) => void;
  usersPage: number;
  totalPages: number;
  setUsersPage: (page: number | ((p: number) => number)) => void;
}

export function UsersList({
  searchQuery,
  setSearchQuery,
  isLoadingUsers,
  usersList,
  handleSelectUserChat,
  usersPage,
  totalPages,
  setUsersPage,
}: UsersListProps) {
  return (
    <>
      <div className="p-3 border-b border-border/40 bg-card/10">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full h-10 pl-9 pr-4 border border-border/60 hover:border-border/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none bg-secondary/15 transition-all text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 overscroll-y-contain">
        {isLoadingUsers ? (
          <div className="h-40 flex items-center justify-center">
            <Loading text="" subtext="" className="py-0 scale-75" />
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No se encontraron usuarios.
          </div>
        ) : (
          usersList.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUserChat(user.id)}
              className="w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 bg-transparent border border-transparent hover:bg-secondary/40 hover:border-border/40 cursor-pointer group"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  {user.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {user.name || "Usuario sin nombre"}
                </h4>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="text-muted-foreground group-hover:text-primary p-1.5 transition-all">
                <UserPlus className="w-4 h-4" />
              </div>
            </button>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-border/40 flex items-center justify-between bg-card/60">
          <button
            onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
            disabled={usersPage === 1 || isLoadingUsers}
            className="p-2 border border-border/60 rounded-xl hover:bg-secondary/60 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Página {usersPage} de {totalPages}
          </span>
          <button
            onClick={() => setUsersPage(Math.min(totalPages, usersPage + 1))}
            disabled={usersPage === totalPages || isLoadingUsers}
            className="p-2 border border-border/60 rounded-xl hover:bg-secondary/60 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
