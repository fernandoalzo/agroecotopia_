"use server";

import { storeService } from "./index";
import { withAuth, withAdmin, withSeller } from "@/lib/auth-guards";
import { StoreCreateInput } from "@/types/store";
import { revalidatePath } from "next/cache";
import logger from "@/utils/logger";
import { authService } from "../auth";

const log = logger.child("src/backend/modules/store/store.actions.ts");

type StoreListItem = { id: string; name: string };

// --- User Actions ---

export const submitStoreRequestAction = async (data: StoreCreateInput) => {
  return withAuth(async () => {
    log.info("Action: submitStoreRequestAction");
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("No estás autenticado.");
    
    const request = await storeService.submitStoreRequest(userId, data);
    revalidatePath("/mi-tienda");
    return { success: true, data: request };
  });
};

export const getMyRequestsAction = async () => {
  return withAuth(async () => {
    log.info("Action: getMyRequestsAction");
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("No estás autenticado.");
    
    return await storeService.getMyRequests(userId);
  });
};

export const getMyStoresAction = async () => {
  return withAuth(async () => {
    log.info("Action: getMyStoresAction");
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("No estás autenticado.");
    
    return await storeService.getMyStores(userId);
  });
};

// --- Seller Actions ---

export const updateMyStoreAction = async (storeId: string, data: Partial<StoreCreateInput>) => {
  return withSeller(async () => {
    log.info("Action: updateMyStoreAction", { storeId });
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("No estás autenticado.");
    
    const store = await storeService.updateMyStore(userId, storeId, data);
    revalidatePath(`/mi-tienda/${storeId}`);
    revalidatePath(`/tienda/${store.slug}`);
    return { success: true, data: store };
  });
};

// --- Admin Actions ---

export const getPendingRequestsAction = async (page: number = 1, search?: string) => {
  return withAdmin(async () => {
    log.info("Action: getPendingRequestsAction", { page, search });
    const result = await storeService.getPendingRequests(page, 10, search);
    return {
      requests: result.requests,
      totalPages: Math.ceil(result.total / 10),
      total: result.total,
      page
    };
  });
};

export const getAllRequestsAction = async (page: number = 1, search?: string) => {
  return withAdmin(async () => {
    log.info("Action: getAllRequestsAction", { page, search });
    const result = await storeService.getAllRequests(page, 10, search);
    return {
      requests: result.requests,
      totalPages: Math.ceil(result.total / 10),
      total: result.total,
      page
    };
  });
};

export const getAllStoresAction = async (page: number = 1, status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED') => {
  return withAdmin(async () => {
    log.info("Action: getAllStoresAction", { page, status });
    return await storeService.getAllStores(page, 10, status);
  });
};

export const approveRequestAction = async (requestId: string, adminNote?: string) => {
  return withAdmin(async () => {
    log.info("Action: approveRequestAction", { requestId });
    const store = await storeService.approveRequest(requestId, adminNote);
    revalidatePath("/admin/dashboard");
    revalidatePath("/products");
    return { success: true, data: store };
  });
};

export const rejectRequestAction = async (requestId: string, adminNote: string) => {
  return withAdmin(async () => {
    log.info("Action: rejectRequestAction", { requestId });
    const request = await storeService.rejectRequest(requestId, adminNote);
    revalidatePath("/admin/dashboard");
    return { success: true, data: request };
  });
};

export const suspendStoreAction = async (storeId: string) => {
  return withAdmin(async () => {
    log.info("Action: suspendStoreAction", { storeId });
    const store = await storeService.changeStoreStatus(storeId, 'SUSPENDED');
    revalidatePath("/admin/dashboard");
    revalidatePath(`/tienda/${store.slug}`);
    revalidatePath("/products");
    return { success: true, data: store };
  });
};

export const reactivateStoreAction = async (storeId: string) => {
  return withAdmin(async () => {
    log.info("Action: reactivateStoreAction", { storeId });
    const store = await storeService.changeStoreStatus(storeId, 'ACTIVE');
    revalidatePath("/admin/dashboard");
    revalidatePath(`/tienda/${store.slug}`);
    revalidatePath("/products");
    return { success: true, data: store };
  });
};

// --- Public Actions ---

export const getStoreBySlugAction = async (slug: string) => {
  log.info("Action: getStoreBySlugAction", { slug });
  return await storeService.getStoreBySlug(slug);
};

export const getActiveStoresCatalogAction = async (page: number = 1) => {
  log.info("Action: getActiveStoresCatalogAction", { page });
  return await storeService.getActiveStoresForCatalog(page);
};

export const getAllActiveStoresListAction = async () => {
  return withAuth(async () => {
    log.info("Action: getAllActiveStoresListAction");
    // Get up to 1000 active stores for select dropdowns
    const result = await storeService.getAllStores(1, 1000, 'ACTIVE');
    return result.stores.map((s): StoreListItem => ({ id: s.id, name: s.name }));
  });
};
