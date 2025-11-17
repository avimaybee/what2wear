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
                {({ icon, message }) => {
                  const toneClasses =
                    t.type === "success"
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : t.type === "error"
                      ? "bg-destructive text-destructive-foreground border-destructive/70"
                      : t.type === "loading"
                      ? "bg-accent text-accent-foreground border-accent/70"
                      : "bg-card text-foreground border-border";

                  return (
                  <div
                    className={`
                      relative flex items-start gap-3 px-4 py-3
                      min-w-[260px] max-w-md
                      rounded-[1.25rem] border-2 shadow-md
                      ${toneClasses}
                    `}
                  >
                    {/* Left accent pill for status */}
                    <div className="flex-shrink-0 mt-0.5">
                      {t.type === "success" && (
                        <CheckCircle2 className="h-5 w-5 text-white/90" />
                      )}
                      {t.type === "error" && (
                        <AlertCircle className="h-5 w-5 text-destructive-foreground/90" />
                      )}
                      {t.type === "loading" && (
                        <div className="h-5 w-5 border-2 border-accent-foreground/40 border-t-accent-foreground rounded-full animate-spin" />
                      )}
                      {!t.type && <Info className="h-5 w-5 text-foreground/90" />}
                      {t.icon && !["success", "error", "loading"].includes(t.type || "") && (
                        <span className="text-xl">{icon}</span>
                      )}
                    </div>

                    {/* Message */}
                    <div className="flex-1 text-sm leading-relaxed text-left">
                      {message}
                    </div>

                    {/* Close button */}
                    {t.type !== "loading" && (
                      <button
                        onClick={() => hotToast.dismiss(t.id)}
                        className="flex-shrink-0 mt-0.5 p-1 rounded-full hover:bg-black/10 transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X className="h-4 w-4 text-destructive-foreground/80" />
                      </button>
                    )}
                  </div>
                )}}
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

