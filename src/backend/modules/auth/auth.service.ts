import { auth } from "@/utils/auth";
import { UserRepository } from "@/backend/modules/user/user.repository";
import bcrypt from "bcryptjs";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/auth/auth.service.ts");

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async getSession() {
    return await auth();
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await auth();
    const authenticated = !!session?.user;
    log.debug("Verificación de autenticación:", { authenticated });
    return authenticated;
  }

  async getCurrentUserId(): Promise<string | null> {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    log.debug("ID de usuario actual obtenido:", { userId });
    return userId;
  }

  async verifyCredentials(email?: string, password?: string) {
    if (!email || !password) {
      log.warn("Verificación de credenciales fallida: email o password vacíos.");
      return null;
    }

    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.password) {
      log.warn("Verificación de credenciales fallida: usuario no encontrado o sin contraseña.", { email });
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      log.warn("Verificación de credenciales fallida: contraseña incorrecta.", { email });
      return null;
    }

    log.info("Credenciales verificadas exitosamente para:", { email });
    return user;
  }

  async registerUser(name: string, email: string, password?: string) {
    log.info("Intentando registrar nuevo usuario:", { name, email });
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      log.warn("Registro fallido: el usuario ya existe.", { email });
      throw new Error("User already exists");
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const user = await this.userRepository.createUser({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });
    log.info("Usuario registrado exitosamente:", { userId: user.id, email });
    return user;
  }

  hasRole(session: any, role: "admin" | "user" | "seller"): boolean {
    return session?.user?.role === role;
  }

  isAdmin(session: any): boolean {
    return this.hasRole(session, "admin");
  }
  
  isSeller(session: any): boolean {
    return this.hasRole(session, "seller");
  }

  async me() {
    const session = await auth();

    if (!session?.user) {
      log.debug("me(): No hay sesión activa.");
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
  }

  async ensureAuthenticated() {
    const session = await auth();
    if (!session?.user) {
      log.warn("ensureAuthenticated: Acceso no autorizado detectado.");
      throw new Error("UNAUTHORIZED");
    }
    return session;
  }

  async ensureRole(role: "admin" | "user" | "seller") {
    const session = await this.ensureAuthenticated();
    if (session.user.role !== role) {
      log.warn(`ensureRole: Rol insuficiente. Requerido: ${role}, actual: ${session.user.role}`);
      throw new Error("FORBIDDEN");
    }
    return session;
  }

  async ensureAnyRole(roles: ("admin" | "user" | "seller")[]) {
    const session = await this.ensureAuthenticated();
    if (!roles.includes(session.user.role as any)) {
      log.warn(`ensureAnyRole: Rol insuficiente. Requerido: uno de [${roles.join(", ")}], actual: ${session.user.role}`);
      throw new Error("FORBIDDEN");
    }
    return session;
  }

  async promoteToSeller(userId: string) {
    log.info("Promoviendo usuario a seller", { userId });
    return await this.userRepository.updateUserRole(userId, "seller");
  }
}
