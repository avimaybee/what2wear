"use client";

import { Toaster as HotToaster, toast as hotToast, ToastBar } from "react-hot-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
        },
      }}
    >
      {(t) => (
        <AnimatePresence>
          {t.visible && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="relative"
            >
              <ToastBar toast={t}>
                {({ icon, message }) => (
                  <div
                    className={`
                      flex items-start gap-3 p-4 rounded-xl
                      backdrop-blur-xl border shadow-2xl
                      min-w-[320px] max-w-md
                      ${
                        t.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-100"
                          : t.type === "error"
                          ? "bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-100"
                          : "bg-card/95 border-border/50 text-card-foreground"
                      }
                    `}
                  >
                    {/* Custom icon based on type */}
                    <div className="flex-shrink-0 mt-0.5">
                      {t.type === "success" && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {t.type === "error" && (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      {t.type === "loading" && (
                        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      )}
                      {!t.type && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                      {t.icon && !["success", "error", "loading"].includes(t.type || "") && (
                        <span className="text-xl">{icon}</span>
                      )}
                    </div>

                    {/* Message */}
                    <div className="flex-1 text-sm font-medium leading-relaxed pt-0.5">
                      {message}
                    </div>

                    {/* Close button */}
                    {t.type !== "loading" && (
                      <button
                        onClick={() => hotToast.dismiss(t.id)}
                        className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                      </button>
                    )}
                  </div>
                )}
              </ToastBar>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </HotToaster>
  );
}

// Export toast for convenience
export const toast = hotToast;

