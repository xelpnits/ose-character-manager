import React, { useState, useRef, useEffect } from 'react';
import { Container, Item, Character, ItemCategory, ContainerType } from '../../types';
import ConfirmDialog from './ConfirmDialog';
import StackSplitDialog from './StackSplitDialog';
import { getCategoryIcon, calculateTotalItems, calculateTotalWeight, calculateContainerWeight } from '../../utils';
import { 
  Plus, 
  Trash2, 
  Box, 
  Briefcase, 
  Backpack, 
  Shirt,
  X,
  Sword,
  Shield,
  Scale,
  MoveRight,
  User,
  Edit2,
  PackageOpen,
  Coins,
  Sparkles,
  Zap,
  HelpCircle,
  AlertTriangle,
  Archive,
  Layers,
  MoreHorizontal
} from 'lucide-react';

interface InventoryManagerProps {
  containers: Container[];
  otherCharacters: Character[];
  onChange: (containers: Container[]) => void;
  onUndoableChange?: (containers: Container[], message: string) => void;
  onTransferItem: (targetCharId: string, item: Item) => void;
}

// --- Context Menu ---
const ContextMenu: React.FC<{
  x: number;
  y: number;
  item: Item;
  containerId: string;
  containers: Container[];
  otherCharacters: Character[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToContainer: (targetContainerId: string) => void;
  onGiveToCharacter: (targetCharId: string) => void;
}> = ({ x, y, item, containerId, containers, otherCharacters, onClose, onEdit, onDelete, onMoveToContainer, onGiveToCharacter }) => {
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

  // Adjust for viewport edges (simple version)
  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div 
        ref={menuRef}
        style={{ top: adjustedY, left: adjustedX }}
        className="fixed z-[100] w-60 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl py-1 text-sm animate-fade-in flex flex-col ring-1 ring-white/10"
    >
        <div className="px-3 py-3 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
            <span className="font-bold text-white block truncate">{item.name}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Actions</span>
        </div>
        
        <button onClick={onEdit} className="text-left px-4 py-2.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center text-slate-300 transition-colors w-full">
            <Edit2 className="w-4 h-4 mr-3 text-slate-500"/> Edit
        </button>
        
        <div className="border-t border-slate-800 my-1"></div>
        <div className="px-4 py-1.5 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Move to</div>
        {containers.filter(c => c.id !== containerId).map(c => (
             <button key={c.id} onClick={() => onMoveToContainer(c.id)} className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center text-slate-400 truncate hover:text-white transition-colors">
                <MoveRight className="w-3 h-3 mr-3 text-slate-600"/> {c.name}
             </button>
        ))}
        
        {otherCharacters.length > 0 && (
            <>
                <div className="border-t border-slate-800 my-1"></div>
                <div className="px-4 py-1.5 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Give to</div>
                {otherCharacters.map(c => (
                    <button key={c.id} onClick={() => onGiveToCharacter(c.id)} className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center text-slate-400 truncate hover:text-white transition-colors">
                        <User className="w-3 h-3 mr-3 text-slate-600"/> {c.name}
                    </button>
                ))}
            </>
        )}

        <div className="border-t border-slate-800 my-1"></div>
        <button onClick={onDelete} className="text-left px-4 py-2.5 hover:bg-red-900/20 hover:text-red-400 flex items-center text-red-500 w-full transition-colors rounded-b-xl">
            <Trash2 className="w-4 h-4 mr-3"/> Delete
        </button>
    </div>
  );
};

