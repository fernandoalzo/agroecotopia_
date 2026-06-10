"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { postSchema } from "../schemas/post.schema";
import { config } from "@/config/config";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t } = useLanguage();
  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      if (value.length >= 5) return; // limit to 5
      onChange([...value, opt]);
    }
  };

  return (
    <div className="space-y-4 md:col-span-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className={cn(
          "text-xs font-bold",
          value.length === 5 ? "text-amber-500" : "text-muted-foreground"
        )}>
          {t.forum.post.labelCount.replace("{count}", String(value.length))}
        </span>
      </div>

      <div className="bg-secondary/30 border border-border/50 rounded-2xl p-5 space-y-6">
        {Object.entries(groupedOptions).map(([category, options]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
              {category}
              <div className="h-px bg-border flex-1"></div>
            </h4>
            <div className="flex flex-wrap gap-2">
              {options.map(opt => {
                const isSelected = value.includes(opt);
                const isDisabled = !isSelected && value.length >= 5;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => !isDisabled && toggleOption(opt)}
                    disabled={isDisabled}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 scale-105"
                        : "bg-background border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      isDisabled && "opacity-40 cursor-not-allowed hover:border-border/60 hover:text-muted-foreground"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
interface ForumCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: { title: string; body: string; labels: string[] }) => Promise<void> | void;
}

type FormField = {
  id: "title" | "body";
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
  colSpan: string;
};

export default function ForumCreatePostModal({ isOpen, onClose, onSubmit }: ForumCreatePostModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    labels: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const formFieldsConfig: FormField[] = [
    { id: "title", label: t.forum.createPost.titleLabel, type: "text", placeholder: t.forum.createPost.titlePlaceholder, colSpan: "md:col-span-3" },
    { id: "body", label: t.forum.createPost.descriptionLabel, type: "textarea", placeholder: t.forum.createPost.descriptionPlaceholder, colSpan: "md:col-span-3" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      const validatedData = postSchema.parse(formData);
      setErrors({});
      setIsSubmitting(true);
      await onSubmit(validatedData);

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
    } finally {
      setIsSubmitting(false);
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
                <h2 className="text-xl font-bold text-foreground">{t.forum.createPost.title}</h2>
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
                      label={t.forum.createPost.tagsLabel}
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
                    {t.forum.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all ${isSubmitting ? 'opacity-60 cursor-not-allowed hover:scale-100' : ''}`}
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? t.forum.createPost.publishing : t.forum.createPost.publish}
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
