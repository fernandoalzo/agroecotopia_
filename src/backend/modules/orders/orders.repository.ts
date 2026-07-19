import prisma from "@/backend/db/prisma";
import { PedidoEstado, Prisma } from "@prisma/client";
import { CacheService, CacheKeys } from "@/backend/cache";
import { config } from "@/config/config";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/orders/orders.repository.ts");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any;

export class OrdersRepository {
  constructor(private cacheService?: CacheService) {}

  private static readonly STATUS_ORDER_SQL = `CASE WHEN p."estado" = 'ENTREGADO' THEN 1 ELSE 0 END, p."fechaPedido" DESC`;
  /**
   * Ejecuta operaciones dentro de una transacción atómica de base de datos.
   */
  async executeTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    log.debug("[db] Iniciando transacción atómica de base de datos.");
    return await prisma.$transaction(fn);
  }

  /**
   * Intenta transicionar el estado de un pedido de forma atómica (lock optimista).
   * Solo tiene efecto si el estado actual es `fromEstado`.
   * @returns `true` si la transición fue exitosa, `false` si ya no estaba en `fromEstado`.
   */
  async tryTransitionEstado(
    id: string,
    fromEstado: PedidoEstado,
    toEstado: PedidoEstado,
    extraData?: Record<string, any>,
    tx?: TxClient
  ): Promise<boolean> {
    const client = tx || prisma;
    log.debug("[db] Intentando transición de estado:", { pedidoId: id, de: fromEstado, a: toEstado });
    const result = await client.pedido.updateMany({
      where: { id, estado: fromEstado },
      data: { estado: toEstado, ...extraData }
    });
    const success = result.count > 0;
    if (success) {
      await this.cacheService?.delPattern(CacheKeys.order.allPattern);
    }
    log.debug("[db] Resultado de transición:", { pedidoId: id, success, affectedCount: result.count });
    return success;
  }

  async createPedido(data: Record<string, unknown>, tx?: TxClient) {
    const client = tx || prisma;
    log.debug("[db] Creando pedido en la base de datos.");

    const decimalFields = ["subtotal", "impuestos", "costoEnvio", "total"] as const;
    const prismaData: Record<string, unknown> = { ...data };
    for (const field of decimalFields) {
      if (typeof prismaData[field] === "number") {
        prismaData[field] = new Prisma.Decimal(prismaData[field] as number);
      }
    }

    const detalleArray = (prismaData.detalles as Record<string, unknown>)?.create;
    if (Array.isArray(detalleArray)) {
      const detailDecimalFields = ["cantidad", "precioUnitario", "subtotal"] as const;
      for (const item of detalleArray) {
        for (const field of detailDecimalFields) {
          if (typeof item[field] === "number") {
            item[field] = new Prisma.Decimal(item[field] as number);
          }
        }
      }
    }

    const pedido = await client.pedido.create({
      data: prismaData,
      include: { detalles: true },
    });
    await this.cacheService?.delPattern(CacheKeys.order.allPattern);
    return pedido;
  }

  async findProductsStoreIds(productIds: string[]) {
    log.debug("[db] Buscando tiendas asociadas a productos:", { productIdsCount: productIds.length });
    return await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, storeId: true, store: { select: { ownerId: true } } },
    });
  }

  async findById(id: string, tx?: TxClient) {
    if (tx) {
      log.debug("[db] Buscando pedido por ID (transacción):", { pedidoId: id });
      return await tx.pedido.findUnique({
        where: { id },
        include: {
          usuario: { select: { id: true, name: true } },
          bodega: true,
          detalles: {
            include: {
              producto: true,
              store: { select: { id: true, name: true, ownerId: true } },
            },
          },
        },
      });
    }
    const key = CacheKeys.order.byId(id);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando pedido por ID:", { pedidoId: id });
        return prisma.pedido.findUnique({
          where: { id },
          include: {
            usuario: { select: { id: true, name: true } },
            bodega: true,
            envio: true,
            detalles: {
              include: {
                producto: true,
                store: { select: { id: true, name: true, ownerId: true } },
              },
            },
          },
        });
      },
      config.cache.ttl.orderDetail,
    ) ?? null;
  }

  async belongsToStoreOwner(pedidoId: string, ownerId: string) {
    log.debug("[db] Validando si el pedido pertenece a una tienda del vendedor:", { pedidoId, ownerId });
    const count = await prisma.detallePedido.count({
      where: {
        pedidoId,
        store: {
          ownerId,
        },
      },
    });

    return count > 0;
  }

  async updatePedido(id: string, data: Prisma.PedidoUpdateInput, tx?: TxClient) {
    const client = tx || prisma;
    log.debug("[db] Actualizando pedido en la base de datos:", { pedidoId: id });
    const pedido = await client.pedido.update({
      where: { id },
      data,
      include: { detalles: true },
    });
    await this.cacheService?.delPattern(CacheKeys.order.allPattern);
    return pedido;
  }

  private async fetchOrderedIds(
    tableAlias: string,
    conditions: string,
    values: unknown[],
    skip?: number,
    take?: number,
  ): Promise<string[]> {
    const limitOffset = take ? `LIMIT $${values.length + 1} OFFSET $${values.length + 2}` : "";
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT p."id" FROM "${tableAlias}" p ${conditions} ORDER BY ${OrdersRepository.STATUS_ORDER_SQL} ${limitOffset}`,
      ...values, ...(take ? [take, skip] : [])
    );
    return rows.map(r => r.id);
  }

  private async findWithOrder<T>(ids: string[], fetcher: (idList: string[]) => Promise<T[]>): Promise<T[]> {
    if (ids.length === 0) return [];
    const results = await fetcher(ids);
    const posMap = new Map(ids.map((id, i) => [id, i]));
    return results.sort((a, b) => (posMap.get((a as any).id) ?? 0) - (posMap.get((b as any).id) ?? 0));
  }

  async findByUsuarioId(usuarioId: string) {
    const key = CacheKeys.order.byUsuarioId(usuarioId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando pedidos por usuario:", { usuarioId });
        const ids = await this.fetchOrderedIds("Pedido", `WHERE p."usuarioId" = $1`, [usuarioId]);
        return this.findWithOrder(ids, async (idList) =>
          prisma.pedido.findMany({
            where: { id: { in: idList } },
            include: {
              bodega: true,
              detalles: {
                include: {
                  producto: true,
                  store: { select: { id: true, name: true } },
                },
              },
            },
          })
        );
      },
      config.cache.ttl.orderList,
    ) ?? [];
  }

  async findByStoreId(storeId: string) {
    const key = CacheKeys.order.byStore(storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando pedidos por tienda:", { storeId });
        const ids = await this.fetchOrderedIds("Pedido", `WHERE EXISTS (SELECT 1 FROM "DetallePedido" dp WHERE dp."pedidoId" = p."id" AND dp."storeId" = $1)`, [storeId]);
        return this.findWithOrder(ids, async (idList) =>
          prisma.pedido.findMany({
            where: { id: { in: idList } },
            include: {
              usuario: { select: { id: true, name: true, email: true } },
              bodega: true,
              detalles: {
                where: { storeId },
                include: { producto: true },
              },
            },
          })
        );
      },
      config.cache.ttl.orderList,
    ) ?? [];
  }

  async findAll() {
    const key = CacheKeys.order.all;
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando todos los pedidos.");
        const ids = await this.fetchOrderedIds("Pedido", "", []);
        return this.findWithOrder(ids, async (idList) =>
          prisma.pedido.findMany({
            where: { id: { in: idList } },
            include: {
              usuario: { select: { id: true, name: true, email: true } },
              bodega: true,
              detalles: { include: { producto: true } },
            },
          })
        );
      },
      config.cache.ttl.orderList,
    ) ?? [];
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    estado?: PedidoEstado;
    search?: string;
    storeId?: string;
  }) {
    const { page, limit, estado, search, storeId } = params;
    const key = CacheKeys.order.paginated(page, limit, estado, search, storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Buscando pedidos paginados y filtrados:", { page, limit, estado, search, storeId });
        const skip = (page - 1) * limit;
        const where: Prisma.PedidoWhereInput = {};
        if (estado) where.estado = estado;
        if (storeId) where.detalles = { some: { storeId } };
        if (search?.trim()) {
          const q = search.trim();
          where.OR = [
            { id: { contains: q, mode: "insensitive" } },
            { direccionEntrega: { contains: q, mode: "insensitive" } },
            {
              usuario: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          ];
        }

        const totalCount = await prisma.pedido.count({ where });

        const conditions: string[] = [];
        const values: unknown[] = [];
        let idx = 1;
        if (estado) {
          conditions.push(`p."estado" = CAST($${idx} AS "PedidoEstado")`); values.push(estado); idx++;
        }
        if (storeId) {
          conditions.push(`EXISTS (SELECT 1 FROM "DetallePedido" dp WHERE dp."pedidoId" = p."id" AND dp."storeId" = $${idx})`); values.push(storeId); idx++;
        }
        if (search?.trim()) {
          const q = `%${search.trim()}%`;
          conditions.push(`(
            p."id" ILIKE $${idx} OR
            p."direccionEntrega" ILIKE $${idx} OR
            EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."usuarioId" AND (u."name" ILIKE $${idx} OR u."email" ILIKE $${idx}))
          )`); values.push(q); idx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const ids = await prisma.$queryRawUnsafe<{ id: string }[]>(
          `SELECT p."id" FROM "Pedido" p ${whereClause} ORDER BY ${OrdersRepository.STATUS_ORDER_SQL} LIMIT $${idx} OFFSET $${idx + 1}`,
          ...values, limit, skip
        );

        const idList = ids.map(r => r.id);
        const orders = await this.findWithOrder(idList, async (list) =>
          prisma.pedido.findMany({
            where: { id: { in: list } },
            include: {
              usuario: { select: { id: true, name: true, email: true } },
              bodega: true,
              detalles: {
                ...(storeId ? { where: { storeId } } : {}),
                include: {
                  producto: true,
                  store: { select: { id: true, name: true, ownerId: true } },
                },
              },
            },
          })
        );

        return { orders, totalCount, totalPages: Math.ceil(totalCount / limit), page, limit };
      },
      config.cache.ttl.orderList,
    ) ?? { orders: [], totalCount: 0, totalPages: 0, page, limit };
  }

  async getStatusCounts(storeId?: string) {
    const key = CacheKeys.order.statusCounts(storeId);
    return this.cacheService?.getOrSet(
      key,
      async () => {
        log.debug("[db] Obteniendo conteo de pedidos por estado.");
        const where = storeId ? { detalles: { some: { storeId } } } : {};
        const counts = await prisma.pedido.groupBy({
          by: ["estado"],
          where,
          _count: { _all: true },
        });
        const result: Record<string, number> = {};
        counts.forEach((c) => { result[c.estado] = c._count._all; });
        return result;
      },
      config.cache.ttl.orderStatusCounts,
    ) ?? {};
  }

  async updateProductStock(productoId: string, cantidad: number | Prisma.Decimal, tx?: TxClient) {
    const client = tx || prisma;
    log.debug("[db] Actualizando stock del producto:", { productoId, incremento: Number(cantidad) });
    return await client.product.update({
      where: { id: productoId },
      data: {
        stock: {
          increment: cantidad,
        },
      },
    });
  }

  async getProductStock(productoId: string, tx?: TxClient) {
    const client = tx || prisma;
    const product = await client.product.findUnique({
      where: { id: productoId },
      select: { stock: true },
    });
    return product?.stock || 0;
  }

  async deletePedido(id: string) {
    log.info("[db] Eliminando pedido de la base de datos:", { pedidoId: id });
    const result = await prisma.pedido.delete({
      where: { id },
    });
    await this.cacheService?.delPattern(CacheKeys.order.allPattern);
    return result;
  }

  async removeDetalleAndUpdatePedido(
    detalleId: string,
    pedidoId: string,
    totals: { subtotal: number; impuestos: number; costoEnvio: number; total: number },
    tx?: TxClient
  ) {
    const client = tx || prisma;
    log.debug("[db] Eliminando detalle y actualizando totales del pedido:", { detalleId, pedidoId });
    await client.detallePedido.delete({ where: { id: detalleId } });
    await client.pedido.update({
      where: { id: pedidoId },
      data: {
        subtotal: new Prisma.Decimal(totals.subtotal),
        impuestos: new Prisma.Decimal(totals.impuestos),
        costoEnvio: new Prisma.Decimal(totals.costoEnvio),
        total: new Prisma.Decimal(totals.total),
      },
    });
    await this.cacheService?.delPattern(CacheKeys.order.allPattern);
    log.debug("[db] Detalle eliminado y totales actualizados:", { detalleId, pedidoId });
  }
}
