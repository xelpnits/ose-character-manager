import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel", 
  onConfirm, 
  onCancel,
  isDangerous = false
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && !isDangerous) {
        // Only allow Enter to confirm for non-dangerous actions
        e.preventDefault();
        onConfirm();
      }
    };

    if (isOpen) {
      lastActiveRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      // Focus management: focus cancel by default (safer), confirm for non-danger actions
      const target = isDangerous ? cancelBtnRef.current : confirmBtnRef.current;
      setTimeout(() => target?.focus(), 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when closing
      lastActiveRef.current?.focus?.();
    };
  }, [isDangerous, isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-desc"
    >
      <div 
        ref={dialogRef}
        className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-slide-up"
      >
        <div className="p-6 flex flex-col items-center text-center">
            <div className={`p-4 rounded-full mb-4 ${isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <AlertTriangle className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 id="dialog-title" className="text-xl font-serif font-bold text-white mb-2">{title}</h3>
            <p id="dialog-desc" className="text-slate-400 text-sm mb-6 leading-relaxed">
                {message}
            </p>
            
            <div className="flex gap-3 w-full">
                <button 
                    ref={cancelBtnRef}
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                    {cancelLabel}
                </button>
                <button 
                    ref={confirmBtnRef}
                    onClick={onConfirm}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none
                        ${isDangerous ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20 focus:ring-red-500' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20 focus:ring-indigo-500'}
                    `}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;