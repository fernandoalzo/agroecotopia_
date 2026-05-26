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
  authorId?: string;
  authorImage?: string | null;
  labels: string[];
  ratingTotal: number;
  ratingCount: number;
  createdAt: Date;
  answers: Answer[];
  _count?: { answers: number };
  isTrending?: boolean;
};
