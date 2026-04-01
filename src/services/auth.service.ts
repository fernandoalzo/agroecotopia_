import { auth } from "@/utils/auth";
import { UserRepository } from "@/repositories/user.repository";
import bcrypt from "bcryptjs";

/**
 * Auth Service — Business logic layer for authentication.
 *
 * This service encapsulates session retrieval and permission checks.
 * Server Components and Server Actions should call this layer
 * instead of importing `auth()` directly, keeping the architecture clean.
 */
export class AuthService {
  /**
   * Get the current authenticated session.
   * Returns null if the user is not logged in.
   */
  static async getSession() {
    return await auth();
  }

  /**
   * Check if the current request has an authenticated user.
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await auth();
    return !!session?.user;
  }

  /**
   * Get the current user's ID.
   * Returns null if not authenticated.
   */
  static async getCurrentUserId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id ?? null;
  }

  /**
   * Verifies the user credentials (email and password).
   * Returns the user object if successful, or null if it fails.
   */
  static async verifyCredentials(email?: string, password?: string) {
    if (!email || !password) return null;

    const user = await UserRepository.findByEmail(email);

    // If user doesn't exist, or doesn't have a password (e.g. only logged in via Google)
    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    // Passwords match, return the user
    return user;
  }

  /**
   * Registers a new user with email and password.
   * Throws an error if the user already exists.
   */
  static async registerUser(name: string, email: string, password?: string) {
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    return await UserRepository.createUser({
      name,
      email,
      password: hashedPassword,
      role: "user", // Explicitly ensure default role is user
    });
  }

  /**
   * Professional RBAC helper to check if a user has a specific role.
   */
  static hasRole(session: any, role: "admin" | "user"): boolean {
    return session?.user?.role === role;
  }

  /**
   * Professional helper to check if the current user is an admin.
   */
  static isAdmin(session: any): boolean {
    return this.hasRole(session, "admin");
  }

  /**
   * Get the current user profile (email, role, name).
   * Used for user verification/profile retrieval.
   */
  static async me() {
    const session = await auth();

    if (!session?.user) {
      return null;
    }

    return {
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
  }

  /**
   * Validates that the current session is authenticated and active.
   * Throws an Error if no session is found (e.g., JWT expired).
   */
  static async ensureAuthenticated() {
    const session = await auth();
    if (!session?.user) {
      throw new Error("UNAUTHORIZED");
    }
    return session;
  }

  /**
   * Validates that the current user has a specific role.
   * Throws an Error if the session is invalid or the role does not match.
   */
  static async ensureRole(role: "admin" | "user") {
    const session = await this.ensureAuthenticated();
    if (session.user.role !== role) {
      throw new Error("FORBIDDEN");
    }
    return session;
  }
}
