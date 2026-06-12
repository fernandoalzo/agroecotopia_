"use server";

import { envioService } from "./index";
import { withStoreOwner } from "@/lib/auth-guards";
import { EnvioEstado } from "@prisma/client";
import { revalidatePath } from "next/cache";
import logger from "@/utils/logger";
import { deepSerialize } from "@/lib/serialize";

const log = logger.child("src/backend/modules/envio/envio.actions.ts");

export async function updateEnvioEstadoAction(
  storeId: string,
  envioId: string,
  nuevoEstado: EnvioEstado,
  extra?: { ubicacion?: string; descripcion?: string; transportadora?: string }
) {
  return await withStoreOwner(storeId, async (session) => {
    try {
      log.info("Actualizando estado de envío:", { storeId, envioId, nuevoEstado });
      const envio = await envioService.updateEstado(
        envioId,
        nuevoEstado,
        session.user.id,
        extra
      );
      revalidatePath("/mi-tienda");
      return deepSerialize({ success: true, envio });
    } catch (error: any) {
      log.error("Error al actualizar estado de envío:", {
        envioId,
        nuevoEstado,
        error: error.message,
      });
      return { error: error.message || "Error al actualizar estado del envío" };
    }
  });
}

export async function getEnviosByStoreAction(
  storeId: string,
  params: { page: number; limit: number; estado?: EnvioEstado; search?: string }
) {
  return await withStoreOwner(storeId, async () => {
    try {
      log.info("Obteniendo envíos de tienda:", { storeId, params });
      return deepSerialize(await envioService.getEnviosByStore(storeId, params));
    } catch (error: any) {
      log.error("Error obteniendo envíos:", error);
      return {
        envios: [],
        totalCount: 0,
        totalPages: 0,
        page: params.page,
        limit: params.limit,
      };
    }
  });
}

export async function getEnviosWithCountsAction(
  storeId: string,
  params: { page: number; limit: number; estado?: EnvioEstado; search?: string }
) {
  return await withStoreOwner(storeId, async () => {
    try {
      log.info("Obteniendo envíos con conteos:", { storeId, params });
      const [enviosResult, stats] = await Promise.all([
        envioService.getEnviosByStore(storeId, params),
        envioService.getEnvioStats(storeId),
      ]);
      return deepSerialize({ enviosResult, stats });
    } catch (error: any) {
      log.error("Error obteniendo envíos con conteos:", error);
      return {
        enviosResult: {
          envios: [],
          totalCount: 0,
          totalPages: 0,
          page: params.page,
          limit: params.limit,
        },
        stats: {},
      };
    }
  });
}

export async function getEnvioStatsAction(storeId: string) {
  return await withStoreOwner(storeId, async () => {
    try {
      log.info("Obteniendo estadísticas de envíos:", { storeId });
      return await envioService.getEnvioStats(storeId);
    } catch {
      return {};
    }
  });
}

export async function getEnvioDetailAction(envioId: string) {
  try {
    log.debug("Obteniendo detalle de envío:", { envioId });
    return deepSerialize(await envioService.getEnvioDetallado(envioId));
  } catch {
    return null;
  }
}

// --- Admin Actions ---

import { withAdmin } from "@/lib/auth-guards";

export async function adminGetAllEnviosAction(
  params: { page: number; limit: number; estado?: EnvioEstado; search?: string }
) {
  return await withAdmin(async () => {
    try {
      const { envioRepository } = await import("./index");
      return deepSerialize(await envioRepository.findAllPaginated(params));
    } catch (error: any) {
      log.error("Error obteniendo envíos (admin):", error);
      return { envios: [], totalCount: 0, totalPages: 0, page: params.page, limit: params.limit };
    }
  });
}

export async function adminGetEnvioCountsAction() {
  return await withAdmin(async () => {
    try {
      const { envioRepository } = await import("./index");
      return await envioRepository.getStatusCounts();
    } catch {
      return {};
    }
  });
}
