"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { postSchema } from "../schemas/post.schema";
import { config } from "@/config/config";
import { cn } from "@/lib/utils";
function MultiLabelSelect({ 
  value, 
  onChange, 
  groupedOptions, 
  label 
}: { 
  value: string[], 
  onChange: (v: string[]) => void, 
  groupedOptions: Record<string, readonly string[]>, 
  label: string 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      if (value.length >= 5) return; // limit to 5
      onChange([...value, opt]);
    }
  };

  const removeOption = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== opt));
  };

  return (
    <div className="space-y-2 relative md:col-span-3">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className={cn(
        "w-full border rounded-xl transition-all duration-300 overflow-hidden",
        isOpen 
          ? "bg-background border-primary/50 ring-4 ring-primary/10 shadow-lg shadow-primary/5" 
          : "bg-secondary/50 border-border/50 hover:border-primary/30"
      )}>
        <div 
          className="px-4 py-3 min-h-[52px] flex items-center justify-between cursor-pointer group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-2 flex-1 mr-4">
            {value.length === 0 && <span className="text-muted-foreground font-medium">Seleccionar etiquetas (máx 5)...</span>}
            {value.map(val => (
              <span key={val} className="flex items-center gap-1 bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-xs font-bold shadow-sm shadow-primary/20">
                {val}
                <button type="button" onClick={(e) => removeOption(e, val)} className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            isOpen ? "bg-primary/10" : "group-hover:bg-primary/5"
          )}>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-300", 
              isOpen ? "text-primary rotate-180" : "text-muted-foreground group-hover:text-primary"
            )} />
          </div>
        </div>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-secondary/20 border-t border-border/50"
            >
              <div className="max-h-64 overflow-y-auto p-3 space-y-4">
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <div key={category}>
                    <div className="flex items-center gap-3 mb-2 px-1 mt-4 first:mt-0">
                      <div className="h-px bg-border/80 flex-1"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-md">
                        {category}
                      </span>
                      <div className="h-px bg-border/80 flex-1"></div>
                    </div>
                    <div className="space-y-0.5">
                      {options.map(opt => {
                        const isSelected = value.includes(opt);
                        const isDisabled = !isSelected && value.length >= 5;
                        return (
                          <div
                            key={opt}
                            onClick={() => !isDisabled && toggleOption(opt)}
                            className={cn(
                              "px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all flex items-center justify-between",
                              isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50",
                              isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                            )}
                          >
                            {opt}
                            {isSelected && <Check className="w-4 h-4" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
interface ForumCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: { title: string; body: string; labels: string[] }) => void;
}

type FormField = {
  id: "title" | "body";
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
  colSpan: string;
};

const formFieldsConfig: FormField[] = [
  { id: "title", label: "Título", type: "text", placeholder: "Ej. ¿Cómo tratar la roya en plantas de café?", colSpan: "md:col-span-3" },
  { id: "body", label: "Descripción detallada", type: "textarea", placeholder: "Describe tu situación, el clima, riegos y todo lo que pueda ayudar a la comunidad a responderte...", colSpan: "md:col-span-3" },
];

export default function ForumCreatePostModal({ isOpen, onClose, onSubmit }: ForumCreatePostModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    labels: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = postSchema.parse(formData);
      setErrors({});
      onSubmit(validatedData);
      
      // Reset
      setFormData({
        title: "",
        body: "",
        labels: []
      });
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach(issue => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
          />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border pointer-events-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50 bg-secondary/30 rounded-t-3xl">
                <h2 className="text-xl font-bold text-foreground">Crear Nueva Publicación</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {formFieldsConfig.map((field) => (
                    <div key={field.id} className={cn("space-y-2", field.colSpan)}>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{field.label}</label>
                      
                      {field.type === "text" && (
                        <input
                          value={formData[field.id as keyof typeof formData] as string}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, [field.id]: e.target.value }));
                            setErrors(prev => ({ ...prev, [field.id]: "" }));
                          }}
                          placeholder={field.placeholder}
                          className={cn(
                            "w-full bg-secondary/50 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all",
                            errors[field.id] ? "border-red-500" : "border-border/50"
                          )}
                        />
                      )}

                      {field.type === "textarea" && (
                        <textarea
                          rows={5}
                          value={formData[field.id as keyof typeof formData] as string}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, [field.id]: e.target.value }));
                            setErrors(prev => ({ ...prev, [field.id]: "" }));
                          }}
                          placeholder={field.placeholder}
                          className={cn(
                            "w-full bg-secondary/50 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none transition-all",
                            errors[field.id] ? "border-red-500" : "border-border/50"
                          )}
                        />
                      )}
                      
                      {errors[field.id] && <span className="text-red-500 text-xs font-bold block">{errors[field.id]}</span>}
                    </div>
                  ))}

                  {/* Labels Section */}
                  <div className="md:col-span-3">
                    <MultiLabelSelect 
                      label="Etiquetas (Clasificadas)"
                      value={formData.labels}
                      onChange={(labels) => {
                        setFormData(prev => ({ ...prev, labels }));
                        setErrors(prev => ({ ...prev, labels: "" }));
                      }}
                      groupedOptions={config.forum.labels}
                    />
                    {errors.labels && <span className="text-red-500 text-xs font-bold block mt-1">{errors.labels}</span>}
                  </div>
                </div>

                <div className="pt-8 mt-6 flex items-center justify-end gap-4 border-t border-border/50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-full font-bold text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-2.5 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Publicar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
