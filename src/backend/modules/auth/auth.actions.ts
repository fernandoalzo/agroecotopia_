"use server";

import { signIn, signOut } from "@/utils/auth";
import { AuthError } from "next-auth";
import { authService } from "@/backend/modules/auth";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth.schema";
import logger from "@/utils/logger";
import { headers } from "next/headers";
import { authRateLimiter } from "@/lib/rate-limit";
import { anomalyDetector } from "@/lib/anomaly-detector";

const log = logger.child("src/backend/modules/auth/auth.actions.ts");

/**
 * Server Action: Sign in with a provider.
 * Defaults to Google but accepts any configured provider ID.
 */
export async function signInAction(provider: string = "google") {
  log.info(`Iniciando signIn con proveedor: ${provider}`);
  await signIn(provider);
}

/**
 * Server Action: Sign out the current user.
 * Redirects to the home page after sign out.
 */
export async function signOutAction() {
  log.info("Cerrando sesión del usuario actual...");
  await signOut({ redirectTo: "/" });
}

/**
 * Server Action: Sign in with Email and Password credentials
 */
export async function credentialsSignInAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown_ip";
    await authRateLimiter.consume(ip);
  } catch (rejRes) {
    log.warn("Rate limit excedido para inicio de sesión:", { ip: data.email });
    return { error: "Demasiados intentos. Por favor, inténtalo de nuevo en 1 minuto." };
  }

  // 1. Validate with Zod
  const validatedFields = LoginSchema.safeParse(data);

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0].message;
    log.warn("Validación de login fallida:", { error: firstError });
    return { error: firstError };
  }

  const { email, password } = validatedFields.data;

  // ── Anomaly detection ────────────────────────────────
  const headersList = await headers();
  const clientIp = headersList.get("x-forwarded-for") || "unknown_ip";
  const userAgent = headersList.get("user-agent") || "";

  const user = await authService.verifyCredentials(email, password);
  if (!user) {
    log.warn("Credenciales inválidas para:", { email });
    return { error: "Credenciales inválidas" };
  }

  const assessment = await anomalyDetector.assess(user.id, email, {
    ip: clientIp,
    userAgent,
    timestamp: Date.now(),
  });

  if (assessment.action === "BLOCK") {
    log.warn("Login bloqueado por anomalía:", {
      email,
      score: assessment.score.toFixed(3),
      signals: assessment.signals.filter((s) => s.score > 0).length,
    });
    return { error: "Acceso bloqueado por seguridad. Revisa tu correo electrónico." };
  }

  if (assessment.action === "SUSPECT") {
    log.warn("Login sospechoso — permitido (monitoreo):", {
      email,
      score: assessment.score.toFixed(3),
      ip: clientIp,
    });
  }
  // ─────────────────────────────────────────────────────

  try {
    log.info("Intentando inicio de sesión con credenciales para:", { email });
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        log.warn("Credenciales inválidas para:", { email });
        return { error: "Credenciales inválidas" };
      }
      log.error("Error de autenticación inesperado:", { email, type: error.type });
      return { error: "Ocurrió un error inesperado al iniciar sesión." };
    }
    throw error;
  }
}

/**
 * Server Action: Register a new user with Email and Password credentials
 */
export async function registerCredentialsAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown_ip";
    await authRateLimiter.consume(ip);
  } catch (rejRes) {
    log.warn("Rate limit excedido para registro:", { ip: data.email });
    return { error: "Demasiados intentos. Por favor, inténtalo de nuevo en 1 minuto." };
  }

  // 1. Validate with Zod
  const validatedFields = RegisterSchema.safeParse(data);

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0].message;
    log.warn("Validación de registro fallida:", { error: firstError });
    return { error: firstError };
  }

  const { name, email, password } = validatedFields.data;

  try {
    log.info("Registrando nuevo usuario:", { name, email });
    await authService.registerUser(name, email, password);
    log.info("Usuario registrado exitosamente. Iniciando sesión automática:", { email });
    // Log the user in after registration
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT" || (error.digest && error.digest.startsWith("NEXT_REDIRECT"))) {
      throw error;
    }
    if (error.message === "User already exists") {
      log.warn("Intento de registro con correo ya existente:", { email });
      return { error: "El correo ya está registrado." };
    }
    log.error("Error inesperado durante el registro:", { email, error });
    return { error: "Ocurrió un error al registrarse." };
  }
}
