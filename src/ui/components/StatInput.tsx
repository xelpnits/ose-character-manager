import React from 'react';
import { getModifier, formatModifier } from '../../constants';

interface StatInputProps {
  label: string;
  value: number;
  modifier?: number;
  onChange: (val: number) => void;
  onModifierChange?: (val: number) => void;
}

const StatInput: React.FC<StatInputProps> = ({ label, value, modifier = 0, onChange, onModifierChange }) => {
  // Effective Score = Base + Temp Modifier
  const effectiveValue = value + modifier;
  const mod = getModifier(effectiveValue);
  const isPositive = mod > 0;
  const isNegative = mod < 0;
  
  return (
    <div className="relative group bg-slate-900/50 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-between transition-all hover:border-indigo-500/50 hover:bg-slate-800">
      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 group-hover:text-indigo-400 transition-colors">{label}</label>
      
      <div className="relative w-full flex justify-center my-1 items-end gap-1">
        <input
          type="number"
          min="3"
          max="18"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 10)}
          className="w-full bg-transparent text-center font-serif text-3xl font-bold text-white focus:outline-none appearance-none m-0 p-0 z-10 cursor-pointer"
        />
        
        {/* Temp Modifier Input */}
        {onModifierChange && (
            <div className="absolute -right-1 bottom-1 flex flex-col items-center group/temp">
                 <input 
                    type="number"
                    value={modifier === 0 ? '' : modifier}
                    placeholder="±"
                    onChange={(e) => onModifierChange(parseInt(e.target.value) || 0)}
                    className={`w-8 text-[10px] font-bold text-center bg-slate-950 border rounded focus:ring-1 focus:ring-cyan-500 outline-none
                        ${modifier !== 0 ? 'border-cyan-500/50 text-cyan-400' : 'border-transparent text-slate-600 hover:border-slate-700'}
                    `}
                 />
            </div>
        )}
      </div>

      <div className="flex gap-1 items-center">
        <div className={`
            text-xs font-mono font-bold px-2 py-0.5 rounded-full border 
            ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
            isNegative ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
            'bg-slate-700/50 text-slate-400 border-slate-600'}
        `}>
            {formatModifier(mod)}
        </div>
        {modifier !== 0 && (
             <span className="text-[9px] text-cyan-500 font-bold animate-pulse" title="Includes Temporary Modifiers">
                (Adj)
             </span>
        )}
      </div>
    </div>
  );
};

export default StatInput;