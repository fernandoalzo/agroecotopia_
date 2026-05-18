import prisma from "@/backend/db/prisma";
import { PedidoEstado, Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any;

export class OrdersRepository {
  /**
   * Ejecuta operaciones dentro de una transacción atómica de base de datos.
   */
  async executeTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
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
    const result = await client.pedido.updateMany({
      where: { id, estado: fromEstado },
      data: { estado: toEstado, ...extraData }
    });
    return result.count > 0;
  }

  async createPedido(data: Prisma.PedidoCreateInput) {
    return await prisma.pedido.create({
      data,
      include: {
        detalles: true,
      },
    });
  }

  async findById(id: string, tx?: TxClient) {
    const client = tx || prisma;
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
    return await client.pedido.update({
      where: { id },
      data,
      include: {
        detalles: true,
      },
    });
  }

  async findByUsuarioId(usuarioId: string) {
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

  async updateProductStock(productoId: string, cantidad: number | Prisma.Decimal, tx?: TxClient) {
    const client = tx || prisma;
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
    return await prisma.pedido.delete({
      where: { id },
    });
  }
}
