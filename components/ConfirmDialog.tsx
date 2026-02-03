import React, { useState } from 'react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-slide-up">
        <div className="p-6 flex flex-col items-center text-center">
            <div className={`p-4 rounded-full mb-4 ${isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {message}
            </p>
            
            <div className="flex gap-3 w-full">
                <button 
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
                >
                    {cancelLabel}
                </button>
                <button 
                    onClick={onConfirm}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95
                        ${isDangerous ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}
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