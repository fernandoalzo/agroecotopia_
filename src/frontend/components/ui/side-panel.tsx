"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  /** Panel title displayed in the header */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Optional icon rendered before the title */
  icon?: React.ReactNode;
  /** Panel body content */
  children: React.ReactNode;
  /** Optional footer content pinned at the bottom */
  footer?: React.ReactNode;
  /** Max width class override (default: "max-w-lg") */
  maxWidth?: string;
}

/**
 * Reusable side panel that slides in from the right.
 *
 * Follows the same pattern used across the app in OrderDetailPanel,
 * EnvioDetailPanel, and ProductDetailPanel:
 * - Full-height panel anchored to the right edge
 * - Backdrop with subtle blur
 * - Spring animation for smooth open/close
 * - Consistent header, scrollable body, and optional sticky footer
 */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "max-w-lg",
}: SidePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="side-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-[3px] z-40 cursor-pointer"
          />

          {/* Panel */}
          <motion.div
            key="side-panel-content"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 right-0 z-50 w-full ${maxWidth} bg-card border-l border-border shadow-2xl flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {icon}
                  <h2 className="text-lg font-bold tracking-tight truncate">{title}</h2>
                </div>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-border shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
