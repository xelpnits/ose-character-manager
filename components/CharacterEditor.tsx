import React, { useEffect, useState } from 'react';
import { Character, OSEClass, Alignment, AbilityScore, Container, Item } from '../types';
import { ABILITY_LABELS, CLASS_OPTIONS, LEVEL_1_SAVES } from '../constants';
import StatInput from './StatInput';
import InventoryManager from './InventoryManager';
import XPCalculatorModal from './XPCalculatorModal';
import { ArrowLeft, Shield, Heart, Skull, Zap, Trophy, CloudLightning, Calculator } from 'lucide-react';

interface CharacterEditorProps {
  character: Character;
  otherCharacters: Character[]; 
  onUpdate: (char: Character) => void;
  onBack: () => void;
  onTransferItem: (targetCharId: string, item: Item) => void;
}

const CharacterEditor: React.FC<CharacterEditorProps> = ({ 
  character, 
  otherCharacters,
  onUpdate, 
  onBack, 
  onTransferItem,
}) => {
  const [showXPModal, setShowXPModal] = useState(false);

  // Auto-apply saves for level 1 if changing class
  useEffect(() => {
    if (character.level === 1 && LEVEL_1_SAVES[character.class]) {
        // Only update if saves are different to avoid infinite loops
        const currentSaves = JSON.stringify(character.savingThrows);
        const newSaves = JSON.stringify(LEVEL_1_SAVES[character.class]);
        if (currentSaves !== newSaves) {
            onUpdate({ ...character, savingThrows: LEVEL_1_SAVES[character.class] });
        }
    }
  }, [character.class, character.level]);

  const handleStatChange = (stat: AbilityScore, val: number) => {
    onUpdate({
      ...character,
      abilities: { ...character.abilities, [stat]: val }
    });
  };

  const handleInventoryChange = (newContainers: Container[]) => {
    onUpdate({ ...character, containers: newContainers });
  };

  return (
    <div className="min-h-screen bg-arcane-950 pb-24 text-slate-200">
      
      {/* 1. Sticky Command Bar */}
      <div className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Back to Roster"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline font-semibold">Back</span>
                </button>
                <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
                
                {/* Live Name Editor */}
                <input 
                  type="text" 
                  value={character.name} 
                  onChange={e => onUpdate({...character, name: e.target.value})}
                  className="bg-transparent border-none text-lg font-serif font-bold text-white placeholder-slate-600 focus:ring-0 px-0 w-48 sm:w-auto truncate"
                  placeholder="Character Name"
                />
            </div>

            <div className="flex items-center gap-3">
                {/* Auto-Save Indicator */}
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-emerald-500/80 mr-4">
                    <CloudLightning className="w-3 h-3" />
                    <span className="hidden sm:inline">Auto-Save Active</span>
                </div>

                <div className="hidden md:flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-1.5 border border-white/5">
                     <span className="text-xs text-slate-400 uppercase font-bold">Lvl</span>
                     <input 
                        type="number" 
                        value={character.level}
                        onChange={e => onUpdate({...character, level: parseInt(e.target.value) || 1})}
                        className="w-10 bg-transparent text-center font-mono font-bold text-white border-none p-0 focus:ring-0"
                     />
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* COLUMN 1: THE SOUL (Attributes & Identity) */}
            <div className="xl:col-span-3 space-y-6">
                
                {/* Identity Card */}
                <div className="glass-panel rounded-2xl p-5 space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Identity
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Class</label>
                            <select 
                                value={character.class} 
                                onChange={e => onUpdate({...character, class: e.target.value as OSEClass})}
                                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5 focus:border-indigo-500"
                            >
                                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Alignment</label>
                            <select 
                                value={character.alignment} 
                                onChange={e => onUpdate({...character, alignment: e.target.value as Alignment})}
                                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5 focus:border-indigo-500"
                            >
                                {Object.values(Alignment).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Attributes Grid */}
                <div className="glass-panel rounded-2xl p-5">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Abilities</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {(Object.keys(character.abilities) as AbilityScore[]).map(key => (
                            <StatInput 
                                key={key} 
                                label={ABILITY_LABELS[key]} 
                                value={character.abilities[key]} 
                                onChange={(val) => handleStatChange(key, val)} 
                            />
                        ))}
                    </div>
                </div>

                {/* Saves */}
                <div className="glass-panel rounded-2xl p-5">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                        <Skull className="w-3 h-3" /> Saving Throws
                    </h2>
                    <div className="space-y-1">
                        {Object.entries(character.savingThrows).map(([saveName, val]) => (
                            <div key={saveName} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg transition-colors group">
                                <span className="capitalize text-sm text-slate-400 group-hover:text-white transition-colors">
                                    {saveName === 'death' ? 'Death / Poison' : 
                                    saveName === 'wands' ? 'Wands' :
                                    saveName === 'paralysis' ? 'Paralysis' :
                                    saveName === 'breath' ? 'Breath' : 'Spells'}
                                </span>
                                <input 
                                    type="number" 
                                    value={val}
                                    onChange={(e) => onUpdate({
                                        ...character, 
                                        savingThrows: { ...character.savingThrows, [saveName]: parseInt(e.target.value)}
                                    })}
                                    className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-sm font-mono text-white focus:border-indigo-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* COLUMN 2: THE BODY (Combat & Story) */}
            <div className="xl:col-span-5 space-y-6">
                
                {/* Combat Vitals */}
                <div className="grid grid-cols-2 gap-4">
                    {/* HP Card */}
                    <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Heart className="w-24 h-24 text-red-500" />
                        </div>
                        <label className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2 block">Hit Points</label>
                        <div className="flex items-end gap-2">
                            <input 
                                type="number" 
                                value={character.hp}
                                onChange={e => onUpdate({...character, hp: parseInt(e.target.value)})}
                                className="w-20 bg-transparent text-5xl font-serif font-bold text-white border-none p-0 focus:ring-0 placeholder-slate-700"
                            />
                            <span className="text-2xl text-slate-500 font-serif mb-2">/</span>
                            <input 
                                type="number" 
                                value={character.maxHp}
                                onChange={e => onUpdate({...character, maxHp: parseInt(e.target.value)})}
                                className="w-16 bg-transparent text-3xl font-serif text-slate-500 border-none p-0 mb-1 focus:ring-0 focus:text-white transition-colors"
                            />
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-500 transition-all duration-500" 
                                style={{ width: `${Math.min(100, (character.hp / character.maxHp) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* AC Card */}
                    <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between">
                         <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Shield className="w-24 h-24 text-indigo-500" />
                        </div>
                        <label className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 block">Armor Class</label>
                        <input 
                            type="number" 
                            value={character.ac}
                            onChange={e => onUpdate({...character, ac: parseInt(e.target.value)})}
                            className="w-full bg-transparent text-6xl font-serif font-bold text-white border-none p-0 focus:ring-0 text-center"
                        />
                    </div>
                </div>
                
                 {/* Wealth & XP Banner */}
                 <div className="grid grid-cols-1 gap-4">
                    {/* XP Card - Now Full Width since Gold is gone */}
                    <div 
                        onClick={() => setShowXPModal(true)}
                        className="glass-panel rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-purple-500 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors group relative"
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-purple-500/20 p-1.5 rounded-md text-purple-400">
                                <Calculator className="w-3 h-3" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-4 h-4 text-purple-500" />
                            <span className="text-[10px] uppercase font-bold text-purple-500 tracking-widest">XP</span>
                        </div>
                        <input 
                            type="number" 
                            value={character.xp}
                            readOnly
                            className="bg-transparent text-3xl font-mono text-purple-400 w-full focus:ring-0 border-none p-0 cursor-pointer pointer-events-none"
                        />
                    </div>
                </div>

                {/* Backstory / Notes */}
                <div className="glass-panel rounded-2xl p-1 min-h-[200px] flex flex-col">
                    <div className="px-4 py-3 border-b border-white/5 bg-white/5 rounded-t-xl">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Chronicle & Notes</h2>
                    </div>
                    <textarea 
                        value={character.backstory}
                        onChange={e => onUpdate({...character, backstory: e.target.value})}
                        className="flex-grow w-full bg-transparent border-none p-4 text-slate-300 focus:ring-0 leading-relaxed font-serif text-lg resize-y min-h-[150px]"
                        placeholder="The story begins here..."
                    />
                </div>
            </div>

            {/* COLUMN 3: THE BELONGINGS (Inventory) */}
            <div className="xl:col-span-4 space-y-6">
                 <InventoryManager 
                    containers={character.containers || []} 
                    otherCharacters={otherCharacters}
                    onChange={handleInventoryChange} 
                    onTransferItem={onTransferItem}
                />
            </div>

        </div>
      </div>
      
      {showXPModal && (
          <XPCalculatorModal 
              currentXP={character.xp}
              defaultPartySize={otherCharacters.length + 1}
              onSave={(newXP) => onUpdate({...character, xp: newXP})}
              onClose={() => setShowXPModal(false)}
          />
      )}

    </div>
  );
};

export default CharacterEditor;