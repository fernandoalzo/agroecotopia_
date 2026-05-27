"use server";

import { ordersService } from "./index";
import { authService } from "@/backend/modules/auth";
import { withAuth, withAdmin } from "@/lib/auth-guards";
import { PedidoEstado } from "@prisma/client";
import { revalidatePath } from "next/cache";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/orders/orders.actions.ts");

/**
 * Crea un nuevo pedido para el usuario autenticado.
 */
export async function placeOrderAction(data: {
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
  return await withAuth(async () => {
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("UNAUTHORIZED");

    log.info("Creando nuevo pedido para el usuario:", { userId, metodoPago: data.metodoPago, cantidadItems: data.detalles.length });
    const pedidos = await ordersService.createPedido({
      ...data,
      usuarioId: userId,
    });
    const pedidoIds = pedidos.map((pedido) => pedido.id);
    const primaryPedidoId = pedidoIds[0];

    log.info("Pedido creado exitosamente:", { pedidoIds, userId });
    revalidatePath("/perfil/pedidos");
    return { success: true, pedidoId: primaryPedidoId, pedidoIds };
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
  return await withAdmin(async () => {
    try {
      log.info("Admin actualizando estado del pedido:", { pedidoId, nuevoEstado, motivoCancelacion });
      const pedido = await ordersService.updateEstado(pedidoId, nuevoEstado, motivoCancelacion);
      log.info("Estado del pedido actualizado exitosamente:", { pedidoId, nuevoEstado });
      revalidatePath("/admin/pedidos");
      revalidatePath(`/perfil/pedidos/${pedidoId}`);
      return { success: true, pedido };
    } catch (error: any) {
      log.error("Error al actualizar estado del pedido:", { pedidoId, nuevoEstado, error: error.message });
      return { error: error.message || "Error al actualizar el estado del pedido" };
    }
  });
}

/**
 * Obtiene los pedidos del usuario autenticado.
 */
export async function getUserOrdersAction() {
  return await withAuth(async () => {
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("UNAUTHORIZED");

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
  return await withAuth(async () => {
    const session = await authService.getSession();
    const userId = session?.user?.id ?? null;
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
  return await withAuth(async () => {
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("UNAUTHORIZED");

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
        "Cancelado por el usuario"
      );
      
      log.info("Pedido cancelado exitosamente:", { pedidoId });
      revalidatePath("/pedidos");
      revalidatePath(`/pedidos/${pedidoId}`);
      revalidatePath("/perfil/pedidos");
      
      return { success: true, pedido: pedidoCancelado };
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
  return await withAuth(async () => {
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("UNAUTHORIZED");

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
      return await ordersService.getPaginatedPedidos({ ...params, storeId });
    } catch (error: any) {
      log.error("Error getting store orders:", error);
      return { orders: [], totalCount: 0, totalPages: 0, page: params.page, limit: params.limit };
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

export async function updateStoreOrderStatusAction(
  storeId: string,
  pedidoId: string,
  nuevoEstado: PedidoEstado,
  motivoCancelacion?: string
) {
  return await withStoreOwner(storeId, async () => {
    try {
      log.info("Seller actualizando estado de pedido de tienda:", { storeId, pedidoId, nuevoEstado });
      const pedido = await ordersService.updateEstadoForStore(storeId, pedidoId, nuevoEstado, motivoCancelacion);
      log.info("Estado del pedido de tienda actualizado exitosamente:", { storeId, pedidoId, nuevoEstado });
      revalidatePath("/mi-tienda");
      revalidatePath("/admin/pedidos");
      revalidatePath(`/pedidos/${pedidoId}`);
      return { success: true, pedido };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al actualizar el estado del pedido";
      log.error("Error al actualizar estado del pedido de tienda:", { storeId, pedidoId, nuevoEstado, error: message });
      return { error: message };
    }
  });
}
