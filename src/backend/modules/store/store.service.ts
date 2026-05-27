import { StoreRepository } from "./store.repository";
import { authService } from "@/backend/modules/auth";
import prisma from "@/backend/db/prisma";
import logger from "@/utils/logger";
import { StoreCreateInput } from "@/types/store";

const log = logger.child("src/backend/modules/store/store.service.ts");

// Helper to generate a URL-friendly slug
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export class StoreService {
  constructor(private storeRepository: StoreRepository) {}

  // --- User / Seller Flow ---

  async submitStoreRequest(userId: string, data: StoreCreateInput) {
    log.info("Procesando solicitud de tienda", { userId, name: data.name });
    
    // Check if user already has pending requests to prevent spam
    const existingRequests = await this.storeRepository.findRequestsByUserId(userId);
    const hasPending = existingRequests.some(r => r.status === 'PENDING');
    if (hasPending) {
      throw new Error("Ya tienes una solicitud de tienda en revisión.");
    }

    return await this.storeRepository.createRequest({
      name: data.name,
      description: data.description,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      status: 'PENDING',
      user: { connect: { id: userId } }
    });
  }

  async getMyRequests(userId: string) {
    return await this.storeRepository.findRequestsByUserId(userId);
  }

  async getMyStores(userId: string) {
    return await this.storeRepository.findByOwnerId(userId);
  }

  async getStoreById(storeId: string) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new Error("Tienda no encontrada.");
    return store;
  }

  async updateMyStore(userId: string, storeId: string, data: Partial<StoreCreateInput>) {
    const store = await this.getStoreById(storeId);
    if (store.ownerId !== userId) {
      throw new Error("No tienes permiso para editar esta tienda.");
    }
    return await this.storeRepository.updateStore(storeId, data);
  }

  // --- Admin Flow ---

  async getPendingRequests(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return await this.storeRepository.findPendingRequests(skip, limit);
  }

  async getAllRequests(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return await this.storeRepository.findAllRequestsPaginated(skip, limit);
  }

  async getAllStores(page: number = 1, limit: number = 10, status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED') {
    const skip = (page - 1) * limit;
    return await this.storeRepository.findAllPaginated({ skip, take: limit, status });
  }

  async approveRequest(requestId: string, adminNote?: string) {
    log.info("Aprobando solicitud de tienda", { requestId });
    
    const request = await this.storeRepository.findRequestById(requestId);
    if (!request) throw new Error("Solicitud no encontrada.");
    if (request.status !== 'PENDING') throw new Error(`La solicitud ya fue procesada (${request.status}).`);

    // Ensure unique slug
    let baseSlug = generateSlug(request.name);
    let slug = baseSlug;
    let counter = 1;
    while (await this.storeRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Execute in a transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // 1. Create the store
      const store = await tx.store.create({
        data: {
          name: request.name,
          slug,
          description: request.description,
          phone: request.phone,
          email: request.email,
          address: request.address,
          city: request.city,
          status: 'ACTIVE',
          owner: { connect: { id: request.userId } }
        }
      });

      // 2. Update request status and link to created store
      await tx.storeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          adminNote,
          storeId: store.id
        }
      });

      // 3. Promote user to seller if they are not already seller or admin
      const userRole = request.user ? (request.user as any).role : null;
      if (userRole && userRole !== 'seller' && userRole !== 'admin') {
        log.info("Promoviendo usuario a seller", { userId: request.userId, previousRole: userRole });
        await tx.user.update({
          where: { id: request.userId },
          data: { role: 'seller' }
        });
      }

      return store;
    });
  }

  async rejectRequest(requestId: string, adminNote: string) {
    log.info("Rechazando solicitud de tienda", { requestId });
    if (!adminNote?.trim()) {
      throw new Error("Se requiere una nota explicativa para rechazar la solicitud.");
    }
    
    const request = await this.storeRepository.findRequestById(requestId);
    if (!request) throw new Error("Solicitud no encontrada.");
    if (request.status !== 'PENDING') throw new Error(`La solicitud ya fue procesada (${request.status}).`);

    return await this.storeRepository.updateRequestStatus(requestId, 'REJECTED', adminNote);
  }

  async changeStoreStatus(storeId: string, status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED') {
    log.info("Cambiando estado de tienda", { storeId, status });
    return await this.storeRepository.updateStatus(storeId, status);
  }

  // --- Public Flow ---

  async getStoreBySlug(slug: string) {
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) throw new Error("Tienda no encontrada.");
    return store;
  }

  async getActiveStoresForCatalog(page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;
    return await this.storeRepository.findActiveStores(skip, limit);
  }
}
