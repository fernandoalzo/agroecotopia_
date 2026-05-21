import { OrdersRepository } from "./orders.repository";
import { PedidoEstado, Prisma } from "@prisma/client";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/orders/orders.service.ts");

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

    log.info("Creando pedido en base de datos:", { usuarioId: data.usuarioId, subtotal, impuestos, total, cantidadItems: data.detalles.length });

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

    log.info("Pedido creado exitosamente:", { pedidoId: pedido.id });
    return this.serializePedido(pedido);
  }

  async updateEstado(pedidoId: string, nuevoEstado: PedidoEstado, motivoCancelacion?: string) {
    log.info("Iniciando transición de estado del pedido:", { pedidoId, nuevoEstado });
    return await this.ordersRepository.executeTransaction(async (tx) => {
      // 1. Leer pedido actual dentro de la transacción
      const pedido = await this.ordersRepository.findById(pedidoId, tx);
      if (!pedido) {
        log.error("Pedido no encontrado durante transición de estado:", { pedidoId });
        throw new Error("Pedido no encontrado");
      }

      const estadoAnterior = pedido.estado;

      // 2. Si ya está en el estado destino → retorno idempotente (sin tocar stock)
      if (estadoAnterior === nuevoEstado) {
        log.debug("Transición idempotente: el pedido ya está en el estado destino:", { pedidoId, estado: nuevoEstado });
        return this.serializePedido(pedido);
      }

      // 3. Transición atómica con lock optimista (WHERE estado = estadoAnterior)
      //    Solo el primer proceso concurrente logra count > 0
      log.debug("Intentando transición atómica con lock optimista:", { pedidoId, de: estadoAnterior, a: nuevoEstado });
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
        log.warn("Transición fallida (race condition detectada). Otro proceso ya transicionó el pedido:", { pedidoId });
        const current = await this.ordersRepository.findById(pedidoId, tx);
        return this.serializePedido(current);
      }

      log.info("Transición de estado exitosa:", { pedidoId, de: estadoAnterior, a: nuevoEstado });

      // 5. Ganamos la race — ejecutar lógica de stock dentro de la misma transacción

      // Regla: Verificar y descontar inventario al confirmar
      if (nuevoEstado === PedidoEstado.CONFIRMADO) {
        log.debug("Verificando y descontando stock al confirmar pedido:", { pedidoId });
        for (const detalle of pedido.detalles) {
          const stockActual = await this.ordersRepository.getProductStock(detalle.productoId, tx);
          if (new Prisma.Decimal(stockActual).lessThan(detalle.cantidad)) {
            log.error("Stock insuficiente para confirmar pedido:", { pedidoId, productoId: detalle.productoId, stockActual: Number(stockActual), cantidadRequerida: Number(detalle.cantidad) });
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
        log.debug("Stock descontado exitosamente para pedido confirmado:", { pedidoId });
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
          log.debug("Revirtiendo stock por cancelación desde estado con stock descontado:", { pedidoId, estadoAnterior });
          for (const detalle of pedido.detalles) {
            await this.ordersRepository.updateProductStock(detalle.productoId, detalle.cantidad, tx);
          }
          log.debug("Stock revertido exitosamente:", { pedidoId });
        }
      }

      // 6. Refrescar pedido con estado actualizado
      const pedidoActualizado = await this.ordersRepository.findById(pedidoId, tx);
      return this.serializePedido(pedidoActualizado);
    });
  }

  async getPedidosPorUsuario(usuarioId: string) {
    log.debug("Obteniendo pedidos del usuario:", { usuarioId });
    const pedidos = await this.ordersRepository.findByUsuarioId(usuarioId);
    log.debug("Pedidos encontrados:", { usuarioId, count: pedidos.length });
    return pedidos.map(p => this.serializePedido(p));
  }

  async getAllPedidos() {
    log.debug("Obteniendo todos los pedidos para el admin.");
    const pedidos = await this.ordersRepository.findAll();
    log.debug("Todos los pedidos encontrados:", { count: pedidos.length });
    return pedidos.map(p => this.serializePedido(p));
  }

  async getPaginatedPedidos(params: {
    page: number;
    limit: number;
    estado?: PedidoEstado;
    search?: string;
  }) {
    log.debug("Obteniendo pedidos paginados y filtrados para el admin.");
    const result = await this.ordersRepository.findPaginated(params);
    return {
      orders: result.orders.map(p => this.serializePedido(p)),
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    };
  }

  async getOrderStatusCounts() {
    log.debug("Obteniendo conteo de estados de pedidos para el admin.");
    return await this.ordersRepository.getStatusCounts();
  }

  async getPedidoDetallado(pedidoId: string) {
    log.debug("Obteniendo pedido detallado:", { pedidoId });
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
    log.info("Eliminando pedido:", { pedidoId });
    const pedido = await this.ordersRepository.findById(pedidoId);
    if (!pedido) {
      log.error("Pedido no encontrado para eliminación:", { pedidoId });
      throw new Error("Pedido no encontrado");
    }

    if (pedido.estado !== PedidoEstado.CANCELADO) {
      log.warn("Intento de eliminar pedido en estado no cancelado:", { pedidoId, estado: pedido.estado });
      throw new Error("Solo se pueden eliminar pedidos en estado Cancelado");
    }

    const result = await this.ordersRepository.deletePedido(pedidoId);
    log.info("Pedido eliminado exitosamente:", { pedidoId });
    return result;
  }

  async updatePedido(pedidoId: string, data: Prisma.PedidoUpdateInput) {
    log.debug("Actualizando pedido:", { pedidoId });
    const pedido = await this.ordersRepository.findById(pedidoId);
    if (!pedido) {
      log.error("Pedido no encontrado para actualización:", { pedidoId });
      throw new Error("Pedido no encontrado");
    }

    const pedidoActualizado = await this.ordersRepository.updatePedido(pedidoId, data);
    log.debug("Pedido actualizado exitosamente:", { pedidoId });
    return this.serializePedido(pedidoActualizado);
  }
}
