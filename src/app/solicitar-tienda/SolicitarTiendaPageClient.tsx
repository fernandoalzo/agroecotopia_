"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Store, Mail, Phone, MapPin, Building, ChevronRight, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const storeRequestSchema = z.object({
  name: z.string().min(3, "El nombre de la tienda debe tener al menos 3 caracteres."),
  description: z.string().min(20, "Por favor, danos una descripción más detallada (mínimo 20 caracteres)."),
  phone: z.string().min(7, "Ingresa un número de teléfono válido (mínimo 7 dígitos).").optional().or(z.literal("")),
  email: z.string().email("Ingresa un correo electrónico válido.").optional().or(z.literal("")),
  address: z.string().min(5, "La dirección debe ser más descriptiva (mínimo 5 caracteres).").optional().or(z.literal("")),
  city: z.string().min(3, "La ciudad debe tener al menos 3 caracteres.").optional().or(z.literal("")),
});

type StoreRequestFormInput = z.infer<typeof storeRequestSchema>;
type FormErrors = Partial<Record<keyof StoreRequestFormInput, string>>;

interface SolicitarTiendaPageClientProps {
  submitStoreRequest: (data: StoreRequestFormInput) => Promise<unknown>;
}

const hasError = (result: unknown): result is { error: string } => {
  return typeof result === "object" && result !== null && "error" in result;
};

