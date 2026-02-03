import React, { useState, useRef, useEffect } from 'react';
import { Character, Item, AbilityScore, ItemCategory } from '../types';
import ConfirmDialog from './ConfirmDialog';
import StackSplitDialog from './StackSplitDialog';
import ImportExportControls from './ImportExportControls';
import { BANK_ID } from '../App';
import { Plus, Trash2, ArrowRight, Shield, Heart, Crown, Coins, Sparkles, Users, PackageOpen, CheckCircle, Search, Box, Zap, HelpCircle, Landmark, Filter } from 'lucide-react';

interface CharacterListProps {
  characters: Character[];
  bank: Item[];
  onSelect: (char: Character) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClaimLoot: () => void;
  onMoveItem: (sourceCharId: string, sourceContainerId: string, itemId: string, targetCharId: string, quantity: number) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

// Simple Context Menu
const InventoryContextMenu: React.FC<{
    x: number;
    y: number;
    item: Item;
    sourceCharId: string;
    targetCharacters: Character[];
    onClose: () => void;
    onMoveToCharacter: (targetCharId: string) => void;
  }> = ({ x, y, item, sourceCharId, targetCharacters, onClose, onMoveToCharacter }) => {
    const menuRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);
  
    // Adjust for viewport
    const adjustedX = Math.min(x, window.innerWidth - 220);
    const adjustedY = Math.min(y, window.innerHeight - 300);
  
    return (
      <div 
          ref={menuRef}
          style={{ top: adjustedY, left: adjustedX }}
          className="fixed z-[100] w-56 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl py-1 text-sm animate-fade-in flex flex-col ring-1 ring-white/10"
      >
          <div className="px-3 py-3 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
              <span className="font-bold text-white block truncate">{item.name}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Move to...</span>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
              {/* Send to Bank Option (if source is not bank) */}
              {sourceCharId !== BANK_ID && (
                  <button 
                      onClick={() => onMoveToCharacter(BANK_ID)}
                      className="w-full text-left px-4 py-3 hover:bg-amber-900/20 flex items-center text-amber-200 truncate hover:text-amber-100 transition-colors border-b border-white/5"
                  >
                      <Landmark className="w-3 h-3 mr-3 text-amber-500"/> The Bank
                  </button>
              )}

              {targetCharacters.filter(c => c.id !== sourceCharId).map(c => (
                  <button 
                      key={c.id} 
                      onClick={() => onMoveToCharacter(c.id)} 
                      className="w-full text-left px-4 py-3 hover:bg-indigo-600/20 flex items-center text-slate-300 truncate hover:text-indigo-300 transition-colors border-b border-white/5 last:border-0"
                  >
                      <Users className="w-3 h-3 mr-3 text-slate-500"/> {c.name}
                  </button>
              ))}
          </div>
          
          <button onClick={onClose} className="text-center px-4 py-2 hover:bg-slate-800 text-xs text-slate-500 hover:text-white transition-colors rounded-b-xl border-t border-slate-700 w-full">
              Cancel
          </button>
      </div>
    );
  };

