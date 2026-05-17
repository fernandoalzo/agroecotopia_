import prisma from "@/backend/db/prisma";
import { PedidoEstado, Prisma } from "@prisma/client";

export class OrdersRepository {
  async createPedido(data: Prisma.PedidoCreateInput) {
    return await prisma.pedido.create({
      data,
      include: {
        detalles: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.pedido.findUnique({
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

  async updatePedido(id: string, data: Prisma.PedidoUpdateInput) {
    return await prisma.pedido.update({
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

  async updateProductStock(productoId: string, cantidad: number | Prisma.Decimal) {
    return await prisma.product.update({
      where: { id: productoId },
      data: {
        stock: {
          increment: cantidad,
        },
      },
    });
  }

  async getProductStock(productoId: string) {
    const product = await prisma.product.findUnique({
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
