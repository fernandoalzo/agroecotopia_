export interface Product {
  id?: string;
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
  store?: { id: string; name: string; slug: string; logo?: string | null } | null;
  createdAt?: Date;
  updatedAt?: Date;
}
