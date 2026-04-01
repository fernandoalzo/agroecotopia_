"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthMode, FormField } from "@/types/auth.types";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface AuthFormProps {
  mode: AuthMode;
  formFields: FormField[];
  register: UseFormRegister<any>;
  handleSubmit: any;
  onSubmit: (data: any) => void;
  errors: FieldErrors<any>;
  isPending: boolean;
  errorMsg: string;
  handleProviderSubmit: () => void;
  t: any;
}

export function AuthForm({
  mode,
  formFields,
  register,
  handleSubmit,
  onSubmit,
  errors,
  isPending,
  errorMsg,
  handleProviderSubmit,
  t,
}: AuthFormProps) {
  return (
    <div className="relative min-h-[350px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
          transition={{ duration: 0.2 }}
          className="form-inner"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="error-alert">
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              {formFields
                .filter((field) => field.showIn.includes(mode))
                .map((field) => {
                  const Icon = field.icon;
                  const fieldName = field.name as any;
                  const error = errors[fieldName];

                  return (
                    <div key={field.name} className="field-group">
                      <label className="field-label">
                        {field.label}
                        {error && (
                          <span className="field-error-text">
                            {error.message as string}
                          </span>
                        )}
                      </label>
                      <div className="input-wrapper">
                        <Icon className="input-icon" />
                        <input
                          {...register(fieldName)}
                          type={field.type}
                          placeholder={field.placeholder}
                          className={cn(
                            "input-field",
                            error && "input-field-error"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={cn("submit-button", "group")}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === "login"
                    ? (t.auth?.loginButton ?? "Iniciar Sesión")
                    : (t.auth?.registerButton ?? "Registrarme")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="divider-container">
            <div className="divider-line">
              <span className="w-full border-t border-border" />
            </div>
            <div className="divider-text-wrapper">
              <span className="divider-text">O continuar con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleProviderSubmit}
            disabled={isPending}
            className={cn("provider-button", "group")}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>{t.auth?.googleButton ?? "Continuar con Google"}</span>
              </>
            )}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
