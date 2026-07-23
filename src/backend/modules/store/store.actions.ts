"use server";

import { storeService } from "./index";
import { withAuth, withAdmin, withSeller } from "@/lib/auth-guards";
import { StoreCreateInput } from "@/types/store";
import { revalidatePath } from "next/cache";
import logger from "@/utils/logger";
import eventBus from "@/utils/eventBus";
import { notificationsService } from "../notifications";
import { userRepository } from "../user";
import { deepSerialize } from "@/lib/serialize";

const log = logger.child("src/backend/modules/store/store.actions.ts");

type StoreListItem = { id: string; name: string };

// --- User Actions ---

export const submitStoreRequestAction = async (data: StoreCreateInput) => {
  return withAuth(async (session) => {
    log.info("Action: submitStoreRequestAction");
    const userId = session.user.id;
    
    const request = await storeService.submitStoreRequest(userId, data);
    revalidatePath("/mi-tienda");
    eventBus.emit("store_request_updated");

    // Notify all admins about the new store request
    try {
      const admins = await userRepository.findAdmins();
      for (const admin of admins) {
        if (admin.id === userId) continue; // Don't self-notify
        await notificationsService.dispatchNotification({
          eventType: "store_request_created",
          actorId: userId,
          entityType: "StoreRequest",
          entityId: request.id,
          payload: { storeName: data.name },
          notification: {
            type: "store_request",
            title: "Nueva solicitud de tienda",
            message: `Se ha recibido una nueva solicitud de tienda: "${data.name}". Revísala en el panel de administración.`,
            audienceType: "INDIVIDUAL",
            audienceRef: admin.id,
            metadata: { requestId: request.id, storeName: data.name },
          },
        });
      }
    } catch (notifError) {
      // Don't fail the store request if notification dispatch fails
      log.error("Error al notificar admins sobre nueva solicitud de tienda:", notifError);
    }

    return deepSerialize({ success: true, data: request });
  });
};

export const getMyRequestsAction = async () => {
  return withAuth(async (session) => {
    log.info("Action: getMyRequestsAction");
    const userId = session.user.id;
    
    return deepSerialize(await storeService.getMyRequests(userId));
  });
};

export const getMyStoresAction = async () => {
  return withAuth(async (session) => {
    log.info("Action: getMyStoresAction");
    const userId = session.user.id;
    
    return deepSerialize(await storeService.getMyStores(userId));
  });
};

// --- Seller Actions ---

export const updateMyStoreAction = async (storeId: string, data: Partial<StoreCreateInput>) => {
  return withSeller(async (session) => {
    log.info("Action: updateMyStoreAction", { storeId });
    const userId = session.user.id;
    
    const store = await storeService.updateMyStore(userId, storeId, data);
    revalidatePath(`/mi-tienda/${storeId}`);
    revalidatePath(`/tienda/${store.slug}`);
    return deepSerialize({ success: true, data: store });
  });
};

export const updateStoreConfigAction = async (storeId: string, data: any) => {
  return withSeller(async (session) => {
    log.info("Action: updateStoreConfigAction", { storeId });
    const userId = session.user.id;
    
    const config = await storeService.updateStoreConfig(userId, storeId, data);
    revalidatePath(`/mi-tienda/${storeId}`);
    // Also revalidate checkout as config affects checkout
    revalidatePath(`/checkout`);
    return deepSerialize({ success: true, data: config });
  });
};

// --- Admin Actions ---

export const getPendingRequestsAction = async (page: number = 1, search?: string) => {
  return withAdmin(async () => {
    log.info("Action: getPendingRequestsAction", { page, search });
    const result = await storeService.getPendingRequests(page, 10, search);
    return deepSerialize({
      requests: result.requests,
      totalPages: Math.ceil(result.total / 10),
      total: result.total,
      page
    });
  });
};

export const getRequestByIdAction = async (requestId: string) => {
  return withAdmin(async () => {
    log.info("Action: getRequestByIdAction", { requestId });
    return deepSerialize(await storeService.getRequestById(requestId));
  });
};

export const getAllRequestsAction = async (page: number = 1, search?: string) => {
  return withAdmin(async () => {
    log.info("Action: getAllRequestsAction", { page, search });
    const result = await storeService.getAllRequests(page, 10, search);
    return deepSerialize({
      requests: result.requests,
      totalPages: Math.ceil(result.total / 10),
      total: result.total,
      page
    });
  });
};

export const getAllStoresAction = async (page: number = 1, status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED') => {
  return withAdmin(async () => {
    log.info("Action: getAllStoresAction", { page, status });
    return deepSerialize(await storeService.getAllStores(page, 10, status));
  });
};

