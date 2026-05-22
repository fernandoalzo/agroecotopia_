import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  show: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ show, isDeleting, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-2xl z-10"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-foreground mb-2">
                ¿Eliminar conversación?
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Esta acción es permanente. Se eliminarán en cascada todos los mensajes y el historial del chat para siempre.
              </p>

              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 cursor-pointer"
                >
                  {isDeleting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
