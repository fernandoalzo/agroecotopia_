export interface Product {
  id?: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  categoria: string;
  unidad: string;
  tag: string;
  emoji: string;
  images: string[];
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}
