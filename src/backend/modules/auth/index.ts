import { AuthService } from "./auth.service";
import { userRepository } from "@/backend/modules/user";

export const authService = new AuthService(userRepository);
