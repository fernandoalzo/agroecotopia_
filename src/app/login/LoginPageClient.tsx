"use client";

import { useState, useTransition, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, Leaf, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn as clientSignIn, useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth.schema";
import { AuthMode, FormField } from "@/types/auth.types";

import { AuthVisualPanel } from "@/components/login/AuthVisualPanel";
import { AuthHeader } from "@/components/login/AuthHeader";
import { AuthTabs } from "@/components/login/AuthTabs";
import { AuthForm } from "@/components/login/AuthForm";
import { config } from "@/config/config";

interface LoginPageClientProps {
  registerCredentials: (formData: FormData) => Promise<{ error?: string } | undefined>;
}

function LoginPageContent({ registerCredentials }: LoginPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { t } = useLanguage();
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && mounted) {
      router.push(callbackUrl);
    }
  }, [status, mounted, router, callbackUrl]);

  const formFields: FormField[] = useMemo(() => [
    {
      name: "name",
      type: "text",
      label: t.auth?.name ?? "Nombre completo",
      placeholder: "Tu nombre",
      icon: User,
      showIn: ["register"],
    },
    {
      name: "email",
      type: "email",
      label: t.auth?.email ?? "Correo electrónico",
      placeholder: "tu@correo.com",
      icon: Mail,
      showIn: ["login", "register"],
    },
    {
      name: "password",
      type: "password",
      label: t.auth?.password ?? "Contraseña",
      placeholder: "••••••••",
      icon: Lock,
      showIn: ["login", "register"],
    },
    {
      name: "confirmPassword",
      type: "password",
      label: t.auth?.confirmPassword ?? "Confirmar contraseña",
      placeholder: "••••••••",
      icon: Lock,
      showIn: ["register"],
    },
  ], [t]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mode === "login" ? LoginSchema : RegisterSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    reset();
    setErrorMsg("");
  }, [mode, reset]);

  const onSubmit = async (data: any) => {
    setErrorMsg("");
    startTransition(async () => {
      const isRegistering = mode === "register";

      if (isRegistering) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => formData.append(key, value as string));
        const res = await registerCredentials(formData);
        if (res?.error) {
          setErrorMsg(res.error);
        }
        // Success case is handled by redirection or session update
      } else {
        // Direct client-side signIn for login
        const result = await clientSignIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          if (result.error === "CredentialsSignin") {
            setErrorMsg("Credenciales inválidas");
          } else {
            // Show custom errors (e.g. Rate Limit) returned from server
            setErrorMsg(result.error);
          }
        } else if (result?.ok) {
          router.push(callbackUrl);
          router.refresh();
        }
      }
    });
  };

  const handleProviderSubmit = () => {
    clientSignIn("google", { callbackUrl });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full relative flex flex-col md:flex-row bg-background text-foreground">
      <AuthVisualPanel />

      <div className="flex-1 flex flex-col items-center justify-center relative p-6 sm:p-12 overflow-hidden bg-background">
        {/* Mobile Nav Overlay */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 md:hidden">
          <Link href="/" className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary border border-border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-bold">{config.app.name}</span>
          </div>
        </div>

        <div className="w-full max-w-[420px] mx-auto z-10 mt-12 md:mt-0">
          <AuthHeader mode={mode} t={t} />

          <AuthTabs mode={mode} setMode={setMode} t={t} />

          <AuthForm
            mode={mode}
            formFields={formFields}
            register={register}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            errors={errors}
            isPending={isPending}
            errorMsg={errorMsg}
            handleProviderSubmit={handleProviderSubmit}
            t={t}
            setValue={setValue}
            watch={watch}
          />
        </div>
      </div>
    </div>
  );
}

export default function LoginPageClient({ registerCredentials }: LoginPageClientProps) {
  return (
    <Suspense fallback={null}>
      <LoginPageContent registerCredentials={registerCredentials} />
    </Suspense>
  );
}
