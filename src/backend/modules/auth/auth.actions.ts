"use server";

import { signIn, signOut } from "@/utils/auth";
import { AuthError } from "next-auth";
import { authService } from "@/backend/modules/auth";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth.schema";

/**
 * Server Action: Sign in with a provider.
 * Defaults to Google but accepts any configured provider ID.
 */
export async function signInAction(provider: string = "google") {
  await signIn(provider);
}

/**
 * Server Action: Sign out the current user.
 * Redirects to the home page after sign out.
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/**
 * Server Action: Sign in with Email and Password credentials
 */
export async function credentialsSignInAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  // 1. Validate with Zod
  const validatedFields = LoginSchema.safeParse(data);

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0].message;
    return { error: firstError };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Credenciales inválidas" };
      }
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

  // 1. Validate with Zod
  const validatedFields = RegisterSchema.safeParse(data);

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0].message;
    return { error: firstError };
  }

  const { name, email, password } = validatedFields.data;

  try {
    await authService.registerUser(name, email, password);
    // Log the user in after registration
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error: any) {
    if (error.message === "User already exists") {
      return { error: "El correo ya está registrado." };
    }
    return { error: "Ocurrió un error al registrarse." };
  }
}
