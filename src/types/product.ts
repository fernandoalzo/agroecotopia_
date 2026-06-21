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
  createdAt: Date;
  updatedAt: Date;
}
