import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export type ToastTone = 'default' | 'danger' | 'success';

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface ToastProps {
  isOpen: boolean;
  message: string;
  tone?: ToastTone;
  action?: ToastAction;
  durationMs?: number;
  onClose: () => void;
}

const toneClasses: Record<ToastTone, string> = {
  default: 'border-slate-700 bg-slate-950/95 text-slate-200',
  danger: 'border-red-500/30 bg-red-950/50 text-red-100',
  success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-100',
};

const Toast: React.FC<ToastProps> = ({
  isOpen,
  message,
  tone = 'default',
  action,
  durationMs = 6000,
  onClose,
}) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    if (!durationMs) return;
    const t = window.setTimeout(() => closeRef.current(), durationMs);
    return () => window.clearTimeout(t);
  }, [isOpen, durationMs]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000] max-w-[92vw]">
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-3 rounded-xl border shadow-2xl backdrop-blur-xl px-4 py-3 ring-1 ring-white/10 animate-slide-up ${
          toneClasses[tone]
        }`}
      >
        <div className="text-sm font-semibold leading-snug">{message}</div>

        <div className="flex items-center gap-2 ml-auto">
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onAction();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border border-indigo-500/30 bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {action.label}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
