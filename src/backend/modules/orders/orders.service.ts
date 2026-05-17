import { OrdersRepository } from "./orders.repository";
import { PedidoEstado, Prisma } from "@prisma/client";

export class OrdersService {
  constructor(private ordersRepository: OrdersRepository) {}

  async createPedido(data: {
    usuarioId: string;
    accountId?: string;
    direccionEntrega: string;
    notasCliente?: string;
    costoEnvio: number;
    impuestosPorcentaje: number;
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
      subtotal: new Prisma.Decimal(subtotal),
      impuestos: new Prisma.Decimal(impuestos),
      costoEnvio: new Prisma.Decimal(data.costoEnvio),
      total: new Prisma.Decimal(total),
      estado: PedidoEstado.PENDIENTE,
      detalles: {
        create: detallesInput,
      },
    });

    return this.serializePedido(pedido);
  }

  async updateEstado(pedidoId: string, nuevoEstado: PedidoEstado, motivoCancelacion?: string) {
    const pedido = await this.ordersRepository.findById(pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");

    const estadoAnterior = pedido.estado;

    // Regla 3: No se puede confirmar si no hay stock
    if (nuevoEstado === PedidoEstado.CONFIRMADO && estadoAnterior !== PedidoEstado.CONFIRMADO) {
      for (const detalle of pedido.detalles) {
        const stockActual = await this.ordersRepository.getProductStock(detalle.productoId);
        if (new Prisma.Decimal(stockActual).lessThan(detalle.cantidad)) {
          throw new Error(`Stock insuficiente para el producto ${detalle.producto.name}`);
        }
      }

      // Regla 1: Descontar inventario al confirmar
      for (const detalle of pedido.detalles) {
        await this.ordersRepository.updateProductStock(
          detalle.productoId,
          detalle.cantidad.negated()
        );
      }
    }

    // Regla 2: Revertir inventario si se cancela y estaba confirmado
    if (nuevoEstado === PedidoEstado.CANCELADO && estadoAnterior !== PedidoEstado.CANCELADO) {
      // Solo revertimos si ya había pasado por un estado que descontó stock (CONFIRMADO, PREPARACION, etc.)
      // En este flujo simplificado, asumimos que CONFIRMADO es el punto de descuento.
      const estadosConStockDescontado: PedidoEstado[] = [
        PedidoEstado.CONFIRMADO,
        PedidoEstado.EN_PREPARACION,
        PedidoEstado.EN_CAMINO,
        PedidoEstado.ENTREGADO,
      ];

      if (estadosConStockDescontado.includes(estadoAnterior)) {
        for (const detalle of pedido.detalles) {
          await this.ordersRepository.updateProductStock(detalle.productoId, detalle.cantidad);
        }
      }
    }

    const pedidoActualizado = await this.ordersRepository.updatePedido(pedidoId, {
      estado: nuevoEstado,
      motivoCancelacion: nuevoEstado === PedidoEstado.CANCELADO ? motivoCancelacion : undefined,
      fechaEntregaReal: nuevoEstado === PedidoEstado.ENTREGADO ? new Date() : undefined,
    });

    return this.serializePedido(pedidoActualizado);
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
}
