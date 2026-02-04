import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trophy, Users, Plus, ArrowRight, UserMinus } from 'lucide-react';

interface XPCalculatorModalProps {
  currentXP: number;
  defaultPartySize: number;
  onSave: (newXP: number) => void;
  onClose: () => void;
}

const XPCalculatorModal: React.FC<XPCalculatorModalProps> = ({ 
  currentXP, 
  defaultPartySize, 
  onSave, 
  onClose 
}) => {
  const [mode, setMode] = useState<'manual' | 'calculator'>('calculator');

  const lastActiveRef = useRef<HTMLElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const calcInputRef = useRef<HTMLInputElement>(null);

  // Manual State
  const [manualAdd, setManualAdd] = useState<string>('');
  
  // Calculator State
  const [totalSessionXP, setTotalSessionXP] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(defaultPartySize);
  const [retainerCount, setRetainerCount] = useState<number>(0);

  // XP Calculation with Retainers (Retainers get 1/2 share)
  // Formula: Share = Total / (PartyMembers + 0.5 * Retainers)
  const effectiveDivisor = (partySize || 1) + (retainerCount * 0.5);
  const calcShare = Math.floor((parseInt(totalSessionXP) || 0) / effectiveDivisor);
  const retainerShare = Math.floor(calcShare / 2);

  const previewXP = mode === 'manual' 
    ? currentXP + (parseInt(manualAdd) || 0)
    : currentXP + calcShare;

  const handleSave = useCallback(() => {
    const canSave = mode === 'manual' ? !!manualAdd : !!totalSessionXP;
    if (!canSave) return;
    onSave(previewXP);
    onClose();
  }, [mode, manualAdd, totalSessionXP, previewXP, onSave, onClose]);

  useEffect(() => {
    lastActiveRef.current = document.activeElement as HTMLElement;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    setTimeout(() => {
      if (mode === 'manual') manualInputRef.current?.focus();
      else calcInputRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      lastActiveRef.current?.focus?.();
    };
  }, [mode, onClose, handleSave]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-slide-up">
        
        {/* Header */}
        <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <Trophy className="w-4 h-4" /> XP Manager
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
            <button 
                onClick={() => setMode('manual')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors 
                    ${mode === 'manual' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                `}
            >
                Manual
            </button>
            <button 
                onClick={() => setMode('calculator')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors 
                    ${mode === 'calculator' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                `}
            >
                Calculator
            </button>
        </div>
        
        <div className="p-6 space-y-6">
            
            {/* Current Status */}
            <div className="text-center mb-6">
                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Current XP</div>
                <div className="text-3xl font-mono text-white font-bold">{currentXP}</div>
            </div>

            {mode === 'manual' && (
                <div className="space-y-4 animate-fade-in">
                     <div>
                        <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">Add XP</label>
                        <div className="relative">
                            <Plus className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input 
                                ref={manualInputRef}
                                type="number" 
                                value={manualAdd} 
                                onChange={e => setManualAdd(e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-950 border border-slate-700 py-3 pl-10 pr-4 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-lg"
                            />
                        </div>
                     </div>
                </div>
            )}

            {mode === 'calculator' && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">Total Session XP (Gold + Monsters)</label>
                        <div className="relative">
                            <input 
                                ref={calcInputRef}
                                type="number" 
                                value={totalSessionXP} 
                                onChange={e => setTotalSessionXP(e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">PCs (Full Share)</label>
                            <div className="relative">
                                 <Users className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                 <input 
                                    type="number" 
                                    min="1"
                                    value={partySize} 
                                    onChange={e => setPartySize(parseInt(e.target.value) || 1)}
                                    className="w-full bg-slate-950 border border-slate-700 py-3 pl-10 pr-4 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-lg"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">Retainers (1/2 Share)</label>
                            <div className="relative">
                                 <UserMinus className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                 <input 
                                    type="number" 
                                    min="0"
                                    value={retainerCount} 
                                    onChange={e => setRetainerCount(parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-slate-700 py-3 pl-10 pr-4 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-purple-300">Share per Player:</span>
                            <span className="text-xl font-mono font-bold text-purple-400">+{calcShare}</span>
                        </div>
                        {retainerCount > 0 && (
                            <div className="flex justify-between items-center pt-2 border-t border-purple-500/20">
                                <span className="text-xs font-bold text-slate-400">Share per Retainer:</span>
                                <span className="text-sm font-mono font-bold text-slate-300">+{retainerShare}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Result Preview */}
            <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                 <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-500 font-bold">New Total</div>
                    <div className="text-xl font-mono text-white flex items-center gap-2">
                        {currentXP} <ArrowRight className="w-4 h-4 text-slate-600" /> <span className="text-emerald-400">{previewXP}</span>
                    </div>
                 </div>
                 <button 
                    onClick={handleSave}
                    disabled={mode === 'manual' ? !manualAdd : !totalSessionXP}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                 >
                    <Trophy className="w-4 h-4" />
                    <span>Apply XP</span>
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default XPCalculatorModal;