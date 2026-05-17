"use server";

import { ordersService } from "./index";
import { authService } from "@/backend/modules/auth";
import { withAuth, withAdmin } from "@/lib/auth-guards";
import { PedidoEstado } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Crea un nuevo pedido para el usuario autenticado.
 */
export async function placeOrderAction(data: {
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
  return await withAuth(async () => {
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("UNAUTHORIZED");

    const pedido = await ordersService.createPedido({
      ...data,
      usuarioId: userId,
    });

    revalidatePath("/perfil/pedidos");
    return { success: true, pedidoId: pedido.id };
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
      const pedido = await ordersService.updateEstado(pedidoId, nuevoEstado, motivoCancelacion);
      revalidatePath("/admin/pedidos");
      revalidatePath(`/perfil/pedidos/${pedidoId}`);
      return { success: true, pedido };
    } catch (error: any) {
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

    return await ordersService.getPedidosPorUsuario(userId);
  });
}

/**
 * Obtiene el detalle de un pedido específico.
 */
export async function getOrderDetailAction(pedidoId: string) {
  return await withAuth(async () => {
    const userId = await authService.getCurrentUserId();
    const isAdmin = await authService.isAdmin(await authService.getSession());
    
    const pedido = await ordersService.getPedidoDetallado(pedidoId);
    
    if (!pedido) return { error: "Pedido no encontrado" };
    
    // Solo el dueño del pedido o un admin pueden verlo
    if (pedido.usuarioId !== userId && !isAdmin) {
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
    if (!pedido) return { error: "Pedido no encontrado" };
    
    if (pedido.usuarioId !== userId) {
      return { error: "No tienes permiso para cancelar este pedido" };
    }

    if (pedido.estado !== PedidoEstado.PENDIENTE) {
      return { error: "Solo se pueden cancelar pedidos en estado Pendiente" };
    }

    try {
      const pedidoCancelado = await ordersService.updateEstado(
        pedidoId, 
        PedidoEstado.CANCELADO, 
        "Cancelado por el usuario"
      );
      
      revalidatePath("/pedidos");
      revalidatePath(`/pedidos/${pedidoId}`);
      revalidatePath("/perfil/pedidos");
      
      return { success: true, pedido: pedidoCancelado };
    } catch (error: any) {
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
    if (!pedido) return { error: "Pedido no encontrado" };
    
    if (pedido.usuarioId !== userId) {
      return { error: "No tienes permiso para eliminar este pedido" };
    }

    if (pedido.estado !== PedidoEstado.CANCELADO) {
      return { error: "Solo se pueden eliminar pedidos en estado Cancelado" };
    }

    try {
      await ordersService.deletePedido(pedidoId);
      
      revalidatePath("/pedidos");
      revalidatePath("/perfil/pedidos");
      
      return { success: true };
    } catch (error: any) {
      return { error: error.message || "Error al eliminar el pedido" };
    }
  });
}