export const approveRequestAction = async (requestId: string, adminNote?: string) => {
  return withAdmin(async (session) => {
    log.info("Action: approveRequestAction", { requestId });
    const adminId = session.user.id;

    // Fetch request before approval to get requester info
    const requestData = await storeService.getRequestById(requestId);

    const store = await storeService.approveRequest(requestId, adminNote);
    revalidatePath("/admin/dashboard");
    revalidatePath("/products");
    eventBus.emit("store_request_updated");

    // Notify the requester that their store was approved
    try {
      if (adminId && requestData.userId) {
        await notificationsService.dispatchNotification({
          eventType: "store_request_approved",
          actorId: adminId,
          entityType: "StoreRequest",
          entityId: requestId,
          payload: { storeName: requestData.name },
          notification: {
            type: "store_request_approved",
            title: "¡Tu tienda ha sido aprobada! 🎉",
            message: `Tu solicitud para "${requestData.name}" ha sido aprobada. Ya puedes empezar a gestionar tu tienda.`,
            audienceType: "INDIVIDUAL",
            audienceRef: requestData.userId,
            metadata: { requestId, storeName: requestData.name },
          },
        });
      }
    } catch (notifError) {
      log.error("Error al notificar usuario sobre aprobación de tienda:", notifError);
    }

    return deepSerialize({ success: true, data: store });
  });
};

export const rejectRequestAction = async (requestId: string, adminNote: string) => {
  return withAdmin(async (session) => {
    log.info("Action: rejectRequestAction", { requestId });
    const adminId = session.user.id;

    // Fetch request before rejection to get requester info
    const requestData = await storeService.getRequestById(requestId);

    const request = await storeService.rejectRequest(requestId, adminNote);
    revalidatePath("/admin/dashboard");
    eventBus.emit("store_request_updated");

    // Notify the requester that their store was rejected
    try {
      if (adminId && requestData.userId) {
        await notificationsService.dispatchNotification({
          eventType: "store_request_rejected",
          actorId: adminId,
          entityType: "StoreRequest",
          entityId: requestId,
          payload: { storeName: requestData.name, reason: adminNote },
          notification: {
            type: "store_request_rejected",
            title: "Solicitud de tienda no aprobada",
            message: `Tu solicitud para "${requestData.name}" no fue aprobada. Motivo: ${adminNote}`,
            audienceType: "INDIVIDUAL",
            audienceRef: requestData.userId,
            metadata: { requestId, storeName: requestData.name },
          },
        });
      }
    } catch (notifError) {
      log.error("Error al notificar usuario sobre rechazo de tienda:", notifError);
    }

    return deepSerialize({ success: true, data: request });
  });
};

export const suspendStoreAction = async (storeId: string) => {
  return withAdmin(async () => {
    log.info("Action: suspendStoreAction", { storeId });
    const store = await storeService.changeStoreStatus(storeId, 'SUSPENDED');
    revalidatePath("/admin/dashboard");
    revalidatePath(`/tienda/${store.slug}`);
    revalidatePath("/products");
    return deepSerialize({ success: true, data: store });
  });
};

export const reactivateStoreAction = async (storeId: string) => {
  return withAdmin(async () => {
    log.info("Action: reactivateStoreAction", { storeId });
    const store = await storeService.changeStoreStatus(storeId, 'ACTIVE');
    revalidatePath("/admin/dashboard");
    revalidatePath(`/tienda/${store.slug}`);
    revalidatePath("/products");
    return deepSerialize({ success: true, data: store });
  });
};

// --- Public Actions ---

export const getPublicStoreBySlugAction = async (slug: string) => {
  log.info("Action: getPublicStoreBySlugAction", { slug });
  return deepSerialize(await storeService.getPublicStoreBySlug(slug));
};

export const getStoreBySlugAction = async (slug: string) => {
  log.info("Action: getStoreBySlugAction", { slug });
  return deepSerialize(await storeService.getStoreBySlug(slug));
};

export const getStoreConfigsAction = async (storeIds: string[]) => {
  log.info("Action: getStoreConfigsAction", { storeIds });
  const stores = await Promise.all(storeIds.map(id => storeService.getStoreById(id)));
  return deepSerialize(stores.map(s => ({ storeId: s.id, config: s.config })));
};

export const getActiveStoresCatalogAction = async (page: number = 1) => {
  log.info("Action: getActiveStoresCatalogAction", { page });
  return deepSerialize(await storeService.getActiveStoresForCatalog(page));
};

export const getAllActiveStoresListAction = async () => {
  return withAuth(async (_session) => {
    log.info("Action: getAllActiveStoresListAction");
    // Get up to 1000 active stores for select dropdowns
    const result = await storeService.getAllStores(1, 1000, 'ACTIVE');
    return result.stores.map((s): StoreListItem => ({ id: s.id, name: s.name }));
  });
};

export const getCryptocurrenciesAction = async () => {
  log.info("Action: getCryptocurrenciesAction");
  return await storeService.getActiveCryptocurrencies();
};