function SolicitarTiendaContent({ submitStoreRequest }: SolicitarTiendaPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromDashboard = searchParams.get("from") === "dashboard";
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

  const handleRequestConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Zod validation before showing confirmation
    const result = storeRequestSchema.safeParse(formData);

    if (!result.success) {
      const flatErrors = result.error.flatten().fieldErrors;
      const fieldErrors: FormErrors = {};

      for (const key in flatErrors) {
        if (flatErrors[key as keyof typeof flatErrors]?.[0]) {
          fieldErrors[key as keyof FormErrors] = flatErrors[key as keyof typeof flatErrors]![0];
        }
      }

      setErrors(fieldErrors);
      toast.error("Por favor, corrige los errores en el formulario.");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    if (loading) return;
    setLoading(true);
    const result = storeRequestSchema.safeParse(formData);
    if (!result.success) return;

    try {
      const res = await submitStoreRequest(result.data);
      if (hasError(res)) {
        toast.error(res.error);
      } else {
        setSuccess(true);
        toast.success("¡Solicitud enviada con éxito!");
      }
    } catch (error) {
      toast.error("Ocurrió un error al enviar la solicitud.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field being typed in
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-24 relative selection:bg-primary/20 selection:text-primary font-body overflow-hidden">
        
        {/* Background Watermarks */}
        <Leaf className="absolute -top-24 -left-24 w-96 h-96 text-primary/[0.03] -rotate-12 pointer-events-none" />
        <Store className="absolute top-1/4 -right-32 w-[30rem] h-[30rem] text-primary/[0.02] rotate-12 pointer-events-none" />
        <Building className="absolute -bottom-32 left-1/4 w-[40rem] h-[40rem] text-primary/[0.02] -rotate-6 pointer-events-none" />

        {/* Very subtle ambient light */}
        <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#2A5C43]/[0.02] to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="max-w-md w-full text-center space-y-10 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="mx-auto w-24 h-24 bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-sm flex items-center justify-center mb-2 relative"
          >
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </motion.div>

          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight relative inline-block">
              <span className="relative z-10">Solicitud Recibida</span>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-3 bg-primary/10 -z-10 rounded-full" />
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
              Hemos recibido tu solicitud para abrir una tienda. Nuestro equipo la revisará cuidadosamente y te notificaremos pronto.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(isFromDashboard ? "/mi-tienda" : "/pedidos")}
            className="w-full mt-10 bg-primary text-white py-4 rounded-xl font-bold shadow-md hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            Volver a mi panel
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 relative selection:bg-primary/20 selection:text-primary font-body overflow-hidden">

      {/* Background Watermarks */}
      <Leaf className="absolute -top-24 -left-24 w-96 h-96 text-primary/[0.03] -rotate-12 pointer-events-none" />
      <Store className="absolute top-1/4 -right-32 w-[30rem] h-[30rem] text-primary/[0.02] rotate-12 pointer-events-none" />
      <Building className="absolute -bottom-32 left-1/4 w-[40rem] h-[40rem] text-primary/[0.02] -rotate-6 pointer-events-none" />

      {/* Very subtle ambient light */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#2A5C43]/[0.02] to-transparent pointer-events-none" />

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 relative z-10">

        {isFromDashboard && (
          <div className="mb-8 w-full flex justify-start">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push("/mi-tienda")}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </motion.button>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-muted-foreground text-xs font-medium uppercase tracking-widest shadow-sm"
          >
            <Leaf className="w-3.5 h-3.5 text-primary" />
            <span>Únete al Ecosistema</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight relative"
          >
            <span className="relative z-10">Vende en Agroecotopia</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-3 bg-primary/10 -z-10 rounded-full" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Conviértete en un aliado y ofrece tus productos agroecológicos a miles de clientes comprometidos con el medio ambiente.
          </motion.p>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, type: "spring", bounce: 0.1 }}
          className="relative z-20"
        >
          <div className="py-4 sm:py-8">
            <form onSubmit={handleRequestConfirm} className="space-y-12">

              {/* Section 1: Store Info */}
              <div className="space-y-8 relative">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="p-2 bg-card border border-border rounded-xl shadow-sm">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground font-display tracking-tight">Información de la Tienda</h3>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-bold text-foreground mb-2 transition-colors group-focus-within:text-foreground">
                      Nombre de la Tienda <span className="text-primary">*</span>
                    </label>
                    <Input
                      name="name"
                      placeholder="Ej. Finca La Esperanza"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "bg-card/80 backdrop-blur-md text-foreground border-border h-14 rounded-xl px-5 text-base transition-all duration-300 shadow-sm",
                        focusedField === 'name' ? "ring-2 ring-primary/20 border-primary/50 shadow-md bg-card" : "hover:border-primary/50",
                        errors.name && "ring-2 ring-red-500/20 border-red-500/50 bg-red-50/50"
                      )}
                    />
                    <AnimatePresence>
                      {errors.name && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1.5 font-medium ml-1">
                          {errors.name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-bold text-foreground mb-2 transition-colors group-focus-within:text-foreground">
                      Descripción <span className="text-primary">*</span>
                    </label>
                    <Textarea
                      name="description"
                      placeholder="¿Qué produces? ¿o que servicios ofreces?"
                      value={formData.description}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('desc')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "bg-card/80 backdrop-blur-md text-foreground border-border min-h-[140px] rounded-xl p-5 text-base resize-none transition-all duration-300 shadow-sm",
                        focusedField === 'desc' ? "ring-2 ring-primary/20 border-primary/50 shadow-md bg-card" : "hover:border-primary/50",
                        errors.description && "ring-2 ring-red-500/20 border-red-500/50 bg-red-50/50"
                      )}
                    />
                    <AnimatePresence>
                      {errors.description && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1.5 font-medium ml-1">
                          {errors.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact */}
              <div className="space-y-8 pt-4 relative">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="p-2 bg-card border border-border rounded-xl shadow-sm">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground font-display tracking-tight">Contacto y Ubicación</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-bold text-foreground mb-2 transition-colors group-focus-within:text-foreground">Teléfono</label>
                    <div className="relative">
                      <Phone className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10", focusedField === 'phone' ? "text-primary" : "text-muted-foreground")} />
                      <Input
                        name="phone"
                        placeholder="+57 300 000 0000"
                        value={formData.phone}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "bg-card/80 backdrop-blur-md text-foreground border-border h-14 rounded-xl pl-11 text-base transition-all duration-300 shadow-sm relative",
                          focusedField === 'phone' ? "ring-2 ring-primary/20 border-primary/50 shadow-md bg-card" : "hover:border-primary/50",
                          errors.phone && "ring-2 ring-red-500/20 border-red-500/50 bg-red-50/50"
                        )}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.phone && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1.5 font-medium ml-1">
                          {errors.phone}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-bold text-foreground mb-2 transition-colors group-focus-within:text-foreground">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10", focusedField === 'email' ? "text-primary" : "text-muted-foreground")} />
                      <Input
                        type="email"
                        name="email"
                        placeholder="contacto@mitienda.com"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "bg-card/80 backdrop-blur-md text-foreground border-border h-14 rounded-xl pl-11 text-base transition-all duration-300 shadow-sm relative",
                          focusedField === 'email' ? "ring-2 ring-primary/20 border-primary/50 shadow-md bg-card" : "hover:border-primary/50",
                          errors.email && "ring-2 ring-red-500/20 border-red-500/50 bg-red-50/50"
                        )}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1.5 font-medium ml-1">
                          {errors.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="group md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-2 transition-colors group-focus-within:text-foreground">Dirección Finca / Tienda</label>
                    <div className="relative">
                      <MapPin className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10", focusedField === 'addr' ? "text-primary" : "text-muted-foreground")} />
                      <Input
                        name="address"
                        placeholder="Vereda El Placer, Lote 4"
                        value={formData.address}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('addr')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "bg-card/80 backdrop-blur-md text-foreground border-border h-14 rounded-xl pl-11 text-base transition-all duration-300 shadow-sm relative",
                          focusedField === 'addr' ? "ring-2 ring-primary/20 border-primary/50 shadow-md bg-card" : "hover:border-primary/50",
                          errors.address && "ring-2 ring-red-500/20 border-red-500/50 bg-red-50/50"
                        )}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.address && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1.5 font-medium ml-1">
                          {errors.address}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="group md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-2 transition-colors group-focus-within:text-foreground">Ciudad / Municipio</label>
                    <div className="relative">
                      <Building className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10", focusedField === 'city' ? "text-primary" : "text-muted-foreground")} />
                      <Input
                        name="city"
                        placeholder="Quimbaya, Quindío"
                        value={formData.city}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('city')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "bg-card/80 backdrop-blur-md text-foreground border-border h-14 rounded-xl pl-11 text-base transition-all duration-300 shadow-sm relative",
                          focusedField === 'city' ? "ring-2 ring-primary/20 border-primary/50 shadow-md bg-card" : "hover:border-primary/50",
                          errors.city && "ring-2 ring-red-500/20 border-red-500/50 bg-red-50/50"
                        )}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.city && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1.5 font-medium ml-1">
                          {errors.city}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Footer / Submit */}
              <div className="pt-10 mt-6 border-t border-border">
                <AnimatePresence mode="wait">
                  {!showConfirm ? (
                    <motion.button
                      key="submit-btn"
                      type="submit"
                      disabled={loading}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-70 disabled:pointer-events-none active:scale-[0.98]"
                    >
                      Enviar Solicitud
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  ) : (
                    <motion.div
                      key="confirm-block"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.25 }}
                      className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-6 space-y-4 text-center shadow-sm"
                    >
                      <p className="text-base font-semibold text-foreground">
                        ¿Estás seguro de que deseas enviar la solicitud?
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowConfirm(false)}
                          className="flex-1 py-3 rounded-xl font-bold border border-border bg-card text-foreground hover:bg-secondary transition-all active:scale-[0.98]"
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmedSubmit}
                          disabled={loading}
                          className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-70 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-background rounded-full animate-spin" />
                          ) : (
                            "Sí, enviar"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed font-medium">
                  Al enviar esta solicitud, aceptas nuestros términos y condiciones para vendedores. <br className="hidden sm:block" /> Tu solicitud pasará por un proceso de revisión manual.
                </p>
              </div>

            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SolicitarTiendaPageClient({ submitStoreRequest }: SolicitarTiendaPageClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SolicitarTiendaContent submitStoreRequest={submitStoreRequest} />
    </Suspense>
  );
}
