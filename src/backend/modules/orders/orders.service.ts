import { OrdersRepository } from "./orders.repository";
import { PedidoEstado, Prisma } from "@prisma/client";
import logger from "@/utils/logger";
import { notificationsService } from "@/backend/modules/notifications";
import { storeTaxService } from "@/backend/modules/store";

const log = logger.child("src/backend/modules/orders/orders.service.ts");


type CreatePedidoDetalle = {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  unidadMedida: string;
};

type CreatePedidoData = {
  usuarioId: string;
  accountId?: string;
  direccionEntrega: string;
  notasCliente?: string;
  costoEnvio: number;
  metodoPago?: string;
  detalles: CreatePedidoDetalle[];
};

export class OrdersService {
  constructor(private ordersRepository: OrdersRepository) { }

  async createPedido(data: CreatePedidoData) {
    const productIds = data.detalles.map(d => d.productoId);
    const dbProducts = await this.ordersRepository.findProductsStoreIds(productIds);

    const productStoreMap = new Map(dbProducts.map(p => [p.id, p.storeId]));
    const storeOwnersMap = new Map(dbProducts.map(p => [p.storeId, p.store?.ownerId]));

    const missingProduct = productIds.find((productId) => !productStoreMap.has(productId));
    if (missingProduct) {
      log.warn("Intento de crear pedido con producto inexistente:", { productoId: missingProduct });
      throw new Error("Uno de los productos del carrito ya no está disponible");
    }

    const storeGroups = new Map<string, typeof data.detalles>();
    for (const detalle of data.detalles) {
      const storeId = productStoreMap.get(detalle.productoId)!;
      const group = storeGroups.get(storeId) || [];
      group.push(detalle);
      storeGroups.set(storeId, group);
    }

    log.info("Creando pedidos agrupados por tienda:", {
      usuarioId: data.usuarioId,
      storesCount: storeGroups.size,
      cantidadItems: data.detalles.length,
    });

    const pedidos = await this.ordersRepository.executeTransaction(async (tx) => {
      const createdPedidos = [];
      const allItemsSubtotal = data.detalles.reduce((total, detalle) => {
        return total + detalle.cantidad * detalle.precioUnitario;
      }, 0);

      for (const [storeId, detalles] of storeGroups.entries()) {
        const pedido = await this.createPedidoForStoreGroup(data, storeId, detalles, allItemsSubtotal, tx);
        createdPedidos.push(pedido);
      }

      return createdPedidos;
    });

    log.info("Pedidos creados exitosamente por tienda:", { pedidoIds: pedidos.map((pedido) => pedido.id) });

    // Despachar notificaciones a los dueños de las tiendas
    for (const pedido of pedidos) {
      const ownerId = storeOwnersMap.get(pedido.detalles[0]?.storeId);
      if (ownerId && ownerId !== data.usuarioId) {
        notificationsService.dispatchNotification({
          eventType: "order_created",
          actorId: data.usuarioId,
          entityType: "Pedido",
          entityId: pedido.id,
          notification: {
            type: "new_order",
            title: "Nuevo Pedido Recibido",
            message: `¡Tienes un nuevo pedido por $${Number(pedido.total).toFixed(2)}! Por favor prepáralo pronto.`,
            audienceType: "INDIVIDUAL",
            audienceRef: ownerId,
            metadata: { actionUrl: "/mi-tienda" }
          },
        }).catch(err => {
          log.error("Error al despachar notificación de nuevo pedido:", err);
        });
      }
    }

    return pedidos.map((pedido) => this.serializePedido(pedido));
  }

