"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { config } from "@/config/config";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { createPostSchema } from "./schemas/post.schema";
import type { PostFormData } from "./schemas/post.schema";

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
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      if (value.length >= 5) return; // limit to 5
      onChange([...value, opt]);
    }
  };

  return (
    <div className="md:col-span-3 -mx-6 sm:-mx-8 mt-2">
      <div className={cn(
        "bg-secondary/30 transition-all duration-500",
        isOpen && "bg-secondary/40 shadow-inner border-y border-border/40"
      )}>
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-6 sm:px-8 py-5 hover:bg-secondary/50 dark:hover:bg-white/10 transition-colors duration-300 group"
        >
          <div className="flex flex-col items-start gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">{label}</label>
            <span className={cn(
              "text-xs font-bold",
              value.length === 5 ? "text-amber-500" : "text-muted-foreground/70"
            )}>
              {t.forum.post.labelCount.replace("{count}", String(value.length))}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-background/50 dark:bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-all duration-300 shadow-sm border border-border/20 dark:border-white/10">
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", isOpen && "rotate-180")} />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 30 }}
              className="overflow-hidden"
            >
              <motion.div 
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
                  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
                }}
                className="px-6 sm:px-8 pb-8 pt-2 space-y-7"
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-border/40 dark:via-white/20 to-transparent mb-6" />
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <motion.div 
                    key={category} 
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
                    }}
                    className="space-y-4"
                  >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 flex items-center gap-3">
                      {category}
                      <div className="h-px bg-border/40 dark:bg-white/10 flex-1"></div>
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
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
                              "px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 scale-[1.02]"
                                : "bg-background/80 dark:bg-white/5 text-muted-foreground hover:bg-background dark:hover:bg-white/10 hover:text-foreground hover:shadow-sm border border-border/10 dark:border-white/10",
                              isDisabled && "opacity-40 cursor-not-allowed hover:bg-background/80 dark:hover:bg-white/5 hover:text-muted-foreground hover:shadow-none"
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
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
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const forumPostSchema = useMemo(() => createPostSchema(t.forum), [t]);

  const form = useForm<PostFormData>({
    resolver: zodResolver(forumPostSchema),
    defaultValues: {
      title: "",
      body: "",
      labels: [],
    },
  });

  const formFieldsConfig: FormField[] = [
    { id: "title", label: t.forum.createPost.titleLabel, type: "text", placeholder: t.forum.createPost.titlePlaceholder, colSpan: "md:col-span-3" },
    { id: "body", label: t.forum.createPost.descriptionLabel, type: "textarea", placeholder: t.forum.createPost.descriptionPlaceholder, colSpan: "md:col-span-3" },
  ];

  const handleSubmit = async (data: PostFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onClose();
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
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[999]"
          />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full h-[100dvh] sm:h-auto max-w-2xl rounded-none sm:rounded-[2rem] shadow-2xl dark:shadow-[0_0_30px_-5px_rgba(var(--primary),0.3)] border-0 sm:border border-border/60 dark:border-primary/40 pointer-events-auto flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-border/50 bg-secondary/20">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{t.forum.createPost.title}</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-background border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300 shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden max-h-none sm:max-h-[75vh]">
                <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {formFieldsConfig.map((field) => (
                      <div key={field.id} className={cn("space-y-2.5", field.colSpan)}>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 pl-1">{field.label}</label>

                        {field.type === "text" && (
                          <input
                            {...form.register(field.id)}
                            placeholder={field.placeholder}
                            className={cn(
                              "w-full bg-secondary/30 border-0 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/50 text-foreground transition-all duration-300 placeholder:text-muted-foreground/50",
                              form.formState.errors[field.id] ? "bg-red-500/10 focus:ring-red-500/20" : ""
                            )}
                          />
                        )}

                        {field.type === "textarea" && (
                          <textarea
                            rows={6}
                            {...form.register(field.id)}
                            placeholder={field.placeholder}
                            className={cn(
                              "w-full bg-secondary/30 border-0 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-secondary/50 text-foreground resize-none transition-all duration-300 placeholder:text-muted-foreground/50",
                              form.formState.errors[field.id] ? "bg-red-500/10 focus:ring-red-500/20" : ""
                            )}
                          />
                        )}

                        {form.formState.errors[field.id] && (
                          <motion.span
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-xs font-bold block pl-1"
                          >
                            {form.formState.errors[field.id]?.message}
                          </motion.span>
                        )}
                      </div>
                    ))}

                    {/* Labels Section */}
                    <div className="md:col-span-3">
                      <MultiLabelSelect
                        label={t.forum.createPost.tagsLabel}
                        value={form.watch("labels")}
                        onChange={(labels) => form.setValue("labels", labels, { shouldValidate: true })}
                        groupedOptions={config.forum.labels}
                      />
                      {form.formState.errors.labels && (
                        <motion.span
                          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-xs font-bold block mt-2 pl-1"
                        >
                          {form.formState.errors.labels.message}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex items-center justify-end gap-4 border-t border-border/50 bg-secondary/10 dark:bg-black/20 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-full font-bold text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors duration-300"
                  >
                    {t.forum.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center gap-2.5 px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:scale-105 active:scale-[0.98] transition-all duration-300 ${isSubmitting ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''}`}
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

