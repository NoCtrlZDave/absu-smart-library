import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastContext } from './ToastContext';
import './Common.css';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    }, 4000);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] || Info;
            return (
              <div
                key={toast.id}
                className={`toast toast--${toast.type}${toast.exiting ? ' toast--exiting' : ''}`}
              >
                <Icon className="toast-icon" />
                <span className="toast-message">{toast.message}</span>
                <button
                  className="toast-dismiss"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
