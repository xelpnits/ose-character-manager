import React, { useState, useRef, useEffect } from 'react';
import { Character, Item, AbilityScore, ItemCategory, Container } from '../../types';
import ConfirmDialog from './ConfirmDialog';
import StackSplitDialog from './StackSplitDialog';
import ImportExportControls from './ImportExportControls';
import { getCategoryIcon, getClassIcon } from '../../utils'; 
import { BANK_ID } from '../../types';
import { Plus, Trash2, ArrowRight, Shield, Heart, Crown, Coins, Sparkles, Users, PackageOpen, CheckCircle, Search, Box, Zap, HelpCircle, Landmark, Filter, Backpack, ChevronDown, ChevronRight, Activity, MoreHorizontal } from 'lucide-react';

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
  onGlobalAddItem?: (charId: string, containerId: string, item: Item) => void;
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

const GlobalAddItemModal: React.FC<{
    characters: Character[];
    onClose: () => void;
    onConfirm: (charId: string, containerId: string, item: Item) => void;
}> = ({ characters, onClose, onConfirm }) => {
    const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || BANK_ID);
    const [selectedContainerId, setSelectedContainerId] = useState<string>('');
    const [itemName, setItemName] = useState('');
    const [itemCount, setItemCount] = useState(1);

    const lastActiveRef = useRef<HTMLElement | null>(null);
    const initialFocusRef = useRef<HTMLInputElement>(null);
    
    const activeContainers: {id: string, name: string}[] = selectedCharId === BANK_ID 
        ? [{ id: 'VAULT', name: 'Vault' }] 
        : characters.find(c => c.id === selectedCharId)?.containers.map(c => ({ id: c.id, name: c.name })) || [];

    useEffect(() => {
        if (activeContainers.length > 0) setSelectedContainerId(activeContainers[0].id);
    }, [selectedCharId]);

    useEffect(() => {
        lastActiveRef.current = document.activeElement as HTMLElement;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        setTimeout(() => initialFocusRef.current?.focus(), 0);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            lastActiveRef.current?.focus?.();
        };
    }, [onClose]);

    const handleSubmit = () => {
        if (!itemName.trim()) return;
        const newItem: Item = {
            id: crypto.randomUUID(),
            name: itemName,
            count: itemCount,
            weight: 0,
            goldValue: 0,
            category: ItemCategory.General,
            isUnclaimed: false
        };
        onConfirm(selectedCharId, selectedContainerId, newItem);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-slide-up">
                 <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-500"/> Quick Add Item</h3>
                 </div>
                 <div className="p-6 space-y-4">
                     <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Owner</label>
                        <select 
                            value={selectedCharId} 
                            onChange={e => setSelectedCharId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500"
                        >
                            <option value={BANK_ID}>The Bank</option>
                            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Container</label>
                        <select 
                            value={selectedContainerId} 
                            onChange={e => setSelectedContainerId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500"
                        >
                            {activeContainers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Item Name</label>
                            <input 
                                ref={initialFocusRef}
                                type="text" 
                                value={itemName}
                                onChange={e => setItemName(e.target.value)}
                                placeholder="Torch, Rope..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500"
                            />
                        </div>
                        <div>
                             <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Count</label>
                             <input 
                                type="number" 
                                min="1"
                                value={itemCount}
                                onChange={e => setItemCount(parseInt(e.target.value) || 1)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 text-center"
                            />
                        </div>
                     </div>
                     <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-2 text-slate-400 hover:text-white transition-colors text-sm font-bold">Cancel</button>
                        <button onClick={handleSubmit} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">Add Item</button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const CharacterList: React.FC<CharacterListProps> = ({ characters, bank, onSelect, onDelete, onNew, onClaimLoot, onMoveItem, onExport, onImport, onGlobalAddItem }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'loot' | 'inventory'>('roster');
  const [showClaimConfirm, setShowClaimConfirm] = useState(false);
  const [showGlobalAdd, setShowGlobalAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Global Inventory State
  const [expandedCategories, setExpandedCategories] = useState<string[]>(Object.values(ItemCategory));

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

  const allItems = [...bankItems, ...characterItems];

  const toggleCategory = (cat: string) => {
      setExpandedCategories(prev => 
          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
      );
  };

  const handleClaimRequest = () => {
     setShowClaimConfirm(true);
  };

  const executeClaim = () => {
      onClaimLoot();
      setShowClaimConfirm(false);
  };

  const openItemMenuAt = (x: number, y: number, item: any) => {
      setContextMenu({
          x,
          y,
          item: item,
          sourceCharId: item.charId,
          sourceContainerId: item.containerId
      });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: any) => {
      e.preventDefault();
      openItemMenuAt(e.clientX, e.clientY, item);
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
                    <div className="h-28 bg-gradient-to-br from-slate-800 to-slate-900 relative p-6 border-b border-white/5 overflow-hidden">
                         {/* Class Icon - more visible */}
                        <div className="absolute top-2 right-2 p-2 bg-white/5 rounded-xl text-white/20 group-hover:text-white/40 group-hover:bg-white/10 transition-all">
                             {getClassIcon(char.class, "w-12 h-12")}
                        </div>
                        
                        <div className="relative z-10 flex flex-col justify-end h-full">
                            <h3 className="text-2xl font-serif font-bold text-white truncate group-hover:text-indigo-300 transition-colors pr-14">
                                {char.name || "Nameless"}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                                    {char.class}
                                </span>
                                <span className="text-xs font-bold text-slate-500">Lvl {char.level}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-6">
                        {/* Vitals Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Heart className="w-4 h-4 text-red-500" />
                                    <span className="text-xs text-slate-500 font-bold uppercase">HP</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-mono font-bold text-white">{char.hp}</span>
                                    <span className="text-slate-600 text-sm">/ {char.maxHp}</span>
                                </div>
                                {char.tempHp > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/30 w-fit animate-pulse-slow">
                                        <Activity className="w-3 h-3" /> +{char.tempHp} Temp
                                    </div>
                                )}
                            </div>
                            <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-4 h-4 text-indigo-500" />
                                    <span className="text-xs text-slate-500 font-bold uppercase">AC</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-mono font-bold text-white">
                                        {(char.ac || 9) + (char.acModifier || 0)}
                                    </span>
                                </div>
                                {(char.acModifier || 0) !== 0 && (
                                     <div className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/30 w-fit">
                                        Mod: {char.acModifier! > 0 ? '+' : ''}{char.acModifier}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attributes Mini-View */}
                        <div className="grid grid-cols-6 gap-1">
                            {(['STR', 'INT', 'WIS', 'DEX', 'CON', 'CHA'] as AbilityScore[]).map(stat => {
                                const mod = char.abilityModifiers?.[stat] || 0;
                                return (
                                <div key={stat} className="text-center">
                                    <div className="text-[9px] font-bold text-slate-500 mb-1">{stat}</div>
                                    <div className={`text-xs font-mono py-1 border rounded relative
                                        ${mod !== 0 ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'text-slate-300 bg-slate-800/50 border-white/5'}
                                    `}>
                                        {char.abilities[stat] + mod}
                                    </div>
                                </div>
                            )})}
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
                                        onDelete(char.id); 
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
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

      {/* ... Loot Tab ... */}

      {activeTab === 'inventory' && (
          <div className="animate-fade-in max-w-6xl mx-auto">
              <div className="glass-panel rounded-3xl p-1 bg-gradient-to-br from-emerald-950/20 to-slate-950/50 border border-emerald-500/20 shadow-2xl">
                 <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-serif text-emerald-400 flex items-center gap-3">
                            <Box className="w-6 h-6" /> Global Inventory
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Manage all items across party members. Grouped by category.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                        <button 
                             onClick={() => setShowGlobalAdd(true)}
                             className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 text-sm transition-all hover:scale-105"
                        >
                            <Plus className="w-4 h-4" /> Add Item
                        </button>

                        <div className="h-8 w-px bg-white/10 hidden sm:block mx-2"></div>

                        <div className="relative flex-grow sm:w-64">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search all items..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500"
                            />
                        </div>
                    </div>
                 </div>

                 <div className="bg-slate-950/50 min-h-[500px] rounded-b-3xl overflow-hidden p-4">
                    {/* Render by Category Hierarchy */}
                    {Object.values(ItemCategory).map(category => {
                        const itemsInCat = allItems.filter(i => 
                            (i.category === category || (!i.category && category === ItemCategory.General)) &&
                            i.name.toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        if (itemsInCat.length === 0) return null;

                        const isExpanded = expandedCategories.includes(category);

                        return (
                            <div key={category} className="mb-4 last:mb-0">
                                <button 
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between p-3 bg-slate-900/80 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {getCategoryIcon(category, "w-4 h-4 text-emerald-500")}
                                        <span className="font-bold text-white uppercase text-sm tracking-wider">{category}</span>
                                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{itemsInCat.length}</span>
                                    </div>
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500"/> : <ChevronRight className="w-4 h-4 text-slate-500"/>}
                                </button>

                                {isExpanded && (
                                    <div className="mt-2 grid grid-cols-1 gap-1 pl-4 animate-fade-in border-l border-slate-800">
                                        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-wider rounded-md mb-1">
                                            <div className="col-span-5">Item Name</div>
                                            <div className="col-span-2 text-center">Qty</div>
                                            <div className="col-span-5 text-right">Location</div>
                                        </div>
                                        {itemsInCat.map((item, idx) => (
                                            <div 
                                                key={`${item.charId}-${item.id}-${idx}`} 
                                                onContextMenu={(e) => handleItemContextMenu(e, item)}
                                                className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors items-center group cursor-context-menu ${item.isBank ? 'bg-amber-900/10 border border-amber-900/20' : 'bg-slate-900/40 border border-white/5'}`}
                                            >
                                                <div className="col-span-5 font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors truncate flex items-center gap-2">
                                                    {item.name}
                                                    {item.isMagical && <Zap className="w-3 h-3 text-purple-400 fill-current" />}
                                                    {item.isUnidentified && <HelpCircle className="w-3 h-3 text-cyan-400" />}
                                                </div>
                                                <div className="col-span-2 text-center font-mono text-slate-400 text-sm">
                                                    {item.count}
                                                </div>
                                                <div className="col-span-5 text-right flex items-start justify-end gap-2">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-xs font-bold flex items-center gap-1 ${item.isBank ? 'text-amber-500' : 'text-white'}`}>
                                                            {item.isBank ? <Landmark className="w-3 h-3" /> : <Users className="w-3 h-3 text-emerald-500" />} 
                                                            {item.charName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                            {item.containerName}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                                            openItemMenuAt(rect.right, rect.bottom, item);
                                                        }}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                                                        title="Actions"
                                                        aria-label="Actions"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {allItems.length === 0 && (
                        <div className="text-center py-20 text-slate-600 italic">No items found.</div>
                    )}
                 </div>
              </div>
          </div>
      )}
      
      {/* Modals and Dialogs... (same as before) */}
      {showGlobalAdd && onGlobalAddItem && (
          <GlobalAddItemModal 
            characters={characters}
            onClose={() => setShowGlobalAdd(false)}
            onConfirm={(charId, contId, item) => {
                onGlobalAddItem(charId, contId, item);
                setShowGlobalAdd(false);
            }}
          />
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