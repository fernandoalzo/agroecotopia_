"use server";

import { paymentsService } from "./payments.service";
import { ordersService } from "@/backend/modules/orders";
import { authService } from "@/backend/modules/auth";
import { withAuth } from "@/lib/auth-guards";

export async function createMercadoPagoPreferenceAction(pedidoId: string) {
  return await withAuth(async () => {
    const userId = await authService.getCurrentUserId();
    if (!userId) throw new Error("UNAUTHORIZED");

    const session = await authService.getSession();
    const userName = session?.user?.name || "Usuario";
    const userEmail = session?.user?.email || "correo@ejemplo.com";

    // 1. Obtener pedido
    const pedido = await ordersService.getPedidoDetallado(pedidoId);
    if (!pedido) return { error: "Pedido no encontrado" };

    if (pedido.usuarioId !== userId) {
      return { error: "No tienes permiso para pagar este pedido" };
    }

    // 2. Mapear detalles a items de MercadoPago
    const items = pedido.detalles.map((detalle: any) => ({
      id: detalle.productoId,
      title: detalle.producto?.name || "Producto",
      quantity: detalle.cantidad,
      unit_price: detalle.precioUnitario,
    }));

    // 3. Agregar costo de envío si existe
    if (pedido.costoEnvio > 0) {
      items.push({
        id: "envio",
        title: "Costo de Envío",
        quantity: 1,
        unit_price: pedido.costoEnvio,
      });
    }

    // 4. Crear preferencia
    try {
      const preference = await paymentsService.createPreference(
        pedido.id,
        items,
        { name: userName, email: userEmail }
      );

      // 5. Guardar preference ID en el pedido
      if (preference.id) {
        await ordersService.updatePedido(pedido.id, {
          mercadopagoPreferenceId: preference.id,
        } as any);
      }

      // Devolver la URL de inicio para redirigir al usuario
      return { success: true, initPoint: preference.init_point };
    } catch (error: any) {
      return { error: error.message || "Error al crear pago" };
    }
  });
}
