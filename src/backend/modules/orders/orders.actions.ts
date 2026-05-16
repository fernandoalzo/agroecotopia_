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
