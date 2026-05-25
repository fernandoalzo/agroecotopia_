export type Answer = {
  id: string;
  author: string;
  authorId: string;
  authorImage?: string | null;
  authorRole: string;
  content: string;
  ratingTotal: number;
  ratingCount: number;
  isAccepted: boolean;
  createdAt: Date;
};

export type Question = {
  id: string;
  title: string;
  body: string;
  author: string;
  authorImage?: string | null;
  labels: string[];
  ratingTotal: number;
  ratingCount: number;
  createdAt: Date;
  answers: Answer[];
  _count?: { answers: number };
  isTrending?: boolean;
};

export const cropTypes = ["Todos", "Hortalizas", "Frutales", "Cereales", "Cultivos Perennes"];
export const soilTypes = ["Todos", "Arcilloso", "Arenoso", "Franco", "Limoso"];
export const trendingTags = ["#RoyaCafé", "#Sintropía", "#Compostaje", "#MercadosLocales", "#AbonoVerde"];
