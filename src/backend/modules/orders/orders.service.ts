import { OrdersRepository } from "./orders.repository";
import { PedidoEstado, Prisma } from "@prisma/client";

export class OrdersService {
  constructor(private ordersRepository: OrdersRepository) { }

  async createPedido(data: {
    usuarioId: string;
    accountId?: string;
    direccionEntrega: string;
    notasCliente?: string;
    costoEnvio: number;
    impuestosPorcentaje: number;
    metodoPago?: string;
    detalles: {
      productoId: string;
      cantidad: number;
      precioUnitario: number;
      unidadMedida: string;
    }[];
  }) {
    let subtotal = 0;
    const detallesInput: Prisma.DetallePedidoCreateWithoutPedidoInput[] = data.detalles.map((d) => {
      const itemSubtotal = d.cantidad * d.precioUnitario;
      subtotal += itemSubtotal;
      return {
        producto: { connect: { id: d.productoId } },
        cantidad: new Prisma.Decimal(d.cantidad),
        precioUnitario: new Prisma.Decimal(d.precioUnitario),
        unidadMedida: d.unidadMedida,
        subtotal: new Prisma.Decimal(itemSubtotal),
      };
    });

    const impuestos = subtotal * (data.impuestosPorcentaje / 100);
    const total = subtotal + impuestos + data.costoEnvio;

    const pedido = await this.ordersRepository.createPedido({
      usuario: { connect: { id: data.usuarioId } },
      accountId: data.accountId,
      direccionEntrega: data.direccionEntrega,
      notasCliente: data.notasCliente,
      metodoPago: data.metodoPago,
      subtotal: new Prisma.Decimal(subtotal),
      impuestos: new Prisma.Decimal(impuestos),
      costoEnvio: new Prisma.Decimal(data.costoEnvio),
      total: new Prisma.Decimal(total),
      estado: PedidoEstado.PENDIENTE,
      detalles: {
        create: detallesInput,
      },
    } as any);

    return this.serializePedido(pedido);
  }

  async updateEstado(pedidoId: string, nuevoEstado: PedidoEstado, motivoCancelacion?: string) {
    return await this.ordersRepository.executeTransaction(async (tx) => {
      // 1. Leer pedido actual dentro de la transacción
      const pedido = await this.ordersRepository.findById(pedidoId, tx);
      if (!pedido) throw new Error("Pedido no encontrado");

      const estadoAnterior = pedido.estado;

      // 2. Si ya está en el estado destino → retorno idempotente (sin tocar stock)
      if (estadoAnterior === nuevoEstado) {
        return this.serializePedido(pedido);
      }

      // 3. Transición atómica con lock optimista (WHERE estado = estadoAnterior)
      //    Solo el primer proceso concurrente logra count > 0
      const transitioned = await this.ordersRepository.tryTransitionEstado(
        pedidoId,
        estadoAnterior,
        nuevoEstado,
        {
          motivoCancelacion: nuevoEstado === PedidoEstado.CANCELADO ? motivoCancelacion : undefined,
          fechaEntregaReal: nuevoEstado === PedidoEstado.ENTREGADO ? new Date() : undefined,
        },
        tx
      );

      // 4. Si no se pudo transicionar, otro proceso ya lo hizo → retorno idempotente
      if (!transitioned) {
        const current = await this.ordersRepository.findById(pedidoId, tx);
        return this.serializePedido(current);
      }

      // 5. Ganamos la race — ejecutar lógica de stock dentro de la misma transacción

      // Regla: Verificar y descontar inventario al confirmar
      if (nuevoEstado === PedidoEstado.CONFIRMADO) {
        for (const detalle of pedido.detalles) {
          const stockActual = await this.ordersRepository.getProductStock(detalle.productoId, tx);
          if (new Prisma.Decimal(stockActual).lessThan(detalle.cantidad)) {
            throw new Error(`Stock insuficiente para el producto ${detalle.producto.name}`);
          }
        }
        for (const detalle of pedido.detalles) {
          await this.ordersRepository.updateProductStock(
            detalle.productoId,
            detalle.cantidad.negated(),
            tx
          );
        }
      }

      // Regla: Revertir inventario si se cancela desde un estado con stock descontado
      if (nuevoEstado === PedidoEstado.CANCELADO) {
        const estadosConStockDescontado: PedidoEstado[] = [
          PedidoEstado.CONFIRMADO,
          PedidoEstado.EN_PREPARACION,
          PedidoEstado.EN_CAMINO,
          PedidoEstado.ENTREGADO,
        ];

        if (estadosConStockDescontado.includes(estadoAnterior)) {
          for (const detalle of pedido.detalles) {
            await this.ordersRepository.updateProductStock(detalle.productoId, detalle.cantidad, tx);
          }
        }
      }

      // 6. Refrescar pedido con estado actualizado
      const pedidoActualizado = await this.ordersRepository.findById(pedidoId, tx);
      return this.serializePedido(pedidoActualizado);
    });
  }

  async getPedidosPorUsuario(usuarioId: string) {
    const pedidos = await this.ordersRepository.findByUsuarioId(usuarioId);
    return pedidos.map(p => this.serializePedido(p));
  }

  async getPedidoDetallado(pedidoId: string) {
    const pedido = await this.ordersRepository.findById(pedidoId);
    return pedido ? this.serializePedido(pedido) : null;
  }

  /**
   * Convierte objetos Decimal de Prisma a numbers para serialización
   */
  private serializePedido(pedido: any) {
    return {
      ...pedido,
      subtotal: Number(pedido.subtotal),
      impuestos: Number(pedido.impuestos),
      costoEnvio: Number(pedido.costoEnvio),
      total: Number(pedido.total),
      detalles: pedido.detalles?.map((d: any) => this.serializeDetalle(d)),
    };
  }

  private serializeDetalle(detalle: any) {
    return {
      ...detalle,
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precioUnitario),
      subtotal: Number(detalle.subtotal),
      producto: detalle.producto ? {
        ...detalle.producto,
        stock: Number(detalle.producto.stock)
      } : undefined
    };
  }

  async deletePedido(pedidoId: string) {
    const pedido = await this.ordersRepository.findById(pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");

    if (pedido.estado !== PedidoEstado.CANCELADO) {
      throw new Error("Solo se pueden eliminar pedidos en estado Cancelado");
    }

    return await this.ordersRepository.deletePedido(pedidoId);
  }

  async updatePedido(pedidoId: string, data: Prisma.PedidoUpdateInput) {
    const pedido = await this.ordersRepository.findById(pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");

    const pedidoActualizado = await this.ordersRepository.updatePedido(pedidoId, data);
    return this.serializePedido(pedidoActualizado);
  }
}
