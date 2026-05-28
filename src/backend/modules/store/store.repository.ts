import prisma from "@/backend/db/prisma";
import type { Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/store/store.repository.ts");

export class StoreRepository {
  // --- Store CRUD ---

  async createStore(data: Prisma.StoreCreateInput) {
    log.info("Creando nueva tienda", { name: data.name, ownerId: data.owner.connect?.id });
    return await prisma.store.create({
      data,
      include: {
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { products: true } }
      }
    });
  }

  async findById(id: string) {
    log.debug("Buscando tienda por ID", { storeId: id });
    return await prisma.store.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { products: true } }
      }
    });
  }

  async findByOwnerId(ownerId: string) {
    log.debug("Buscando tiendas por Owner ID", { ownerId });
    return await prisma.store.findMany({
      where: { ownerId },
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findBySlug(slug: string) {
    log.debug("Buscando tienda por slug", { slug });
    return await prisma.store.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { products: true } }
      }
    });
  }

  async updateStore(id: string, data: Prisma.StoreUpdateInput) {
    log.info("Actualizando tienda", { storeId: id });
    return await prisma.store.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED') {
    log.info("Actualizando estado de tienda", { storeId: id, status });
    return await prisma.store.update({
      where: { id },
      data: { status },
    });
  }

  async findActiveStores(skip?: number, take?: number) {
    log.debug("Buscando tiendas activas para catálogo");
    return await prisma.store.findMany({
      where: { status: 'ACTIVE' },
      skip,
      take,
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllPaginated(params: { skip?: number; take?: number; status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED' }) {
    log.debug("Obteniendo todas las tiendas paginadas", params);
    const where = params.status ? { status: params.status } : {};
    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip: params.skip,
        take: params.take,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { products: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.store.count({ where })
    ]);
    return { stores, total };
  }

  // --- StoreRequest CRUD ---

  async createRequest(data: Prisma.StoreRequestCreateInput) {
    log.info("Creando solicitud de tienda", { userId: data.user.connect?.id, name: data.name });
    return await prisma.storeRequest.create({
      data,
    });
  }

  async findRequestById(id: string) {
    log.debug("Buscando solicitud por ID", { requestId: id });
    return await prisma.storeRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, role: true } },
        store: true
      }
    });
  }

  async findRequestsByUserId(userId: string) {
    log.debug("Buscando solicitudes por User ID", { userId });
    return await prisma.storeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findPendingRequests(skip?: number, take?: number, search?: string) {
    const q = search?.trim();
    log.debug("Buscando solicitudes pendientes", { search: q || undefined });
    const where = this.buildStoreRequestSearchWhere(q, true);
    const [requests, total] = await Promise.all([
      prisma.storeRequest.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          store: true,
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.storeRequest.count({ where })
    ]);
    return { requests, total };
  }

  async findAllRequestsPaginated(skip?: number, take?: number, search?: string) {
    const q = search?.trim();
    log.debug("Buscando todas las solicitudes paginadas", { search: q || undefined });
    const where = this.buildStoreRequestSearchWhere(q);
    const [requests, total] = await Promise.all([
      prisma.storeRequest.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          store: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.storeRequest.count({ where })
    ]);
    return { requests, total };
  }

  private buildStoreRequestSearchWhere(search?: string, onlyPending = false): Prisma.StoreRequestWhereInput {
    const where: Prisma.StoreRequestWhereInput = {};
    if (onlyPending) where.status = 'PENDING';
    if (!search) return where;

    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
      {
        store: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
    ];

    return where;
  }

  async updateRequestStatus(id: string, status: 'APPROVED' | 'REJECTED', adminNote?: string, storeId?: string) {
    log.info("Actualizando estado de solicitud", { requestId: id, status });
    return await prisma.storeRequest.update({
      where: { id },
      data: { 
        status, 
        adminNote,
        store: storeId ? { connect: { id: storeId } } : undefined
      },
    });
  }
}
