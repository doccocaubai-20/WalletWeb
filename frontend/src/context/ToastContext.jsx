import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message, type = 'info', durationMs = 3000) => {
    if (!message) return;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      removeToast(id);
    }, durationMs);
  }, [removeToast]);

  const value = useMemo(() => ({
    success: (message, durationMs) => pushToast(message, 'success', durationMs),
    error: (message, durationMs) => pushToast(message, 'error', durationMs),
    info: (message, durationMs) => pushToast(message, 'info', durationMs),
    removeToast,
  }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="wallet-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`wallet-toast wallet-toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Đóng thông báo">
              <i className="bi bi-x"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
