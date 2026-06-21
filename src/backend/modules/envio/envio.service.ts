import { EnvioRepository } from "./envio.repository";
import { EnvioEstado, PedidoEstado } from "@/types";
import logger from "@/utils/logger";
import { deepSerialize } from "@/lib/serialize";
import eventBus from "@/utils/eventBus";
import { stockGuardianService } from "@/backend/modules/stockGuardian";

const log = logger.child("src/backend/modules/envio/envio.service.ts");

const VALID_ENVIO_TRANSITIONS: Record<EnvioEstado, EnvioEstado[]> = {
  [EnvioEstado.PREPARANDO]: [EnvioEstado.DESPACHADO, EnvioEstado.ENTREGADO, EnvioEstado.FALLIDO],
  [EnvioEstado.DESPACHADO]: [EnvioEstado.EN_TRANSITO, EnvioEstado.ENTREGADO, EnvioEstado.FALLIDO, EnvioEstado.DEVUELTO],
  [EnvioEstado.EN_TRANSITO]: [EnvioEstado.EN_REPARTO, EnvioEstado.ENTREGADO, EnvioEstado.FALLIDO, EnvioEstado.DEVUELTO],
  [EnvioEstado.EN_REPARTO]: [EnvioEstado.ENTREGADO, EnvioEstado.FALLIDO, EnvioEstado.DEVUELTO],
  [EnvioEstado.ENTREGADO]: [],
  [EnvioEstado.FALLIDO]: [EnvioEstado.EN_REPARTO, EnvioEstado.DEVUELTO],
  [EnvioEstado.DEVUELTO]: [],
};

export class EnvioService {
  constructor(private envioRepository: EnvioRepository) {}

