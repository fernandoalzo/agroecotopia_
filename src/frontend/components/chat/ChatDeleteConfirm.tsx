"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

interface ChatDeleteConfirmProps {
    isDeleting: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ChatDeleteConfirm = ({
    isDeleting,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
}: ChatDeleteConfirmProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="w-full max-w-[320px] rounded-2xl bg-card border border-border/80 p-5 shadow-xl flex flex-col items-center text-center"
            >
                <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-3 shadow-inner">
                    <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-foreground mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{description}</p>
                <div className="flex w-full gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 h-9 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-xs transition-all cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 cursor-pointer"
                    >
                        {isDeleting ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};