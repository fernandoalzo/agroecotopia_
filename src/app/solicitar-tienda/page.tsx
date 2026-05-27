"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Store, Mail, Phone, MapPin, Building, ChevronRight, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { submitStoreRequestAction } from "@/backend/modules/store/store.actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { storeRequestSchema, FormErrors } from "@/backend/modules/store/store.schema";

function SolicitarTiendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromDashboard = searchParams.get("from") === "dashboard";
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Zod validation
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

    setLoading(true);
    try {
      const res = await submitStoreRequestAction(result.data);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        setSuccess(true);
        toast.success("¡Solicitud enviada con éxito!");
      }
    } catch (error) {
      toast.error("Ocurrió un error al enviar la solicitud.");
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 pt-24 font-body">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="max-w-md w-full bg-white border border-[#EAEAEC] rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-8 relative overflow-hidden"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="mx-auto w-24 h-24 bg-[#F2F7F4] rounded-full flex items-center justify-center mb-6 relative"
          >
            <CheckCircle2 className="w-12 h-12 text-[#2A5C43]" />
          </motion.div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#111111] font-display tracking-tight">Solicitud Recibida</h2>
            <p className="text-[#666666] text-base leading-relaxed">
              Hemos recibido tu solicitud para abrir una tienda. Nuestro equipo la revisará cuidadosamente y te notificaremos pronto.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(isFromDashboard ? "/mi-tienda" : "/pedidos")}
            className="w-full mt-8 bg-[#111111] text-white py-4 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            Volver a mi panel
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 relative selection:bg-[#2A5C43]/20 selection:text-[#2A5C43] font-body">
      
      {/* Very subtle ambient light */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#2A5C43]/[0.02] to-transparent pointer-events-none" />
      
      <div className="container max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        
        {isFromDashboard && (
          <div className="mb-8 w-full flex justify-start">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push("/mi-tienda")}
              className="flex items-center gap-2 text-sm font-semibold text-[#666666] hover:text-[#111111] transition-colors bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-[#EAEAEC] shadow-sm hover:shadow-md"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#EAEAEC] text-[#666666] text-xs font-medium uppercase tracking-widest shadow-sm"
          >
            <Leaf className="w-3.5 h-3.5 text-[#2A5C43]" />
            <span>Únete al Ecosistema</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-5xl font-black text-[#111111] font-display tracking-tight"
          >
            Vende en Agroecotopia
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed"
          >
            Conviértete en un aliado y ofrece tus productos agroecológicos a miles de clientes comprometidos con el medio ambiente.
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, type: "spring", bounce: 0.1 }}
          className="bg-white border border-[#EAEAEC] shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[2rem] overflow-hidden"
        >
          <div className="p-8 sm:p-12">
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* Section 1: Store Info */}
              <div className="space-y-7">
                <div className="flex items-center gap-3 border-b border-[#F0F0F2] pb-4">
                  <div className="p-2 bg-[#F7F7F8] rounded-lg">
                    <Store className="w-4 h-4 text-[#111111]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111111] font-display tracking-tight">Información de la Tienda</h3>
                </div>
                
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-semibold text-[#444444] mb-2 transition-colors group-focus-within:text-[#111111]">
                      Nombre de la Tienda <span className="text-[#2A5C43]">*</span>
                    </label>
                    <Input 
                      name="name"
                      placeholder="Ej. Finca La Esperanza"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "bg-[#FAFAFB] text-[#111111] border-transparent h-14 rounded-xl px-5 text-base transition-all duration-300",
                        focusedField === 'name' ? "bg-white ring-1 ring-[#2A5C43]/30 shadow-sm" : "hover:bg-[#F2F2F4]",
                        errors.name && "ring-1 ring-red-500/50 bg-red-50/50"
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
                    <label className="block text-sm font-semibold text-[#444444] mb-2 transition-colors group-focus-within:text-[#111111]">
                      Descripción <span className="text-[#2A5C43]">*</span>
                    </label>
                    <Textarea 
                      name="description"
                      placeholder="¿Qué produces? ¿Cuál es tu filosofía agroecológica?"
                      value={formData.description}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('desc')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "bg-[#FAFAFB] text-[#111111] border-transparent min-h-[140px] rounded-xl p-5 text-base resize-none transition-all duration-300",
                        focusedField === 'desc' ? "bg-white ring-1 ring-[#2A5C43]/30 shadow-sm" : "hover:bg-[#F2F2F4]",
                        errors.description && "ring-1 ring-red-500/50 bg-red-50/50"
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
              <div className="space-y-7 pt-2">
                <div className="flex items-center gap-3 border-b border-[#F0F0F2] pb-4">
                  <div className="p-2 bg-[#F7F7F8] rounded-lg">
                    <MapPin className="w-4 h-4 text-[#111111]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111111] font-display tracking-tight">Contacto y Ubicación</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-[#444444] mb-2 transition-colors group-focus-within:text-[#111111]">Teléfono</label>
                    <div className="relative">
                      <Phone className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusedField === 'phone' ? "text-[#111111]" : "text-[#999999]")} />
                      <Input 
                        name="phone"
                        placeholder="+57 300 000 0000"
                        value={formData.phone}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "bg-[#FAFAFB] text-[#111111] border-transparent h-14 rounded-xl pl-11 text-base transition-all duration-300",
                          focusedField === 'phone' ? "bg-white ring-1 ring-[#2A5C43]/30 shadow-sm" : "hover:bg-[#F2F2F4]",
                          errors.phone && "ring-1 ring-red-500/50 bg-red-50/50"
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
                    <label className="block text-sm font-semibold text-[#444444] mb-2 transition-colors group-focus-within:text-[#111111]">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusedField === 'email' ? "text-[#111111]" : "text-[#999999]")} />
                      <Input 
                        type="email"
                        name="email"
                        placeholder="contacto@mitienda.com"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "bg-[#FAFAFB] text-[#111111] border-transparent h-14 rounded-xl pl-11 text-base transition-all duration-300",
                          focusedField === 'email' ? "bg-white ring-1 ring-[#2A5C43]/30 shadow-sm" : "hover:bg-[#F2F2F4]",
                          errors.email && "ring-1 ring-red-500/50 bg-red-50/50"
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
                    <label className="block text-sm font-semibold text-[#444444] mb-2 transition-colors group-focus-within:text-[#111111]">Dirección Finca / Tienda</label>
                    <div className="relative">
                      <MapPin className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusedField === 'addr' ? "text-[#111111]" : "text-[#999999]")} />
                      <Input 
                        name="address"
                        placeholder="Vereda El Placer, Lote 4"
                        value={formData.address}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('addr')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "bg-[#FAFAFB] text-[#111111] border-transparent h-14 rounded-xl pl-11 text-base transition-all duration-300",
                          focusedField === 'addr' ? "bg-white ring-1 ring-[#2A5C43]/30 shadow-sm" : "hover:bg-[#F2F2F4]",
                          errors.address && "ring-1 ring-red-500/50 bg-red-50/50"
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
                    <label className="block text-sm font-semibold text-[#444444] mb-2 transition-colors group-focus-within:text-[#111111]">Ciudad / Municipio</label>
                    <div className="relative">
                      <Building className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", focusedField === 'city' ? "text-[#111111]" : "text-[#999999]")} />
                      <Input 
                        name="city"
                        placeholder="Quimbaya, Quindío"
                        value={formData.city}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('city')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "bg-[#FAFAFB] text-[#111111] border-transparent h-14 rounded-xl pl-11 text-base transition-all duration-300",
                          focusedField === 'city' ? "bg-white ring-1 ring-[#2A5C43]/30 shadow-sm" : "hover:bg-[#F2F2F4]",
                          errors.city && "ring-1 ring-red-500/50 bg-red-50/50"
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
              <div className="pt-8 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white py-4 rounded-xl font-bold shadow-sm hover:bg-black transition-all disabled:opacity-70 disabled:pointer-events-none active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Enviar Solicitud
                    </>
                  )}
                </button>
                <p className="text-xs text-[#888888] mt-6 text-center leading-relaxed">
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

export default function SolicitarTiendaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFDFD]" />}>
      <SolicitarTiendaContent />
    </Suspense>
  );
}
