import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '../components/ui';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CircleCheck, accent: 'text-emerald-600' },
  error: { icon: CircleAlert, accent: 'text-rose-600' },
  info: { icon: Info, accent: 'text-indigo-600' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((type, title, options = {}) => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, ...options }]);
    setTimeout(() => dismiss(id), options.duration ?? (type === 'error' ? 5000 : 3200));
    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (title, options) => show('success', title, options),
    error: (title, options) => show('error', title, options),
    info: (title, options) => show('info', title, options),
  }), [show]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 sm:top-20 sm:items-end sm:px-6"
      >
        {toasts.map(({ id, type, title, description, action }) => {
          const { icon: Icon, accent } = STYLES[type] || STYLES.info;
          return (
            <div
              key={id}
              role={type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 pr-2.5 shadow-lg shadow-slate-900/10 backdrop-blur"
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', accent)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
              </div>
              {action && (
                <button
                  type="button"
                  onClick={() => { action.onClick(); dismiss(id); }}
                  className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                >
                  {action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
