import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    // Prevent duplicate notifications with the same title + variant
    setToasts((prev) => {
      const existing = prev.find((t) => t.title === title && t.variant === variant);
      if (existing) return prev;
      const id = ++toastId;
      const newToast = { id, title, description, variant };
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return [...prev, newToast];
    });
  }, [dismiss]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
