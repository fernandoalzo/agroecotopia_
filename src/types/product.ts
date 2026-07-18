export interface ProductRatingInfo {
  average: number;
  count: number;
  total: number;
  distribution: Record<number, number>;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  categories: { id: string; name: string }[];
  unidad: string;
  tag: string;
  emoji: string;
  images: string[];
  stock: number;
  storeId?: string | null;
  store?: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    promotions?: Array<{ discountValue: number; discountType: string; isActive: boolean }>;
  } | null;
  promotions?: Array<{ discountValue: number; discountType: string; isActive: boolean; scope: string }>;
  ratingTotal?: number;
  ratingCount?: number;
  ratingAverage?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRating {
  id: string;
  productId: string;
  userId: string;
  pedidoId: string;
  score: number;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    image?: string | null;
  };
}
