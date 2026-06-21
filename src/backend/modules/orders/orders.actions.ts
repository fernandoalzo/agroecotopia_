"use server";

import { ordersService, StockError } from "./index";
import { authService } from "@/backend/modules/auth";
import { withAuth, withAdmin } from "@/lib/auth-guards";
import { PedidoEstado, Role } from "@/types";
import { revalidatePath } from "next/cache";
import { chatService } from "@/backend/modules/chat";
import logger from "@/utils/logger";
import { deepSerialize } from "@/lib/serialize";

const log = logger.child("src/backend/modules/orders/orders.actions.ts");

/**
 * Crea un nuevo pedido para el usuario autenticado.
 */
export async function placeOrderAction(data: {
  direccionEntrega?: string | null;
  notasCliente?: string;
  costoEnvio: number;
  metodoPago?: string;
  tipoEntrega?: string;
  bodegaId?: string | null;
  detalles: {
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    unidadMedida: string;
  }[];
}) {
  return await withAuth(async (session) => {
    const userId = session.user.id;

    log.info("Creando nuevo pedido para el usuario:", { userId, metodoPago: data.metodoPago, cantidadItems: data.detalles.length });
    const pedidos = await ordersService.createPedido({
      ...data,
      usuarioId: userId,
      tipoEntrega: data.tipoEntrega || "ENVIO",
      bodegaId: data.bodegaId || null,
      direccionEntrega: data.direccionEntrega || "",
    });
    const pedidoIds = pedidos.map((pedido) => pedido.id);
    const primaryPedidoId = pedidoIds[0];

    log.info("Pedido creado exitosamente:", { pedidoIds, userId });
    revalidatePath("/perfil/pedidos");
    return deepSerialize({ success: true, pedidoId: primaryPedidoId, pedidoIds });
  });
}

/**
 * Actualiza el estado de un pedido (Solo Administradores).
 */
export async function updateOrderStatusAction(
  pedidoId: string,
  nuevoEstado: PedidoEstado,
  motivoCancelacion?: string
) {
  return await withAdmin(async (session) => {
    try {
      const userId = session.user.id;

      log.info("Admin actualizando estado del pedido:", { pedidoId, nuevoEstado, motivoCancelacion });
      const pedido = await ordersService.updateEstado(pedidoId, nuevoEstado, userId, motivoCancelacion, true);
      log.info("Estado del pedido actualizado exitosamente:", { pedidoId, nuevoEstado });
      revalidatePath("/admin/pedidos");
      revalidatePath(`/perfil/pedidos/${pedidoId}`);
      return deepSerialize({ success: true, pedido });
    } catch (error: any) {
      log.error("Error al actualizar estado del pedido:", { pedidoId, nuevoEstado, error: error?.message });
      if (error instanceof StockError) {
        return {
          error: error.message,
          outOfStockProducts: error.failedProducts,
        };
      }
      return { error: error?.message || "Error al actualizar el estado del pedido" };
    }
  });
}

/**
 * Elimina un pedido permanentemente de la base de datos (Solo Administradores).
 */
export async function deleteOrderAction(pedidoId: string) {
  return await withAdmin(async () => {
    try {
      log.info("Admin eliminando pedido:", { pedidoId });
      await ordersService.deletePedido(pedidoId);
      log.info("Pedido eliminado exitosamente:", { pedidoId });
      revalidatePath("/admin/pedidos");
      return deepSerialize({ success: true });
    } catch (error: any) {
      log.error("Error al eliminar pedido:", { pedidoId, error: error?.message });
      return { error: error?.message || "Error al eliminar el pedido" };
    }
  });
}

/**
 * Obtiene los pedidos del usuario autenticado.
 */
export async function getUserOrdersAction() {
  return await withAuth(async (session) => {
    const userId = session.user.id;

    log.debug("Obteniendo pedidos del usuario:", { userId });
    return await ordersService.getPedidosPorUsuario(userId);
  });
}

/**
 * Obtiene todos los pedidos de todos los usuarios de forma paginada y filtrada (Solo Administradores).
 */
export async function getPaginatedOrdersAction(params: {
  page: number;
  limit: number;
  estado?: PedidoEstado;
  search?: string;
}) {
  return await withAdmin(async () => {
    log.info("Admin obteniendo pedidos paginados y filtrados:", params);
    return await ordersService.getPaginatedPedidos(params);
  });
}

/**
 * Obtiene el conteo de pedidos por estado desde la base de datos (Solo Administradores).
 */
export async function getOrderStatusCountsAction() {
  return await withAdmin(async () => {
    log.info("Admin obteniendo conteo de estados de pedidos.");
    return await ordersService.getOrderStatusCounts();
  });
}

/**
 * Obtiene el detalle de un pedido específico.
 */
