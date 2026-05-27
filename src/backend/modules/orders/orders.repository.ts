import prisma from "@/backend/db/prisma";
import { PedidoEstado, Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/orders/orders.repository.ts");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any;

export class OrdersRepository {
  /**
   * Ejecuta operaciones dentro de una transacción atómica de base de datos.
   */
  async executeTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    log.debug("Iniciando transacción atómica de base de datos.");
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
    log.debug("Intentando transición de estado:", { pedidoId: id, de: fromEstado, a: toEstado });
    const result = await client.pedido.updateMany({
      where: { id, estado: fromEstado },
      data: { estado: toEstado, ...extraData }
    });
    const success = result.count > 0;
    log.debug("Resultado de transición:", { pedidoId: id, success, affectedCount: result.count });
    return success;
  }

  async createPedido(data: Prisma.PedidoCreateInput) {
    log.debug("Creando pedido en la base de datos.");
    return await prisma.pedido.create({
      data,
      include: {
        detalles: true,
      },
    });
  }

  async findById(id: string, tx?: TxClient) {
    const client = tx || prisma;
    log.debug("Buscando pedido por ID:", { pedidoId: id });
    return await client.pedido.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async updatePedido(id: string, data: Prisma.PedidoUpdateInput, tx?: TxClient) {
    const client = tx || prisma;
    log.debug("Actualizando pedido en la base de datos:", { pedidoId: id });
    return await client.pedido.update({
      where: { id },
      data,
      include: {
        detalles: true,
      },
    });
  }

  async findByUsuarioId(usuarioId: string) {
    log.debug("Buscando pedidos por usuario:", { usuarioId });
    return await prisma.pedido.findMany({
      where: { usuarioId },
      orderBy: { fechaPedido: "desc" },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async findByStoreId(storeId: string) {
    log.debug("Buscando pedidos por tienda:", { storeId });
    return await prisma.pedido.findMany({
      where: {
        detalles: { some: { storeId } }
      },
      orderBy: { fechaPedido: "desc" },
      include: {
        usuario: { select: { id: true, name: true, email: true } },
        detalles: {
          where: { storeId },
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async findAll() {
    log.debug("Buscando todos los pedidos.");
    return await prisma.pedido.findMany({
      orderBy: { fechaPedido: "desc" },
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    estado?: PedidoEstado;
    search?: string;
    storeId?: string;
  }) {
    const { page, limit, estado, search, storeId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PedidoWhereInput = {};

    if (estado) {
      where.estado = estado;
    }

    if (storeId) {
      where.detalles = { some: { storeId } };
    }

    if (search && search.trim() !== "") {
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

    log.debug("Buscando pedidos paginados y filtrados:", { page, limit, estado, search });

    const [totalCount, orders] = await Promise.all([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaPedido: "desc" },
        include: {
          usuario: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          detalles: {
            ...(storeId ? { where: { storeId } } : {}),
            include: {
              producto: true,
            },
          },
        },
      }),
    ]);

    return {
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    };
  }

  async getStatusCounts(storeId?: string) {
    log.debug("Obteniendo conteo de pedidos por estado en la base de datos.");
    const where = storeId ? { detalles: { some: { storeId } } } : {};
    
    const counts = await prisma.pedido.groupBy({
      by: ['estado'],
      where,
      _count: {
        _all: true,
      },
    });
    
    // Map list to Record<string, number>
    const result: Record<string, number> = {};
    counts.forEach((c) => {
      result[c.estado] = c._count._all;
    });
    return result;
  }

  async updateProductStock(productoId: string, cantidad: number | Prisma.Decimal, tx?: TxClient) {
    const client = tx || prisma;
    log.debug("Actualizando stock del producto:", { productoId, incremento: Number(cantidad) });
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
    log.info("Eliminando pedido de la base de datos:", { pedidoId: id });
    return await prisma.pedido.delete({
      where: { id },
    });
  }
}
