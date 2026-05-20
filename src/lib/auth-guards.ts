import { authService } from "@/backend/modules/auth";
import logger from "@/utils/logger";

const log = logger.child("src/lib/auth-guards.ts");

/**
 * High-Order Function (Guard) to protect Server Actions.
 * Ensures the user is authenticated before executing the logic.
 * 
 * Usage:
 * export const myAction = (formData: FormData) => withAuth(async () => {
 *   // Secure logic here
 * });
 */
export async function withAuth<T>(action: () => Promise<T>): Promise<T | { error: string }> {
  log.debug("Auth Guard: Verificando sesión de usuario.");
  try {
    const session = await authService.ensureAuthenticated();
    log.debug("Auth Guard: Usuario autenticado exitosamente.", { userId: session.user?.id });
    return await action();
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      log.warn("Auth Guard: Intento de acceso no autorizado (sesión expirada o ausente).");
      return { error: "Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente." };
    }
    log.error("Auth Guard Error inesperado:", error);
    return { error: "Ocurrió un error inesperado de autenticación." };
  }
}

/**
 * High-Order Function (Guard) to protect Administrative Actions.
 * Ensures the user is an administrator before executing the logic.
 * 
 * Usage:
 * export const adminOnlyAction = (id: string) => withAdmin(async () => {
 *   // Admin logic here
 * });
 */
export async function withAdmin<T>(action: () => Promise<T>): Promise<T | { error: string }> {
  log.debug("Admin Guard: Verificando permisos de administrador.");
  try {
    const session = await authService.ensureRole("admin");
    log.debug("Admin Guard: Acceso autorizado como administrador.", { userId: session.user?.id });
    return await action();
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      log.warn("Admin Guard: Intento de acceso administrativo sin sesión.");
      return { error: "Debes iniciar sesión para realizar esta acción." };
    }
    if (error.message === "FORBIDDEN") {
      log.warn("Admin Guard: Acceso denegado (rol de administrador requerido).");
      return { error: "Acceso denegado: Se requieren permisos de administrador." };
    }
    log.error("Admin Guard Error inesperado:", error);
    return { error: "Ocurrió un error inesperado al verificar permisos." };
  }
}

/**
 * Utility to validate JWT/Session expiration explicitly.
 * Can be called from anywhere to confirm connectivity/session health.
 */
export async function validateSessionHealth() {
  log.debug("Verificando estado de salud de la sesión.");
  try {
    const session = await authService.me();
    const isAlive = !!session;
    log.debug("Estado de salud de la sesión:", { isAlive, email: session?.email });
    return isAlive;
  } catch (error: any) {
    log.error("Error al verificar estado de salud de la sesión:", error);
    return false;
  }
}