export async function getOrderDetailAction(pedidoId: string) {
  return await withAuth(async (session) => {
    const userId = session.user.id;
    const isAdmin = authService.isAdmin(session);
    
    log.debug("Obteniendo detalle del pedido:", { pedidoId, userId, isAdmin });
    const pedido = await ordersService.getPedidoDetallado(pedidoId);
    
    if (!pedido) {
      log.warn("Pedido no encontrado:", { pedidoId });
      return { error: "Pedido no encontrado" };
    }
    
    const isStoreOwner = userId
      ? await ordersService.belongsToStoreOwner(pedidoId, userId)
      : false;

    // Solo el dueño del pedido, un admin o el dueño de la tienda asociada pueden verlo
    if (pedido.usuarioId !== userId && !isAdmin && !isStoreOwner) {
      log.warn("Acceso denegado al detalle del pedido:", { pedidoId, userId, ownerUserId: pedido.usuarioId });
      return { error: "FORBIDDEN" };
    }

    return pedido;
  });
}

/**
 * Cancela un pedido del usuario autenticado (Solo si está en estado PENDIENTE).
 */
export async function cancelUserOrderAction(pedidoId: string) {
  return await withAuth(async (session) => {
    const userId = session.user.id;

    const pedido = await ordersService.getPedidoDetallado(pedidoId);
    if (!pedido) {
      log.warn("Intento de cancelar pedido inexistente:", { pedidoId, userId });
      return { error: "Pedido no encontrado" };
    }
    
    if (pedido.usuarioId !== userId) {
      log.warn("Intento de cancelar pedido ajeno:", { pedidoId, userId, ownerUserId: pedido.usuarioId });
      return { error: "No tienes permiso para cancelar este pedido" };
    }

    if (pedido.estado !== PedidoEstado.PENDIENTE) {
      log.warn("Intento de cancelar pedido en estado no permitido:", { pedidoId, estadoActual: pedido.estado });
      return { error: "Solo se pueden cancelar pedidos en estado Pendiente" };
    }

    try {
      log.info("Cancelando pedido del usuario:", { pedidoId, userId });
      const pedidoCancelado = await ordersService.updateEstado(
        pedidoId, 
        PedidoEstado.CANCELADO, 
        userId,
        "Cancelado por el usuario"
      );
      
      log.info("Pedido cancelado exitosamente:", { pedidoId });
      revalidatePath("/pedidos");
      revalidatePath(`/pedidos/${pedidoId}`);
      revalidatePath("/perfil/pedidos");
      
      return deepSerialize({ success: true, pedido: pedidoCancelado });
    } catch (error: any) {
      log.error("Error al cancelar pedido:", { pedidoId, error: error.message });
      return { error: error.message || "Error al cancelar el pedido" };
    }
  });
}

/**
 * Elimina un pedido del usuario autenticado (Solo si está en estado CANCELADO).
 */
export async function deleteUserOrderAction(pedidoId: string) {
  return await withAuth(async (session) => {
    const userId = session.user.id;

    const pedido = await ordersService.getPedidoDetallado(pedidoId);
    if (!pedido) {
      log.warn("Intento de eliminar pedido inexistente:", { pedidoId, userId });
      return { error: "Pedido no encontrado" };
    }
    
    if (pedido.usuarioId !== userId) {
      log.warn("Intento de eliminar pedido ajeno:", { pedidoId, userId, ownerUserId: pedido.usuarioId });
      return { error: "No tienes permiso para eliminar este pedido" };
    }

    if (pedido.estado !== PedidoEstado.CANCELADO) {
      log.warn("Intento de eliminar pedido en estado no permitido:", { pedidoId, estadoActual: pedido.estado });
      return { error: "Solo se pueden eliminar pedidos en estado Cancelado" };
    }

    try {
      log.info("Eliminando pedido del usuario:", { pedidoId, userId });
      await ordersService.deletePedido(pedidoId);
      
      log.info("Pedido eliminado exitosamente:", { pedidoId });
      revalidatePath("/pedidos");
      revalidatePath("/perfil/pedidos");
      
      return { success: true };
    } catch (error: any) {
      log.error("Error al eliminar pedido:", { pedidoId, error: error.message });
      return { error: error.message || "Error al eliminar el pedido" };
    }
  });
}

// --- Seller Actions ---

import { withStoreOwner } from "@/lib/auth-guards";

export async function getStoreOrdersAction(storeId: string, params: { page: number; limit: number; estado?: PedidoEstado; search?: string }) {
  return await withStoreOwner(storeId, async () => {
    log.info(`Action: getStoreOrdersAction`, { storeId, params });
    try {
      return deepSerialize(await ordersService.getPaginatedPedidos({ ...params, storeId }));
    } catch (error: any) {
      log.error("Error getting store orders:", error);
      return deepSerialize({ orders: [], totalCount: 0, totalPages: 0, page: params.page, limit: params.limit });
    }
  });
}

export async function getStoreOrderStatusCountsAction(storeId: string) {
  return await withStoreOwner(storeId, async () => {
    log.info(`Action: getStoreOrderStatusCountsAction`, { storeId });
    try {
      return await ordersService.getOrderStatusCounts(storeId);
    } catch (error: any) {
      log.error("Error getting store order status counts:", error);
      return {};
    }
  });
}

/**
 * Obtiene pedidos paginados Y conteo de estados en una sola llamada (paralelo en servidor).
 * Esto evita la serialización de Server Actions de Next.js.
 */
