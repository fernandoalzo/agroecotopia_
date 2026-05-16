import { auth } from "@/utils/auth";
import { UserRepository } from "@/backend/modules/user/user.repository";
import bcrypt from "bcryptjs";

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async getSession() {
    return await auth();
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await auth();
    return !!session?.user;
  }

  async getCurrentUserId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id ?? null;
  }

  async verifyCredentials(email?: string, password?: string) {
    if (!email || !password) return null;

    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async registerUser(name: string, email: string, password?: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    return await this.userRepository.createUser({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });
  }

  hasRole(session: any, role: "admin" | "user"): boolean {
    return session?.user?.role === role;
  }

  isAdmin(session: any): boolean {
    return this.hasRole(session, "admin");
  }

  async me() {
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

  async ensureAuthenticated() {
    const session = await auth();
    if (!session?.user) {
      throw new Error("UNAUTHORIZED");
    }
    return session;
  }

  async ensureRole(role: "admin" | "user") {
    const session = await this.ensureAuthenticated();
    if (session.user.role !== role) {
      throw new Error("FORBIDDEN");
    }
    return session;
  }
}
