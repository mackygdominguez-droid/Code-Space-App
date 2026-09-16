import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, X } from 'lucide-react';

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = options.id || Math.random().toString(36).substring(2, 9);
    const newToast: ToastOptions = { ...options, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = options.duration ?? (options.variant === 'destructive' ? 4000 : 2500);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        id="toast-container"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-[calc(100vw-2rem)]"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const isDestructive = t.variant === 'destructive';
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg font-mono text-xs ${
                  isDestructive
                    ? 'bg-red-950/90 border-red-800/80 text-red-200'
                    : 'bg-surface border-line text-ink'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isDestructive ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Check className="w-4 h-4 text-brand" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px]">{t.title}</p>
                  {t.description && (
                    <p className="text-muted-ink text-[12px] mt-0.5 leading-normal">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => t.id && removeToast(t.id)}
                  className="shrink-0 text-muted-ink hover:text-ink p-1 -mr-1 -mt-1 rounded transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