export async function getStoreOrdersWithCountsAction(
  storeId: string,
  params: { page: number; limit: number; estado?: PedidoEstado; search?: string }
) {
  return await withStoreOwner(storeId, async () => {
    log.info(`Action: getStoreOrdersWithCountsAction`, { storeId, params });
    try {
      const [ordersResult, statusCounts] = await Promise.all([
        ordersService.getPaginatedPedidos({ ...params, storeId }),
        ordersService.getOrderStatusCounts(storeId),
      ]);
      return deepSerialize({ ordersResult, statusCounts });
    } catch (error: any) {
      log.error("Error getting store orders with counts:", error);
      return deepSerialize({
        ordersResult: { orders: [], totalCount: 0, totalPages: 0, page: params.page, limit: params.limit },
        statusCounts: {},
      });
    }
  });
}

export async function updateStoreOrderStatusAction(
  storeId: string,
  pedidoId: string,
  nuevoEstado: PedidoEstado,
  motivoCancelacion?: string
) {
  return await withStoreOwner(storeId, async (session) => {
    try {
      const userId = session.user.id;

      log.info("Seller actualizando estado de pedido de tienda:", { storeId, pedidoId, nuevoEstado });
      const pedido = await ordersService.updateEstadoForStore(storeId, pedidoId, nuevoEstado, userId, motivoCancelacion);
      log.info("Estado del pedido de tienda actualizado exitosamente:", { storeId, pedidoId, nuevoEstado });
      revalidatePath("/mi-tienda");
      revalidatePath("/admin/pedidos");
      revalidatePath(`/pedidos/${pedidoId}`);
      return deepSerialize({ success: true, pedido });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al actualizar el estado del pedido";
      log.error("Error al actualizar estado del pedido de tienda:", { storeId, pedidoId, nuevoEstado, error: message });
      if (error instanceof StockError) {
        return { error: error.message, outOfStockProducts: error.failedProducts };
      }
      return { error: message };
    }
  });
}

/**
 * Datos combinados del dashboard del vendedor: conversaciones + pedidos + conteos
 * en UNA sola Server Action. Reemplaza 3 llamadas secuenciales del cliente.
 */
export async function getSellerDashboardDataAction(
  storeId: string,
  params: { page: number; limit: number; estado?: PedidoEstado; search?: string }
) {
  return await withStoreOwner(storeId, async (session) => {
    log.info(`Action: getSellerDashboardDataAction`, { storeId, params });
    try {
      const userId = session.user.id;
      const userRole = session.user.role as Role;

      const [ordersResult, statusCounts, conversations] = await Promise.all([
        ordersService.getPaginatedPedidos({ ...params, storeId }),
        ordersService.getOrderStatusCounts(storeId),
        chatService.getSellerOrderConversations(storeId, userId, userRole),
      ]);

      return deepSerialize({ ordersResult, statusCounts, conversations });
    } catch (error: any) {
      log.error("Error getting seller dashboard data:", error);
      return deepSerialize({
        ordersResult: { orders: [], totalCount: 0, totalPages: 0, page: params.page, limit: params.limit },
        statusCounts: {},
        conversations: [],
      });
    }
  });
}

/**
 * Calcula los impuestos totales para un carrito de compras.
 */
export async function calculateCartTaxesAction(cartItems: { storeId: string; subtotal: number }[]) {
  try {
    let totalTaxes = 0;
    
    // Group subtotals by store
    const storeSubtotals = cartItems.reduce((acc, item) => {
      acc[item.storeId] = (acc[item.storeId] || 0) + item.subtotal;
      return acc;
    }, {} as Record<string, number>);

    // Fetch active taxes for each store and calculate
    const { storeTaxService } = await import("@/backend/modules/store");
    
    for (const [storeId, subtotal] of Object.entries(storeSubtotals)) {
      const activeTaxes = await storeTaxService.getTaxesByStoreId(storeId);
      const totalTaxPercentage = activeTaxes
        .filter((t: any) => t.isActive)
        .reduce((sum: number, t: any) => sum + Number(t.percentage), 0);
      
      totalTaxes += subtotal * (totalTaxPercentage / 100);
    }
    
    return { success: true, taxes: totalTaxes };
  } catch (error: any) {
    log.error("Error calculating cart taxes:", error);
    return { success: false, taxes: 0 };
  }
}

export async function removeProductFromOrderAction(
  storeId: string,
  pedidoId: string,
  detalleId: string
) {
  return await withStoreOwner(storeId, async (session) => {
    try {
      const userId = session.user.id;
      log.info("Retirando producto del pedido:", { storeId, pedidoId, detalleId });
      const pedido = await ordersService.removeProductFromOrder(storeId, pedidoId, detalleId, userId);
      revalidatePath("/mi-tienda");
      revalidatePath(`/pedidos/${pedidoId}`);
      return deepSerialize({ success: true, pedido });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al retirar producto del pedido";
      log.error("Error removing product from order:", { storeId, pedidoId, detalleId, error: message });
      return { error: message };
    }
  });
}

