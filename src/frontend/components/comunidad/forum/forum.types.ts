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
  ratingDistribution?: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type PostAuthor = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
};

export type RawAnswer = {
  id: string;
  content: string;
  isAccepted: boolean;
  ratingTotal: number;
  ratingCount: number;
  authorId: string;
  author: PostAuthor;
  createdAt: Date;
};

export type RawPost = {
  id: string;
  title: string;
  body: string;
  labels: string[];
  ratingTotal: number;
  ratingCount: number;
  isTrending: boolean;
  authorId: string;
  author: PostAuthor;
  _count: { answers: number };
  answers?: RawAnswer[];
  createdAt: Date;
};

export type CommunityStats = {
  totalMembers: number;
  onlineNow: number;
};

export type TopContributor = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  points: number;
};
