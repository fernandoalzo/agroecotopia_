export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string | null;
  banner?: string | null;
  ownerId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  owner?: { id: string; name?: string | null; image?: string | null };
  _count?: { products: number };
  config?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreRequest {
  id: string;
  userId: string;
  name: string;
  description: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string | null;
  storeId?: string | null;
  user?: { id: string; name?: string | null; email: string; image?: string | null };
  store?: Store | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreCreateInput {
  name: string;
  description: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface Promotion {
  id: string;
  isActive: boolean;
  name?: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  scope: "ENTIRE_STORE" | "SPECIFIC_PRODUCTS" | "SINGLE_PRODUCT";
  storeId: string;
  expiresAt: string;
  productIds?: string[];
  createdAt: string;
  updatedAt: string;
}
