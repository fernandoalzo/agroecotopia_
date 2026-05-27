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
 * High-Order Function (Guard) to protect Seller Actions.
 * Ensures the user has the 'seller' role before executing the logic.
 */
export async function withSeller<T>(action: () => Promise<T>): Promise<T | { error: string }> {
  log.debug("Seller Guard: Verificando permisos de vendedor.");
  try {
    const session = await authService.ensureRole("seller");
    log.debug("Seller Guard: Acceso autorizado como vendedor.", { userId: session.user?.id });
    return await action();
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      log.warn("Seller Guard: Intento de acceso sin sesión.");
      return { error: "Debes iniciar sesión para realizar esta acción." };
    }
    if (error.message === "FORBIDDEN") {
      log.warn("Seller Guard: Acceso denegado (rol de vendedor requerido).");
      return { error: "Acceso denegado: Se requieren permisos de vendedor." };
    }
    log.error("Seller Guard Error inesperado:", error);
    return { error: "Ocurrió un error inesperado al verificar permisos." };
  }
}

/**
 * High-Order Function (Guard) to protect Admin or Seller Actions.
 */
export async function withAdminOrSeller<T>(action: () => Promise<T>): Promise<T | { error: string }> {
  log.debug("Admin/Seller Guard: Verificando permisos de admin o vendedor.");
  try {
    const session = await authService.ensureAnyRole(["admin", "seller"]);
    log.debug("Admin/Seller Guard: Acceso autorizado.", { userId: session.user?.id });
    return await action();
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      log.warn("Admin/Seller Guard: Intento de acceso sin sesión.");
      return { error: "Debes iniciar sesión para realizar esta acción." };
    }
    if (error.message === "FORBIDDEN") {
      log.warn("Admin/Seller Guard: Acceso denegado.");
      return { error: "Acceso denegado: Se requieren permisos de administrador o vendedor." };
    }
    log.error("Admin/Seller Guard Error inesperado:", error);
    return { error: "Ocurrió un error inesperado al verificar permisos." };
  }
}

/**
 * High-Order Function (Guard) to protect Store-specific Actions.
 * Ensures the user is the owner of the store or an admin.
 */
export async function withStoreOwner<T>(storeId: string, action: () => Promise<T>): Promise<T | { error: string }> {
  log.debug("StoreOwner Guard: Verificando propiedad de la tienda.", { storeId });
  try {
    const session = await authService.ensureAnyRole(["admin", "seller"]);
    
    // If admin, they can manage any store
    if (session.user.role === "admin") {
      return await action();
    }

    // Dynamic import to avoid circular dependencies if any
    const { storeService } = await import("@/backend/modules/store");
    const store = await storeService.getStoreById(storeId);
    
    if (store.ownerId !== session.user.id) {
      log.warn("StoreOwner Guard: Intento de acceso a tienda ajena.", { storeId, userId: session.user.id });
      return { error: "Acceso denegado: No eres el propietario de esta tienda." };
    }

    log.debug("StoreOwner Guard: Acceso autorizado a tienda.", { storeId, userId: session.user.id });
    return await action();
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { error: "Debes iniciar sesión para realizar esta acción." };
    }
    if (error.message === "FORBIDDEN") {
      return { error: "Acceso denegado: Se requieren permisos." };
    }
    if (error.message === "Tienda no encontrada.") {
      return { error: "La tienda especificada no existe." };
    }
    log.error("StoreOwner Guard Error inesperado:", error);
    return { error: "Ocurrió un error inesperado al verificar permisos de la tienda." };
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
