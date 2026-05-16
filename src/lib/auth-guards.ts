import { authService } from "@/backend/modules/auth";

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
  try {
    await authService.ensureAuthenticated();
    return await action();
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { error: "Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente." };
    }
    console.error("Auth Guard Error:", error);
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
  try {
    await authService.ensureRole("admin");
    return await action();
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { error: "Debes iniciar sesión para realizar esta acción." };
    }
    if (error.message === "FORBIDDEN") {
      return { error: "Acceso denegado: Se requieren permisos de administrador." };
    }
    console.error("Admin Guard Error:", error);
    return { error: "Ocurrió un error inesperado al verificar permisos." };
  }
}

/**
 * Utility to validate JWT/Session expiration explicitly.
 * Can be called from anywhere to confirm connectivity/session health.
 */
export async function validateSessionHealth() {
  try {
    const session = await authService.me();
    return !!session;
  } catch {
    return false;
  }
}