// --- Item Modal ---
const ItemDetailModal: React.FC<{
  item: Item;
  onClose: () => void;
  onSave: (updates: Partial<Item>) => void;
}> = ({ item, onClose, onSave }) => {
  const [data, setData] = useState({ 
    ...item,
    goldValue: item.goldValue || 0,
    isUnclaimed: item.isUnclaimed ?? false,
    category: item.category || ItemCategory.General,
    isMagical: item.isMagical ?? false,
    isUnidentified: item.isUnidentified ?? false,
    charges: item.charges || 0,
    maxCharges: item.maxCharges || 0
  });

  const lastActiveRef = useRef<HTMLElement | null>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
        <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <Box className="w-4 h-4" /> Item Details
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">Item Name</label>
            <input 
              ref={initialFocusRef}
              type="text" 
              value={data.name} 
              onChange={e => setData({...data, name: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold text-lg"
            />
          </div>

          {/* Properties / Magic Section */}
          <div className="flex gap-2">
             <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${data.category === ItemCategory.General ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                 <select 
                    value={data.category} 
                    onChange={e => setData({...data, category: e.target.value as ItemCategory})}
                    className="bg-transparent border-none text-white text-xs font-bold uppercase focus:ring-0 cursor-pointer w-full text-center appearance-none"
                 >
                    {Object.values(ItemCategory).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
             </label>

             <button 
                onClick={() => setData({...data, isMagical: !data.isMagical})}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${data.isMagical ? 'bg-purple-900/40 border-purple-500 text-purple-300' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-purple-500/50'}`}
             >
                 <Zap className={`w-4 h-4 ${data.isMagical ? 'fill-current' : ''}`} />
                 <span className="text-[10px] font-bold uppercase">Magical</span>
             </button>

             <button 
                onClick={() => setData({...data, isUnidentified: !data.isUnidentified})}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${data.isUnidentified ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-cyan-500/50'}`}
             >
                 <HelpCircle className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase">Unknown</span>
             </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">Count</label>
                <input 
                  type="number" 
                  value={data.count} 
                  onChange={e => setData({...data, count: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500"
                />
             </div>
             <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">Weight (cn)</label>
                <input 
                  type="number" 
                  value={data.weight} 
                  onChange={e => setData({...data, weight: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500"
                />
             </div>
          </div>
          
           {/* Charges (Mostly for Magic Items but available for all if needed) */}
           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2 flex items-center"><Zap className="w-3 h-3 mr-1 text-yellow-500"/> Charges</label>
                <input 
                  type="number" 
                  value={data.charges || ''} 
                  onChange={e => setData({...data, charges: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500"
                />
             </div>
             <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2 flex items-center text-slate-600">Max Charges</label>
                <input 
                  type="number" 
                  value={data.maxCharges || ''} 
                  onChange={e => setData({...data, maxCharges: parseInt(e.target.value) || 0})}
                  placeholder="-"
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-slate-400 focus:border-indigo-500"
                />
             </div>
          </div>

          {/* Conditional Stats based on Category */}
          {(data.category === ItemCategory.Weapon || data.category === ItemCategory.Armor || data.damage || data.armor) && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2 flex items-center"><Sword className="w-3 h-3 mr-1"/> Damage</label>
                    <input 
                    type="text" 
                    value={data.damage || ''} 
                    onChange={e => setData({...data, damage: e.target.value})}
                    placeholder="e.g. 1d8"
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2 flex items-center"><Shield className="w-3 h-3 mr-1"/> AC Bonus</label>
                    <input 
                    type="number" 
                    value={data.armor || ''} 
                    onChange={e => setData({...data, armor: parseInt(e.target.value) || undefined})}
                    placeholder="-"
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500"
                    />
                </div>
              </div>
          )}

          {/* Treasure Section */}
          <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-xl space-y-4">
              <h4 className="text-[10px] uppercase text-amber-500 font-bold tracking-widest flex items-center gap-2">
                  <Coins className="w-3 h-3" /> Value & XP
              </h4>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">Value (GP)</label>
                    <input 
                    type="number" 
                    value={data.goldValue} 
                    onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        const shouldBeUnclaimed = val > 0 && data.isUnclaimed === false;
                        setData({...data, goldValue: val, isUnclaimed: shouldBeUnclaimed ? true : data.isUnclaimed});
                    }}
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-amber-400 focus:border-amber-500 font-mono"
                    />
                </div>
                <div className="flex items-center h-[50px]">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`
                            w-5 h-5 rounded border flex items-center justify-center transition-all
                            ${data.isUnclaimed 
                                ? 'bg-amber-500 border-amber-400' 
                                : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'}
                        `}>
                            {data.isUnclaimed && <Sparkles className="w-3 h-3 text-black" />}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={data.isUnclaimed || false} 
                            onChange={e => setData({...data, isUnclaimed: e.target.checked})}
                        />
                        <span className={`text-xs font-bold ${data.isUnclaimed ? 'text-amber-400' : 'text-slate-500'}`}>
                            New Loot?
                        </span>
                     </label>
                </div>
              </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-2">Description</label>
            <textarea 
              value={data.description || ''} 
              onChange={e => setData({...data, description: e.target.value})}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
          <button 
             onClick={onClose}
             className="text-slate-400 hover:text-white px-4 py-2 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(data)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all hover:scale-105"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const InventoryManager: React.FC<InventoryManagerProps> = ({ containers, otherCharacters, onChange, onUndoableChange, onTransferItem }) => {
  const [draggedItem, setDraggedItem] = useState<{ itemId: string, sourceContainerId: string } | null>(null);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ containerId: string, item: Item } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string, containerId: string } | null>(null);
  const [containerToDelete, setContainerToDelete] = useState<string | null>(null);
  const [splitDialog, setSplitDialog] = useState<{ isOpen: boolean, item: Item | null, targetId: string, targetName: string } | null>(null);

  const totalItems = calculateTotalItems(containers);
  const totalWeight = calculateTotalWeight(containers);

  const commitContainers = (next: Container[], message?: string) => {
    if (message && onUndoableChange) {
      onUndoableChange(next, message);
    } else {
      onChange(next);
    }
  };

  // --- Handlers ---
  const openContextMenuAt = (x: number, y: number, itemId: string, containerId: string) => {
    setContextMenu({ x, y, itemId, containerId });
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string, containerId: string) => {
    e.preventDefault();
    openContextMenuAt(e.clientX, e.clientY, itemId, containerId);
  };

  const handleAddContainer = (type: ContainerType = 'carried') => {
    const newContainer: Container = {
      id: crypto.randomUUID(),
      name: 'New Container',
      type: type,
      items: [],
      maxWeight: 0
    };
    onChange([...containers, newContainer]);
  };

  const handleRequestRemoveContainer = (id: string) => {
      setContainerToDelete(id);
  };

  const executeRemoveContainer = () => {
    if(!containerToDelete) return;
     // Strict filter creating a new array ref to ensure React updates
     const newContainers = containers.filter(c => c.id !== containerToDelete);
     const deletedName = containers.find(c => c.id === containerToDelete)?.name || 'Container';
     commitContainers(newContainers, `Deleted container “${deletedName}”.`);
     setContainerToDelete(null);
  };

  const handleRenameContainer = (id: string, newName: string) => {
    onChange(containers.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const handleUpdateContainerType = (id: string, newType: ContainerType) => {
    onChange(containers.map(c => c.id === id ? { ...c, type: newType } : c));
  };

  const handleUpdateMaxWeight = (id: string, val: number) => {
    onChange(containers.map(c => c.id === id ? { ...c, maxWeight: val || 0 } : c));
  };

  const handleAddItem = (containerId: string) => {
    const newItem: Item = {
      id: crypto.randomUUID(),
      name: 'New Item',
      count: 1,
      weight: 0,
      goldValue: 0,
      isUnclaimed: false,
      category: ItemCategory.General
    };
    const newContainers = containers.map(c => {
      if (c.id === containerId) {
        return { ...c, items: [...c.items, newItem] };
      }
      return c;
    });
    
    onChange(newContainers);
    // Auto-open editor for the new item
    setEditingItem({ containerId, item: newItem });
  };

  const handleSaveItem = (updatedItem: Item) => {
    if (!editingItem) return;
    onChange(containers.map(c => {
      if (c.id === editingItem.containerId) {
        return {
           ...c,
           items: c.items.map(i => i.id === updatedItem.id ? updatedItem : i)
        };
      }
      return c;
    }));
    setEditingItem(null);
  };

  const handleDeleteItem = () => {
    if (!contextMenu) return;

    const itemName =
      containers
        .find((c) => c.id === contextMenu.containerId)
        ?.items.find((i) => i.id === contextMenu.itemId)?.name || 'Item';

    commitContainers(
      containers.map((c) => {
        if (c.id === contextMenu.containerId) {
          return { ...c, items: c.items.filter((i) => i.id !== contextMenu.itemId) };
        }
        return c;
      }),
      `Deleted “${itemName}”.`
    );

    setContextMenu(null);
  };

  const handleMoveToContainer = (targetId: string) => {
     if (!contextMenu) return;
     const sourceContainer = containers.find(c => c.id === contextMenu.containerId);
     const item = sourceContainer?.items.find(i => i.id === contextMenu.itemId);
     if (!sourceContainer || !item) return;

     const newContainers = containers.map(c => {
        if (c.id === contextMenu.containerId) {
             return { ...c, items: c.items.filter(i => i.id !== contextMenu.itemId) };
        }
        if (c.id === targetId) {
            return { ...c, items: [...c.items, item] };
        }
        return c;
     });
     const itemName = item.name || 'Item';
     const targetName = containers.find(c => c.id === targetId)?.name || 'Container';
     commitContainers(newContainers, `Moved “${itemName}” to “${targetName}”.`);
     setContextMenu(null);
  };

  const handleGiveToCharacter = (targetCharId: string) => {
     if (!contextMenu) return;
     const sourceContainer = containers.find(c => c.id === contextMenu.containerId);
     const item = sourceContainer?.items.find(i => i.id === contextMenu.itemId);
     
     if (!sourceContainer || !item) return;

     // Check for stack size
     if (item.count > 1) {
         setSplitDialog({
             isOpen: true,
             item: item,
             targetId: targetCharId,
             targetName: otherCharacters.find(c => c.id === targetCharId)?.name || 'Unknown'
         });
         setContextMenu(null);
         return;
     }

     // Normal transfer for single item
     executeTransfer(targetCharId, item);
     setContextMenu(null);
  };

  const executeTransfer = (targetCharId: string, item: Item) => {
      // We delegate completely to App.tsx via onTransferItem.
      onTransferItem(targetCharId, item);
  };

  // --- Drag & Drop ---
  const onDragStart = (e: React.DragEvent, itemId: string, containerId: string) => {
    setDraggedItem({ itemId, sourceContainerId: containerId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, containerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverContainerId !== containerId) {
      setDragOverContainerId(containerId);
    }
  };

  const onDrop = (e: React.DragEvent, targetContainerId: string) => {
    e.preventDefault();
    setDragOverContainerId(null);
    if (!draggedItem) return;

    const { itemId, sourceContainerId } = draggedItem;
    if (sourceContainerId === targetContainerId) {
      setDraggedItem(null);
      return;
    }

    const sourceContainer = containers.find(c => c.id === sourceContainerId);
    const itemToMove = sourceContainer?.items.find(i => i.id === itemId);
    if (!sourceContainer || !itemToMove) return;

    const newContainers = containers.map(c => {
      if (c.id === sourceContainerId) {
        return { ...c, items: c.items.filter(i => i.id !== itemId) };
      }
      if (c.id === targetContainerId) {
        return { ...c, items: [...c.items, itemToMove] };
      }
      return c;
    });

    const itemName = itemToMove.name || 'Item';
    const targetName = containers.find(c => c.id === targetContainerId)?.name || 'Container';
    commitContainers(newContainers, `Moved “${itemName}” to “${targetName}”.`);
    setDraggedItem(null);
  };

  const getContainerIcon = (name: string, isFixed?: boolean) => {
    const lower = name.toLowerCase();
    if (isFixed || lower.includes('worn') || lower.includes('body')) return <Shirt className="w-4 h-4 text-emerald-400" />;
    if (lower.includes('sack') || lower.includes('pack')) return <Backpack className="w-4 h-4 text-indigo-400" />;
    if (lower.includes('belt') || lower.includes('pouch')) return <Briefcase className="w-4 h-4 text-amber-400" />;
    return <PackageOpen className="w-4 h-4 text-slate-400" />;
  };
  
  // Render Group Function
  const renderContainerGroup = (title: string, type: ContainerType, containersInGroup: Container[]) => {
      return (
          <div className="mb-4 last:mb-0 animate-fade-in">
              <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      {type === 'equipped' && <Shirt className="w-3 h-3" />}
                      {type === 'carried' && <Backpack className="w-3 h-3" />}
                      {type === 'stored' && <Archive className="w-3 h-3" />}
                      {title}
                  </h3>
                  <button 
                    onClick={() => handleAddContainer(type)}
                    className="text-[10px] text-indigo-400 hover:text-white uppercase font-bold flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 hover:bg-indigo-500/30 transition-colors"
                  >
                      <Plus className="w-3 h-3" /> New Container
                  </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
                {containersInGroup.map((container) => {
                    const isDragOver = dragOverContainerId === container.id;
                    const containerWeight = calculateContainerWeight(container);
                    const maxWeight = container.maxWeight || 0;
                    const isOverweight = maxWeight > 0 && containerWeight > maxWeight;
                    
                    const fillPercent = maxWeight > 0 ? Math.min(100, (containerWeight / maxWeight) * 100) : 0;
                    let barColor = 'bg-slate-600';
                    if (fillPercent > 75) barColor = 'bg-amber-500';
                    if (fillPercent >= 100) barColor = 'bg-red-500';

                    return (
                    <div 
                        key={container.id} 
                        className={`
                            flex flex-col rounded-xl transition-all duration-300 border relative overflow-hidden h-fit self-start
                            ${isDragOver 
                                ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                : isOverweight
                                    ? 'bg-red-900/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                            }
                        `}
                        onDragOver={(e) => onDragOver(e, container.id)}
                        onDrop={(e) => onDrop(e, container.id)}
                    >
                        {maxWeight > 0 && (
                            <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full z-0">
                                <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${fillPercent}%` }}></div>
                            </div>
                        )}

                        <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between gap-3 bg-white/5 rounded-t-xl relative z-10">
                        <div className="flex items-center gap-3 flex-grow">
                            <div className={`p-2 rounded-lg shadow-inner ${isOverweight ? 'bg-red-950/50' : 'bg-slate-950'}`}>
                                {getContainerIcon(container.name, container.isFixed)}
                            </div>
                            <div className="flex flex-col w-full sm:w-auto">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={container.name}
                                        onChange={(e) => handleRenameContainer(container.id, e.target.value)}
                                        className="bg-transparent text-white font-bold text-sm focus:outline-none focus:border-b focus:border-indigo-500 w-full placeholder-slate-600"
                                        placeholder="Name..."
                                    />
                                    {!container.isFixed && (
                                        <select 
                                            value={container.type} 
                                            onChange={(e) => handleUpdateContainerType(container.id, e.target.value as ContainerType)}
                                            className="bg-slate-950 text-[9px] text-slate-400 border border-slate-800 rounded px-1 py-0.5 uppercase font-bold focus:ring-0 focus:border-indigo-500"
                                        >
                                            <option value="equipped">Equipped</option>
                                            <option value="carried">Carried</option>
                                            <option value="stored">Stored</option>
                                        </select>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-mono ${isOverweight ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                                    Load: {containerWeight}
                                    </span>
                                    <span className="text-[10px] text-slate-600">/</span>
                                    <div className="relative flex items-center group/weight">
                                        <CommitNumberInput
                                            value={container.maxWeight ? container.maxWeight : undefined}
                                            placeholder="∞"
                                            emptyCommit="undefined"
                                            transform={(n) => Math.max(0, n)}
                                            onCommit={(n) => handleUpdateMaxWeight(container.id, n ?? 0)}
                                            className="w-12 bg-transparent border-b border-slate-800 hover:border-slate-600 focus:border-indigo-500 text-[10px] font-mono text-slate-400 focus:text-white text-center p-0 transition-colors"
                                        />
                                        <span className="text-[10px] text-slate-600 ml-1">cn Max</span>
                                    </div>
                                    {isOverweight && (
                                        <span className="hidden sm:flex text-[9px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 uppercase font-bold items-center gap-1 animate-pulse">
                                            <AlertTriangle className="w-2 h-2" /> Overloaded!
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {isOverweight && (
                            <span className="sm:hidden text-red-500 animate-pulse">
                                <AlertTriangle className="w-5 h-5" />
                            </span>
                        )}
                        
                        {!container.isFixed && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRequestRemoveContainer(container.id);
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer z-50 relative ml-auto sm:ml-0"
                                title="Delete Container"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        </div>

                        <div className="p-3">
                            {container.items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-4 text-slate-700 border-2 border-dashed border-slate-800 rounded-lg">
                                    <PackageOpen className="w-6 h-6 mb-2 opacity-50" />
                                    <span className="text-xs">Empty</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {container.items.map((item) => (
                                <div 
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, item.id, container.id)}
                                    onContextMenu={(e) => handleContextMenu(e, item.id, container.id)}
                                    onClick={() => setEditingItem({ containerId: container.id, item })}
                                    className={`
                                        group relative flex flex-col gap-1 p-2 rounded-lg border cursor-pointer
                                        transition-all duration-200 shadow-sm
                                        ${item.isMagical 
                                            ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                                            : item.isUnidentified 
                                                ? 'bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-400'
                                                : 'bg-slate-950 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                                        }
                                        ${draggedItem?.itemId === item.id ? 'opacity-30 border-dashed border-slate-600' : 'hover:-translate-y-0.5'}
                                    `}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className={`font-semibold text-sm truncate pr-2 ${item.isMagical ? 'text-purple-200' : item.isUnidentified ? 'text-cyan-200' : 'text-slate-200'}`}>
                                                {item.name}
                                            </span>
                                            {item.isUnclaimed && (item.goldValue || 0) > 0 && (
                                                <span className="text-[9px] text-amber-500 flex items-center mt-0.5 animate-pulse-slow">
                                                    <Sparkles className="w-2 h-2 mr-1" /> New Loot!
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-1 flex-shrink-0">
                                            {item.count > 1 && (
                                                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                                    x{item.count}
                                                </span>
                                            )}

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                                openContextMenuAt(rect.right, rect.bottom, item.id, container.id);
                                              }}
                                              onMouseDown={(e) => e.stopPropagation()}
                                              className="px-2 py-1 rounded border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                              title="Actions"
                                              aria-label="Actions"
                                            >
                                              <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded flex items-center border border-slate-700">
                                            {getCategoryIcon(item.category, "w-2.5 h-2.5 mr-1")} {item.category || 'Gen.'}
                                        </span>
                                        {item.isMagical && <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1 py-0.5 rounded border border-purple-500/40 flex items-center" title="Magical"><Zap className="w-2 h-2"/></span>}
                                        {item.isUnidentified && <span className="text-[9px] bg-cyan-900/40 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/40 flex items-center" title="Unknown"><HelpCircle className="w-2 h-2"/></span>}
                                        {item.damage && <span className="text-[9px] bg-red-900/20 text-red-400 px-1 py-0.5 rounded border border-red-900/30 flex items-center"><Sword className="w-2 h-2 mr-1"/>{item.damage}</span>}
                                        {item.armor && <span className="text-[9px] bg-sky-900/20 text-sky-400 px-1 py-0.5 rounded border border-sky-900/30 flex items-center"><Shield className="w-2 h-2 mr-1"/>{item.armor}</span>}
                                        {(item.charges || 0) > 0 && (
                                            <span className="text-[9px] bg-yellow-900/20 text-yellow-400 px-1 py-0.5 rounded border border-yellow-900/30 flex items-center" title="Charges">
                                                <Zap className="w-2 h-2 mr-1"/>{item.charges}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className={`absolute inset-0 border-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${item.isMagical ? 'border-purple-500' : 'border-indigo-500'}`}></div>
                                </div>
                                ))}
                                </div>
                            )}
                            
                            <button
                                onClick={() => handleAddItem(container.id)}
                                className="mt-3 w-full py-2 rounded-lg border border-dashed border-slate-700 text-slate-600 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all group flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Add Item</span>
                            </button>
                        </div>
                    </div>
                    );
                })}
              </div>
          </div>
      );
  };

  const equippedContainers = containers.filter(c => c.type === 'equipped' || (!c.type && c.isFixed));
  const carriedContainers = containers.filter(c => c.type === 'carried' || (!c.type && !c.isFixed));
  const storedContainers = containers.filter(c => c.type === 'stored');

  return (
    <div className="space-y-4">
       {/* Global Inventory Header */}
       <div className="flex flex-col sm:flex-row justify-between items-end pb-4 border-b border-white/5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-2">
                Equipment
            </h2>
             <div className="flex gap-4">
                <span className="text-sm font-mono text-slate-400 flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                    <Box className="w-4 h-4 text-slate-500"/> {totalItems} <span className="text-slate-600 text-xs uppercase">items</span>
                </span>
                <span className={`text-sm font-mono flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border ${totalWeight > 1600 ? 'text-red-400 border-red-900/50' : 'text-slate-400 border-slate-700'}`}>
                    <Scale className="w-4 h-4 text-slate-500"/> {totalWeight} <span className="text-slate-600 text-xs uppercase">cn</span>
                </span>
            </div>
          </div>
       </div>

      <div className="space-y-6">
          {renderContainerGroup("Equipped & Worn", 'equipped', equippedContainers)}
          {renderContainerGroup("Carried in Pack", 'carried', carriedContainers)}
          {storedContainers.length > 0 && renderContainerGroup("Bank & Storage", 'stored', storedContainers)}
          
          {/* Fallback add if no stored exist yet */}
          {storedContainers.length === 0 && (
              <div className="text-center pt-4">
                  <button onClick={() => handleAddContainer('stored')} className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-2 mx-auto">
                      <Archive className="w-4 h-4" /> Create Storage Container
                  </button>
              </div>
          )}
      </div>

      {editingItem && (
        <ItemDetailModal 
            item={editingItem.item} 
            onClose={() => setEditingItem(null)} 
            onSave={handleSaveItem} 
        />
      )}
      
      {contextMenu && (
          <ContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            item={containers.find(c => c.id === contextMenu.containerId)?.items.find(i => i.id === contextMenu.itemId)!}
            containerId={contextMenu.containerId}
            containers={containers}
            otherCharacters={otherCharacters}
            onClose={() => setContextMenu(null)}
            onEdit={() => {
                const item = containers.find(c => c.id === contextMenu.containerId)?.items.find(i => i.id === contextMenu.itemId);
                if(item) setEditingItem({ containerId: contextMenu.containerId, item });
                setContextMenu(null);
            }}
            onDelete={handleDeleteItem}
            onMoveToContainer={handleMoveToContainer}
            onGiveToCharacter={handleGiveToCharacter}
          />
      )}

      {splitDialog && (
          <StackSplitDialog 
              isOpen={splitDialog.isOpen}
              item={splitDialog.item}
              targetName={splitDialog.targetName}
              onCancel={() => setSplitDialog(null)}
              onConfirm={(count) => {
                  if (splitDialog.item) {
                    executeTransfer(splitDialog.targetId, { ...splitDialog.item, count });
                  }
                  setSplitDialog(null);
              }}
          />
      )}

      <ConfirmDialog 
        isOpen={!!containerToDelete}
        title="Delete Container?"
        message="The container and all items within it will be permanently deleted."
        confirmLabel="Delete"
        isDangerous={true}
        onConfirm={executeRemoveContainer}
        onCancel={() => setContainerToDelete(null)}
      />

    </div>
  );
};

export default InventoryManager;