  private generarNumeroGuia(): string {
    const prefix = "AGRO";
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${rand}`;
  }

  async createEnvioFromPedido(pedido: any, tx: any) {
    if (pedido.tipoEntrega !== "ENVIO") {
      log.debug("Pedido no es de tipo ENVIO, saltando creación de envío:", {
        pedidoId: pedido.id,
        tipoEntrega: pedido.tipoEntrega,
      });
      return null;
    }

    const storeId = pedido.detalles?.[0]?.storeId;
    if (!storeId) {
      log.warn("No se pudo determinar storeId del pedido para crear envío:", {
        pedidoId: pedido.id,
      });
      return null;
    }

    log.info("Creando registro de envío para pedido confirmado:", {
      pedidoId: pedido.id,
      storeId,
    });

    const envio = await this.envioRepository.create(
      {
        pedido: { connect: { id: pedido.id } },
        store: { connect: { id: storeId } },
        numeroGuia: this.generarNumeroGuia(),
        estado: EnvioEstado.PREPARANDO,
        direccionEntrega: pedido.direccionEntrega || "",
        destinatarioNombre: pedido.usuario?.name || null,
        instruccionesEntrega: pedido.notasCliente || null,
        fechaEstimadaEntrega: pedido.fechaEntregaEstimada || null,
        eventos: {
          create: {
            estado: EnvioEstado.PREPARANDO,
            descripcion: "Envío registrado y en preparación",
          },
        },
      },
      tx
    );

    log.info("Envío creado exitosamente:", {
      envioId: envio.id,
      numeroGuia: envio.numeroGuia,
      pedidoId: pedido.id,
    });

    eventBus.emit("envio:created", {
      envioId: envio.id,
      storeId,
      pedidoId: pedido.id,
    });

    return envio;
  }

  async updateEstado(
    envioId: string,
    nuevoEstado: EnvioEstado,
    actorId: string,
    extra?: { ubicacion?: string; descripcion?: string; transportadora?: string; bodegaId?: string }
  ) {
    log.info("Actualizando estado de envío:", { envioId, nuevoEstado, actorId });

    return await this.envioRepository.executeTransaction(async (tx) => {
      const envio = await this.envioRepository.findById(envioId, tx);
      if (!envio) {
        log.error("Envío no encontrado:", { envioId });
        throw new Error("Envío no encontrado");
      }

      const fromEstado = envio.estado;

      const transicionesValidas = VALID_ENVIO_TRANSITIONS[fromEstado as EnvioEstado] || [];
      if (fromEstado !== nuevoEstado && !transicionesValidas.includes(nuevoEstado)) {
        log.warn("Transición de estado de envío inválida:", {
          envioId,
          de: fromEstado,
          a: nuevoEstado,
          permitidas: transicionesValidas,
        });
        throw new Error(`Transición de estado no permitida: ${fromEstado} → ${nuevoEstado}`);
      }

      if (fromEstado === nuevoEstado) {
        log.debug("Transición idempotente: el envío ya está en el estado destino:", {
          envioId,
          estado: nuevoEstado,
        });
        return envio;
      }

      const fechaMap: Record<string, keyof typeof envio> = {
        DESPACHADO: "fechaDespacho",
        EN_TRANSITO: "fechaTransito",
        EN_REPARTO: "fechaReparto",
        ENTREGADO: "fechaEntrega",
      };
      const fechaField = fechaMap[nuevoEstado];
      const extraData: any = { estado: nuevoEstado };
      if (fechaField) extraData[fechaField] = new Date();
      if (extra?.transportadora) extraData.transportadora = extra.transportadora;

      const transitioned = await this.envioRepository.tryTransitionEstado(
        envioId,
        fromEstado,
        nuevoEstado,
        extraData,
        tx
      );

      if (!transitioned) {
        log.warn("Transición fallida (race condition) para envío:", { envioId });
        const current = await this.envioRepository.findById(envioId, tx);
        return current;
      }

      log.info("Estado de envío actualizado:", {
        envioId,
        de: fromEstado,
        a: nuevoEstado,
      });

      await this.envioRepository.createEvento(
        {
          envio: { connect: { id: envioId } },
          estado: nuevoEstado,
          ubicacion: extra?.ubicacion || null,
          descripcion:
            extra?.descripcion || `Estado actualizado a: ${nuevoEstado}`,
        },
        tx
      );

      eventBus.emit("envio:status_updated", {
        envioId,
        pedidoId: envio.pedidoId,
        estadoAnterior: fromEstado,
        estadoNuevo: nuevoEstado,
      });

      // ─── Sincronización con Pedido ───
      const pedido = await tx.pedido.findUnique({
        where: { id: envio.pedidoId },
        include: { detalles: true }
      });

      if (!pedido) {
        log.error("Pedido asociado no encontrado:", { pedidoId: envio.pedidoId });
        const updatedEnvio = await this.envioRepository.findById(envioId, tx);
        return this.serializeEnvio(updatedEnvio);
      }

      let orderStatusChanged = false;
      let nuevoEstadoPedido: PedidoEstado | null = null;

      // Sincronizar Pedido cuando el envío entra en ruta (DESPACHADO, EN_TRANSITO, EN_REPARTO)
      if (([EnvioEstado.DESPACHADO, EnvioEstado.EN_TRANSITO, EnvioEstado.EN_REPARTO] as EnvioEstado[]).includes(nuevoEstado) && pedido.estado !== PedidoEstado.EN_CAMINO && pedido.estado !== PedidoEstado.CANCELADO && pedido.estado !== PedidoEstado.ENTREGADO) {
        log.info("Sincronizando pedido como EN_CAMINO:", { pedidoId: envio.pedidoId, estadoEnvio: nuevoEstado });
        await tx.pedido.update({
          where: { id: envio.pedidoId },
          data: { estado: PedidoEstado.EN_CAMINO },
        });
        orderStatusChanged = true;
        nuevoEstadoPedido = PedidoEstado.EN_CAMINO;
      }

      // Sincronizar Pedido cuando el envío se marca como ENTREGADO
      if (nuevoEstado === EnvioEstado.ENTREGADO && pedido.estado !== PedidoEstado.ENTREGADO && pedido.estado !== PedidoEstado.CANCELADO) {
        log.info("Sincronizando pedido como ENTREGADO:", { pedidoId: envio.pedidoId });
        await tx.pedido.update({
          where: { id: envio.pedidoId },
          data: {
            estado: PedidoEstado.ENTREGADO,
            fechaEntregaReal: new Date(),
          },
        });
        orderStatusChanged = true;
        nuevoEstadoPedido = PedidoEstado.ENTREGADO;
      }

      // Sincronizar Pedido cuando el envío falla o es devuelto -> Mover a EN_BODEGA
      if ((nuevoEstado === EnvioEstado.FALLIDO || nuevoEstado === EnvioEstado.DEVUELTO) && pedido.estado !== PedidoEstado.EN_BODEGA) {
        log.info("Sincronizando pedido como EN_BODEGA (Envío fallido o devuelto):", { pedidoId: envio.pedidoId, estadoEnvio: nuevoEstado });
        const dataToUpdate: any = { estado: PedidoEstado.EN_BODEGA };
        if (extra?.bodegaId) {
          dataToUpdate.bodegaId = extra.bodegaId;
        }
        await tx.pedido.update({
          where: { id: envio.pedidoId },
          data: dataToUpdate,
        });
        
        orderStatusChanged = true;
        nuevoEstadoPedido = PedidoEstado.EN_BODEGA;
      }

      if (orderStatusChanged && nuevoEstadoPedido) {
        log.info("Emitting order:status_updated from envio:", { pedidoId: envio.pedidoId, nuevoEstadoPedido, usuarioId: pedido.usuarioId });
        eventBus.emit("order:status_updated", {
          pedidoId: envio.pedidoId,
          estado: nuevoEstadoPedido,
          usuarioId: pedido.usuarioId,
        });
      }

      const updated = await this.envioRepository.findById(envioId, tx);
      return this.serializeEnvio(updated);
    });
  }

  async getEnviosByStore(storeId: string, params: any) {
    log.debug("Obteniendo envíos por tienda:", { storeId, params });
    const result = await this.envioRepository.findByStoreId(storeId, params);
    return {
      ...result,
      envios: result.envios.map((e: any) => this.serializeEnvio(e)),
    };
  }

  async getEnvioDetallado(envioId: string) {
    log.debug("Obteniendo detalle de envío:", { envioId });
    const envio = await this.envioRepository.findById(envioId);
    return envio ? this.serializeEnvio(envio) : null;
  }

  async getEnvioStats(storeId?: string) {
    log.debug("Obteniendo estadísticas de envíos:", { storeId });
    return await this.envioRepository.getStatusCounts(storeId);
  }

  async getAllEnvios(params: any) {
    log.debug("Obteniendo todos los envíos (admin):", params);
    const result = await this.envioRepository.findAllPaginated(params);
    return {
      ...result,
      envios: result.envios.map((e: any) => this.serializeEnvio(e)),
    };
  }

  private serializeEnvio(envio: any) {
    if (!envio) return envio;
    const serialized: any = {
      ...envio,
      pedido: envio.pedido
        ? {
            ...envio.pedido,
            total: envio.pedido.total ? Number(envio.pedido.total) : undefined,
            subtotal: envio.pedido.subtotal ? Number(envio.pedido.subtotal) : undefined,
            impuestos: envio.pedido.impuestos ? Number(envio.pedido.impuestos) : undefined,
            costoEnvio: envio.pedido.costoEnvio ? Number(envio.pedido.costoEnvio) : undefined,
            detalles: envio.pedido.detalles?.map((d: any) => ({
              ...d,
              cantidad: Number(d.cantidad),
              precioUnitario: Number(d.precioUnitario),
              subtotal: Number(d.subtotal),
              producto: d.producto
                ? {
                    ...d.producto,
                    price: Number(d.producto.price),
                    stock: Number(d.producto.stock),
                    peso: d.producto.peso ? Number(d.producto.peso) : undefined,
                  }
                : d.producto,
            })),
          }
        : envio.pedido,
    };
    return serialized;
  }
}
