import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  message: string;
}

export const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 left-4 md:left-auto z-[60] flex flex-col gap-2.5 md:w-[380px] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const styles = {
          SUCCESS: {
            bg: 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]',
            icon: <CheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />,
          },
          WARNING: {
            bg: 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]',
            icon: <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />,
          },
          ERROR: {
            bg: 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]',
            icon: <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />,
          },
          INFO: {
            bg: 'bg-[#DBEAFE] border-[#BFDBFE] text-[#2563EB]',
            icon: <Info className="h-5 w-5 shrink-0" aria-hidden="true" />,
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-[12px] border px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${styles.bg}`}
            role="status"
          >
            {styles.icon}
            <p className="flex-1 text-[13px] font-medium text-[#172B4D] leading-snug">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Fermer la notification"
              className="rounded-full p-1 text-[#52627A] hover:bg-black/5"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