const CharacterList: React.FC<CharacterListProps> = ({ characters, bank, onSelect, onDelete, onNew, onClaimLoot, onMoveItem, onExport, onImport }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'loot' | 'inventory'>('roster');
  const [showClaimConfirm, setShowClaimConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ItemCategory | 'ALL' | 'MAGIC'>('ALL');
  
  // Interaction State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: Item, sourceCharId: string, sourceContainerId: string } | null>(null);
  const [splitDialog, setSplitDialog] = useState<{ isOpen: boolean, item: Item | null, targetId: string, targetName: string } | null>(null);

  // Calculate Global Loot (New Items only)
  const newLootItems = characters.flatMap(char => 
    char.containers.flatMap(cont => 
        cont.items
            .filter(i => i.isUnclaimed && (i.goldValue || 0) > 0)
            .map(i => ({ ...i, carrierName: char.name, containerName: cont.name }))
    )
  );

  const totalLootValue = newLootItems.reduce((acc, item) => acc + ((item.goldValue || 0) * item.count), 0);

  // Flattened All Items for Global Inventory
  const characterItems = characters.flatMap(char => 
    char.containers.flatMap(cont => 
        cont.items.map(i => ({
            ...i,
            charId: char.id,
            charName: char.name,
            containerId: cont.id,
            containerName: cont.name,
            isBank: false
        }))
    )
  );

  const bankItems = bank.map(i => ({
      ...i,
      charId: BANK_ID,
      charName: 'The Bank',
      containerId: 'VAULT',
      containerName: 'Vault',
      isBank: true
  }));

  const allItems = [...bankItems, ...characterItems].filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (filterCategory === 'MAGIC') {
          matchesCategory = !!i.isMagical;
      } else if (filterCategory !== 'ALL') {
          matchesCategory = i.category === filterCategory;
      }

      return matchesSearch && matchesCategory;
  });

  const handleClaimRequest = () => {
     setShowClaimConfirm(true);
  };

  const executeClaim = () => {
      onClaimLoot();
      setShowClaimConfirm(false);
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: any) => {
      e.preventDefault();
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          item: item,
          sourceCharId: item.charId,
          sourceContainerId: item.containerId
      });
  };

  const initiateMove = (targetId: string) => {
      if (!contextMenu) return;

      const item = contextMenu.item;
      const targetName = targetId === BANK_ID ? 'The Bank' : characters.find(c => c.id === targetId)?.name || 'Unknown';
      
      setContextMenu(null); // Close menu

      if (item.count > 1) {
          setSplitDialog({
              isOpen: true,
              item: item,
              targetId: targetId,
              targetName: targetName
          });
      } else {
          // Direct move if stack is 1
          onMoveItem(contextMenu.sourceCharId, contextMenu.sourceContainerId, item.id, targetId, 1);
      }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      {/* Hero Header */}
      <div className="flex flex-col xl:flex-row justify-between items-end mb-12 relative">
        <div className="relative z-10 w-full xl:w-auto mb-6 xl:mb-0">
            <h1 className="text-6xl md:text-7xl serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-2 tracking-tight drop-shadow-lg">
                Roster
            </h1>
            <div className="flex items-center gap-4">
                <p className="text-indigo-300/80 font-medium text-lg tracking-wide uppercase flex items-center gap-2">
                    <Crown className="w-4 h-4" /> Old School Essentials
                </p>
                <div className="h-4 w-px bg-white/10"></div>
                <ImportExportControls onExport={onExport} onImport={onImport} />
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-4 w-full xl:w-auto">
             {/* Tab Switcher */}
             <div className="flex flex-wrap justify-end bg-slate-900/80 p-1 rounded-xl border border-white/10 shadow-xl backdrop-blur-md w-full xl:w-auto">
                <button 
                    onClick={() => setActiveTab('roster')}
                    className={`flex-1 xl:flex-none px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'roster' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Users className="w-4 h-4" /> Heroes
                </button>
                <button 
                    onClick={() => setActiveTab('loot')}
                    className={`flex-1 xl:flex-none px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'loot' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Sparkles className="w-4 h-4" /> Party Loot
                    {newLootItems.length > 0 && (
                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                            {newLootItems.length}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`flex-1 xl:flex-none px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'inventory' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Box className="w-4 h-4" /> Global Inv.
                </button>
             </div>
        </div>
      </div>

      {activeTab === 'roster' && (
        <>
            <div className="flex justify-end mb-8">
                <button 
                onClick={onNew}
                className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-indigo-600 font-sans rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                >
                <span className="mr-2">New Character</span>
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            {characters.length === 0 ? (
                <div className="glass-panel rounded-3xl p-16 text-center border-dashed border-2 border-slate-700 flex flex-col items-center justify-center animate-fade-in">
                <div className="bg-slate-800/50 p-6 rounded-full mb-6 ring-1 ring-white/10">
                    <Heart className="w-12 h-12 text-slate-500" />
                </div>
                <h2 className="text-3xl serif font-semibold text-white mb-2">The Tavern is Empty</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">Your adventures have not yet begun. Create your first hero to conquer the darkness.</p>
                <button onClick={onNew} className="text-indigo-400 font-bold hover:text-indigo-300 underline underline-offset-4 decoration-2">
                    Create Character
                </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {characters.map((char, index) => (
                    <div 
                        key={char.id} 
                        onClick={() => onSelect(char)}
                        className="group relative h-full glass-panel rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 glass-card animate-slide-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                    {/* Card Header / Class Banner */}
                    <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 relative p-6 border-b border-white/5">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Shield className="w-24 h-24 rotate-12" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white truncate relative z-10 group-hover:text-indigo-300 transition-colors">
                            {char.name || "Nameless"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 relative z-10">
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                                {char.class}
                            </span>
                            <span className="text-xs font-bold text-slate-500">Lvl {char.level}</span>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-6">
                        {/* Vitals Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                                <div className="bg-red-500/20 p-2 rounded-lg text-red-400">
                                    <Heart className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase block">HP</span>
                                    <span className="text-lg font-mono font-bold text-white">{char.hp} <span className="text-slate-600 text-sm">/ {char.maxHp}</span></span>
                                </div>
                            </div>
                            <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                                    <Shield className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 font-bold uppercase block">AC</span>
                                    <span className="text-lg font-mono font-bold text-white">{char.ac}</span>
                                </div>
                            </div>
                        </div>

                        {/* Attributes Mini-View */}
                        <div className="grid grid-cols-6 gap-1">
                            {(['STR', 'INT', 'WIS', 'DEX', 'CON', 'CHA'] as AbilityScore[]).map(stat => (
                                <div key={stat} className="text-center">
                                    <div className="text-[9px] font-bold text-slate-500 mb-1">{stat}</div>
                                    <div className="text-xs font-mono text-slate-300 bg-slate-800/50 rounded py-1 border border-white/5">
                                        {char.abilities[stat]}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Footer Action */}
                        <div className="pt-4 flex items-center justify-between border-t border-white/5">
                            <span className="text-xs text-slate-500 italic truncate max-w-[150px]">
                                {char.backstory ? `"${char.backstory}"` : "No legend yet..."}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        console.log('[CharacterList] Delete clicked for', char.id);
                                        onDelete(char.id); 
                                    }}
                                    onMouseDown={(e) => {
                                        // Critical: Stop parent from seeing mousedown
                                        e.stopPropagation();
                                    }}
                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-20 relative cursor-pointer"
                                    title="Delete Character"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-900/50 group-hover:scale-110 transition-transform">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </>
      )}

      {activeTab === 'loot' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
              <div className="glass-panel rounded-3xl p-1 bg-gradient-to-br from-amber-950/20 to-slate-950/50 border border-amber-500/20 shadow-2xl">
                {/* Loot Header */}
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-serif text-amber-500 mb-2 flex items-center gap-3">
                                <Coins className="w-8 h-8" /> War Spoils & Treasure
                            </h2>
                            <p className="text-slate-400 max-w-xl leading-relaxed">
                                This lists all items from all characters marked as "New". 
                                Manually transfer the total to your character sheets and confirm to clear the list.
                            </p>
                        </div>
                        <div className="bg-amber-500/10 px-6 py-4 rounded-2xl border border-amber-500/20 text-center">
                            <div className="text-xs text-amber-500 uppercase tracking-widest font-bold mb-1">Total Value</div>
                            <div className="text-4xl font-mono font-bold text-amber-400 drop-shadow-lg">{totalLootValue} <span className="text-lg text-amber-600">GP/XP</span></div>
                        </div>
                    </div>
                </div>

                {/* Loot List */}
                <div className="bg-slate-950/50 min-h-[400px] border-y border-white/5 overflow-y-auto p-4 space-y-3">
                    {newLootItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-600 opacity-70">
                            <PackageOpen className="w-16 h-16 mb-4" />
                            <p className="font-serif text-xl">All settled.</p>
                            <p className="text-sm">Mark items as "New" in inventory to see them here.</p>
                        </div>
                    ) : (
                        newLootItems.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200 text-lg">{item.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-indigo-400"><Users className="w-3 h-3" /> {item.carrierName}</span>
                                            <span>•</span>
                                            <span>{item.containerName}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                     <div className="text-right">
                                        <div className="text-xs text-slate-500 uppercase font-bold">Value</div>
                                        <div className="font-mono text-amber-400 font-bold">{item.goldValue} GP <span className="text-slate-600">x{item.count}</span></div>
                                     </div>
                                     <div className="w-px h-8 bg-white/10"></div>
                                     <div className="text-right w-24">
                                        <div className="text-xs text-slate-500 uppercase font-bold">Sum</div>
                                        <div className="font-mono text-white font-bold text-xl">{(item.goldValue || 0) * item.count}</div>
                                     </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Loot Footer Actions */}
                <div className="p-6 bg-slate-900/80 flex justify-end items-center gap-4">
                     <span className="text-xs text-slate-500 italic mr-auto">
                        * Action only clears "New" status. Gold & XP are not auto-added.
                     </span>
                     
                     <button 
                        onClick={handleClaimRequest}
                        disabled={totalLootValue === 0}
                        className="flex items-center gap-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all hover:scale-105 active:scale-95"
                     >
                        <CheckCircle className="w-6 h-6" />
                        <span>Claim All (Clear)</span>
                     </button>
                </div>
              </div>
          </div>
      )}

      {activeTab === 'inventory' && (
          <div className="animate-fade-in max-w-6xl mx-auto">
              <div className="glass-panel rounded-3xl p-1 bg-gradient-to-br from-emerald-950/20 to-slate-950/50 border border-emerald-500/20 shadow-2xl">
                 <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-serif text-emerald-400 flex items-center gap-3">
                            <Box className="w-6 h-6" /> Global Inventory
                        </h2>
                        <p className="text-slate-400 text-sm">
                            All items from all party members and the bank. Right-click to redistribute.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                             <div className="absolute left-3 top-3 pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-500" />
                             </div>
                             <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value as ItemCategory | 'ALL' | 'MAGIC')}
                                className="w-full sm:w-40 bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 appearance-none cursor-pointer"
                             >
                                <option value="ALL">All Categories</option>
                                <option value="MAGIC">Magic Items (All)</option>
                                {Object.values(ItemCategory).map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                        <div className="relative flex-grow sm:w-64">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500"
                            />
                        </div>
                    </div>
                 </div>

                 <div className="bg-slate-950/50 min-h-[500px] rounded-b-3xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <div className="col-span-4">Item</div>
                        <div className="col-span-2 text-center">Count</div>
                        <div className="col-span-2 text-center">Weight</div>
                        <div className="col-span-4 text-right">Owner & Location</div>
                    </div>
                    
                    <div className="overflow-y-auto max-h-[600px]">
                        {allItems.length === 0 ? (
                             <div className="text-center py-20 text-slate-600 italic">No items found.</div>
                        ) : (
                            allItems.map((item, idx) => (
                                <div 
                                    key={`${item.charId}-${item.id}-${idx}`} 
                                    onContextMenu={(e) => handleItemContextMenu(e, item)}
                                    className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center group cursor-context-menu ${item.isBank ? 'bg-amber-900/10' : ''}`}
                                >
                                    <div className="col-span-4 font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors truncate flex items-center gap-2">
                                        {item.name}
                                        {item.isBank && <Landmark className="w-3 h-3 text-amber-500" />}
                                        {item.category && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{item.category}</span>}
                                        {item.isMagical && <Zap className="w-3 h-3 text-purple-400 fill-current" />}
                                        {item.isUnidentified && <HelpCircle className="w-3 h-3 text-cyan-400" />}
                                    </div>
                                    <div className="col-span-2 text-center font-mono text-slate-400 text-sm bg-slate-900/50 rounded py-1 mx-2">
                                        {item.count}
                                    </div>
                                    <div className="col-span-2 text-center font-mono text-slate-400 text-sm">
                                        {item.weight} cn
                                    </div>
                                    <div className="col-span-4 text-right flex flex-col items-end">
                                        <span className={`text-xs font-bold flex items-center gap-1 ${item.isBank ? 'text-amber-500' : 'text-white'}`}>
                                            {item.isBank ? <Landmark className="w-3 h-3" /> : <Users className="w-3 h-3 text-emerald-500" />} 
                                            {item.charName}
                                        </span>
                                        <span className="text-[10px] text-slate-500">{item.containerName}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
              </div>
          </div>
      )}

      <ConfirmDialog 
        isOpen={showClaimConfirm}
        title="Claim Loot?"
        message={`Have you recorded ${totalLootValue} XP/Gold? The items will now be marked as "claimed" and removed from this list.`}
        confirmLabel="Claim"
        onConfirm={executeClaim}
        onCancel={() => setShowClaimConfirm(false)}
      />
      
      {contextMenu && (
          <InventoryContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            item={contextMenu.item}
            sourceCharId={contextMenu.sourceCharId}
            targetCharacters={characters}
            onClose={() => setContextMenu(null)}
            onMoveToCharacter={(targetId) => initiateMove(targetId)}
          />
      )}

      {splitDialog && (
          <StackSplitDialog 
              isOpen={splitDialog.isOpen}
              item={splitDialog.item}
              targetName={splitDialog.targetName}
              onCancel={() => setSplitDialog(null)}
              onConfirm={(count) => {
                  onMoveItem(
                      (splitDialog.item as any).charId, 
                      (splitDialog.item as any).containerId,
                      splitDialog.item!.id,
                      splitDialog.targetId,
                      count
                  );
                  setSplitDialog(null);
              }}
          />
      )}

    </div>
  );
};

export default CharacterList;