  private async createPedidoForStoreGroup(
    data: CreatePedidoData,
    storeId: string,
    detalles: CreatePedidoDetalle[],
    allItemsSubtotal: number,
    tx: Prisma.TransactionClient
  ) {
    let subtotal = 0;
    const detallesInput: Prisma.DetallePedidoCreateWithoutPedidoInput[] = detalles.map((d) => {
      const itemSubtotal = d.cantidad * d.precioUnitario;
      subtotal += itemSubtotal;
      return {
        producto: { connect: { id: d.productoId } },
        cantidad: new Prisma.Decimal(d.cantidad),
        precioUnitario: new Prisma.Decimal(d.precioUnitario),
        unidadMedida: d.unidadMedida,
        subtotal: new Prisma.Decimal(itemSubtotal),
        store: { connect: { id: storeId } },
      };
    });

    const activeTaxes = await storeTaxService.getTaxesByStoreId(storeId);
    const totalTaxPercentage = activeTaxes
      .filter((t: any) => t.isActive)
      .reduce((sum: number, t: any) => sum + Number(t.percentage), 0);

    const impuestos = subtotal * (totalTaxPercentage / 100);
    const shippingRatio = allItemsSubtotal > 0 ? subtotal / allItemsSubtotal : 0;
    const costoEnvio = data.costoEnvio * shippingRatio;
    const total = subtotal + impuestos + costoEnvio;


    log.info("Creando pedido de tienda en base de datos:", { usuarioId: data.usuarioId, storeId, subtotal, impuestos, costoEnvio, total, cantidadItems: detalles.length });

    return await this.ordersRepository.createPedido({
      usuario: { connect: { id: data.usuarioId } },
      accountId: data.accountId,
      direccionEntrega: data.direccionEntrega,
      notasCliente: data.notasCliente,
      metodoPago: data.metodoPago,
      subtotal: new Prisma.Decimal(subtotal),
      impuestos: new Prisma.Decimal(impuestos),
      costoEnvio: new Prisma.Decimal(costoEnvio),
      total: new Prisma.Decimal(total),
      estado: PedidoEstado.PENDIENTE,
      detalles: {
        create: detallesInput,
      },
    } as Prisma.PedidoCreateInput, tx);
  }

  async updateEstado(pedidoId: string, nuevoEstado: PedidoEstado, actorId: string, motivoCancelacion?: string) {
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
      
      // 7. Notificar al comprador del cambio de estado
      notificationsService.dispatchNotification({
        eventType: "order_status_changed",
        actorId,
        entityType: "Pedido",
        entityId: pedidoId,
        notification: {
          type: "order_update",
          title: "Actualización de Pedido",
          message: `Tu pedido #${pedidoId.slice(-6).toUpperCase()} ha cambiado a estado: ${nuevoEstado}.`,
          audienceType: "INDIVIDUAL",
          audienceRef: pedidoActualizado.usuarioId,
          metadata: { actionUrl: `/pedidos/${pedidoId}` }
        }
      }).catch(err => log.error("Error despachando notificación de cambio de estado:", err));

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
    storeId?: string;
  }) {
    log.debug("Obteniendo pedidos paginados y filtrados.");
    const result = await this.ordersRepository.findPaginated(params);
    return {
      orders: result.orders.map(p => this.serializePedido(p)),
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    };
  }

  async updateEstadoForStore(storeId: string, pedidoId: string, nuevoEstado: PedidoEstado, actorId: string, motivoCancelacion?: string) {
    log.info("Validando pedido de tienda antes de actualizar estado:", { storeId, pedidoId, nuevoEstado });
    const pedido = await this.ordersRepository.findById(pedidoId);

    if (!pedido) {
      log.warn("Pedido no encontrado al validar actualización de tienda:", { storeId, pedidoId });
      throw new Error("Pedido no encontrado");
    }

    const belongsToStore = pedido.detalles.some((detalle: { storeId?: string | null }) => detalle.storeId === storeId);
    if (!belongsToStore) {
      log.warn("Intento de actualizar pedido ajeno a la tienda:", { storeId, pedidoId });
      throw new Error("No tienes permiso para gestionar este pedido");
    }

    return await this.updateEstado(pedidoId, nuevoEstado, actorId, motivoCancelacion);
  }

  async getOrderStatusCounts(storeId?: string) {
    log.debug("Obteniendo conteo de estados de pedidos.");
    return await this.ordersRepository.getStatusCounts(storeId);
  }

  async getPedidoDetallado(pedidoId: string) {
    log.debug("Obteniendo pedido detallado:", { pedidoId });
    const pedido = await this.ordersRepository.findById(pedidoId);
    return pedido ? this.serializePedido(pedido) : null;
  }

  async belongsToStoreOwner(pedidoId: string, ownerId: string) {
    return await this.ordersRepository.belongsToStoreOwner(pedidoId, ownerId);
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
