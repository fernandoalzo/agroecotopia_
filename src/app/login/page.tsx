import { registerCredentialsAction } from "@/backend/modules/auth/auth.actions";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return <LoginPageClient registerCredentials={registerCredentialsAction} />;
}
