import prisma from "@/backend/db/prisma";
import { EnvioEstado, Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/envio/envio.repository.ts");

type TxClient = any;

export class EnvioRepository {
  async executeTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    return await prisma.$transaction(fn);
  }

  async findById(id: string, tx?: TxClient) {
    const client = tx || prisma;
    return await client.envio.findUnique({
      where: { id },
      include: {
        eventos: { orderBy: { fecha: "asc" } },
        pedido: {
          include: {
            usuario: { select: { id: true, name: true, email: true } },
            detalles: { include: { producto: true } },
          },
        },
      },
    });
  }

  async findByPedidoId(pedidoId: string, tx?: TxClient) {
    const client = tx || prisma;
    return await client.envio.findUnique({
      where: { pedidoId },
      include: { eventos: { orderBy: { fecha: "asc" } } },
    });
  }

  async findByStoreId(
    storeId: string,
    params: { page: number; limit: number; estado?: EnvioEstado; search?: string }
  ) {
    const { page, limit, estado, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.EnvioWhereInput = { storeId };

    if (estado) {
      where.estado = estado;
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { numeroGuia: { contains: q, mode: "insensitive" } },
        { destinatarioNombre: { contains: q, mode: "insensitive" } },
        { ciudad: { contains: q, mode: "insensitive" } },
        { pedido: { id: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [totalCount, envios] = await Promise.all([
      prisma.envio.count({ where }),
      prisma.envio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          pedido: {
            select: {
              id: true,
              estado: true,
              total: true,
              usuario: { select: { id: true, name: true } },
            },
          },
          eventos: { orderBy: { fecha: "desc" }, take: 1 },
        },
      }),
    ]);

    return {
      envios,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    };
  }

  async create(data: Prisma.EnvioCreateInput, tx?: TxClient) {
    const client = tx || prisma;
    log.debug("Creando registro de envío en BD");
    return await client.envio.create({
      data,
      include: { eventos: true },
    });
  }

  async tryTransitionEstado(
    id: string,
    fromEstado: EnvioEstado,
    toEstado: EnvioEstado,
    extraData?: Record<string, any>,
    tx?: TxClient
  ): Promise<boolean> {
    const client = tx || prisma;
    const result = await client.envio.updateMany({
      where: { id, estado: fromEstado },
      data: { estado: toEstado, ...extraData },
    });
    return result.count > 0;
  }

  async createEvento(data: Prisma.EnvioEventoCreateInput, tx?: TxClient) {
    const client = tx || prisma;
    return await client.envioEvento.create({ data });
  }

  async findAllPaginated(
    params: { page: number; limit: number; estado?: EnvioEstado; search?: string }
  ) {
    const { page, limit, estado, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.EnvioWhereInput = {};

    if (estado) {
      where.estado = estado;
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { numeroGuia: { contains: q, mode: "insensitive" } },
        { destinatarioNombre: { contains: q, mode: "insensitive" } },
        { ciudad: { contains: q, mode: "insensitive" } },
        { store: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [totalCount, envios] = await Promise.all([
      prisma.envio.count({ where }),
      prisma.envio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          pedido: {
            select: {
              id: true,
              estado: true,
              total: true,
              usuario: { select: { id: true, name: true } },
            },
          },
          store: { select: { id: true, name: true } },
          eventos: { orderBy: { fecha: "desc" }, take: 1 },
        },
      }),
    ]);

    return {
      envios,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    };
  }

  async getStatusCounts(storeId?: string) {
    const where: Prisma.EnvioWhereInput = {};
    if (storeId) where.storeId = storeId;
    const counts = await prisma.envio.groupBy({
      by: ["estado"],
      where,
      _count: { _all: true },
    });
    const result: Record<string, number> = {};
    counts.forEach((c) => {
      result[c.estado] = c._count._all;
    });
    return result;
  }
}
