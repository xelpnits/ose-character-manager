import React, { useEffect, useRef, useState } from 'react';
import { Item } from '../../types';
import { Layers, ArrowRight } from 'lucide-react';

interface StackSplitDialogProps {
  isOpen: boolean;
  item: Item | null;
  targetName: string;
  onConfirm: (count: number) => void;
  onCancel: () => void;
}

const StackSplitDialog: React.FC<StackSplitDialogProps> = ({ 
  isOpen, 
  item, 
  targetName, 
  onConfirm, 
  onCancel 
}) => {
  const [count, setCount] = useState<number>(1);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    lastActiveRef.current = document.activeElement as HTMLElement;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', onKeyDown);
    setTimeout(() => initialFocusRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      lastActiveRef.current?.focus?.();
    };
  }, [isOpen, onCancel]);

  if (!isOpen || !item) return null;

  const max = item.count;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-slide-up">
        <div className="p-6">
            <div className="flex items-center gap-3 mb-4 text-indigo-400">
                <Layers className="w-6 h-6" />
                <h3 className="text-lg font-serif font-bold text-white">Select Quantity</h3>
            </div>
            
            <p className="text-sm text-slate-400 mb-6">
                How many <strong>{item.name}</strong> do you want to move to <strong>{targetName}</strong>?
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
                <button 
                    onClick={() => setCount(Math.max(1, count - 1))}
                    className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-600 text-white font-bold hover:bg-slate-700 transition-colors"
                >
                    -
                </button>
                <div className="text-center">
                    <input 
                        ref={initialFocusRef}
                        type="number" 
                        min="1" 
                        max={max} 
                        value={count} 
                        onChange={(e) => setCount(Math.max(1, Math.min(max, parseInt(e.target.value) || 1)))}
                        className="w-20 text-center bg-transparent text-3xl font-mono font-bold text-white border-none focus:ring-0 p-0"
                    />
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">of {max}</div>
                </div>
                <button 
                    onClick={() => setCount(Math.min(max, count + 1))}
                    className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-600 text-white font-bold hover:bg-slate-700 transition-colors"
                >
                    +
                </button>
            </div>
            
            <div className="flex gap-3 w-full">
                <button 
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => onConfirm(count)}
                    className="flex-1 px-4 py-2.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                >
                    <span>Move</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StackSplitDialog;