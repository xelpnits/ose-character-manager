import React, { useState, useRef, useEffect } from 'react';
import { Dices, X, Send, User, Settings, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface RollMessage {
  id: string;
  sender: string;
  timestamp: Date;
  type: 'roll' | 'system';
  formula?: string;
  total?: number;
  rolls?: number[];
  modifier?: number;
  text?: string;
}

const MAX_DICE_MESSAGES = 200;

const DiceRoller: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [tempName, setTempName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<RollMessage[]>([]);
  
  // Manual Input State
  const [count, setCount] = useState<number>(1);
  const [sides, setSides] = useState<number>(20);
  const [modifier, setModifier] = useState<number>(0);
  
  // Animation / Overlay State
  const [overlayState, setOverlayState] = useState<'hidden' | 'rolling' | 'result'>('hidden');
  const [currentResult, setCurrentResult] = useState<RollMessage | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load username on mount
  useEffect(() => {
    const savedName = localStorage.getItem('ose_username');
    if (savedName) {
      setUsername(savedName);
      setIsNameSet(true);
    } else {
        // Add initial welcome message
        setMessages([{
            id: 'init',
            sender: 'System',
            timestamp: new Date(),
            type: 'system',
            text: 'Welcome to the table.'
        }]);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSetName = () => {
      if (!tempName.trim()) return;
      setUsername(tempName);
      setIsNameSet(true);
      localStorage.setItem('ose_username', tempName);
      setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          sender: 'System',
          timestamp: new Date(),
          type: 'system' as const,
          text: `${tempName} has joined the table.`
      }].slice(-MAX_DICE_MESSAGES));
  };

  const handleResetName = () => {
      setIsNameSet(false);
      setTempName(username);
  };

  const clearChat = () => {
      setMessages([{
          id: crypto.randomUUID(),
          sender: 'System',
          timestamp: new Date(),
          type: 'system',
          text: 'Chat cleared.'
      }]);
  };

  const performRoll = (overrideSides?: number) => {
    const s = overrideSides || sides;
    const c = count;
    const m = modifier;

    if (overrideSides) setSides(overrideSides); // Sync UI

    setOverlayState('rolling');
    
    // Fast Animation delay
    setTimeout(() => {
        const newRolls: number[] = [];
        let total = 0;
        
        for (let i = 0; i < c; i++) {
            const roll = Math.floor(Math.random() * s) + 1;
            newRolls.push(roll);
            total += roll;
        }

        const formula = `${c}d${s}${m !== 0 ? (m > 0 ? `+${m}` : m) : ''}`;
        const finalTotal = total + m;

        const message: RollMessage = {
            id: crypto.randomUUID(),
            sender: username,
            timestamp: new Date(),
            type: 'roll',
            formula,
            total: finalTotal,
            rolls: newRolls,
            modifier: m
        };

        setMessages(prev => [...prev, message].slice(-MAX_DICE_MESSAGES));
        setCurrentResult(message);
        setOverlayState('result');

        // Fast hide result overlay
        setTimeout(() => {
            setOverlayState(prev => prev === 'result' ? 'hidden' : prev);
        }, 800);

    }, 250); 
  };

  const getDieColor = (s: number) => {
    switch(s) {
        case 4: return 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
        case 6: return 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20';
        case 8: return 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20';
        case 10: return 'text-purple-400 border-purple-500/30 hover:bg-purple-500/20';
        case 12: return 'text-rose-400 border-rose-500/30 hover:bg-rose-500/20';
        case 20: return 'text-amber-400 border-amber-500/30 hover:bg-amber-500/20';
        case 100: return 'text-slate-300 border-slate-500/30 hover:bg-slate-500/20';
        default: return 'text-slate-400 border-slate-600 hover:bg-slate-700';
    }
  };

  return (
    <>
        {/* Floating Trigger & Panel */}
        <div className="fixed bottom-6 left-6 z-[9999]" ref={panelRef}>
            
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
                    border border-white/10 hover:scale-110 active:scale-95 relative z-50
                    ${isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-900/80 backdrop-blur-md text-indigo-400'}
                `}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Dices className="w-8 h-8" />}
            </button>

            {/* Main Chat Window */}
            {isOpen && (
                <div className="absolute bottom-16 left-0 w-[350px] max-w-[90vw] h-[500px] max-h-[80vh] bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col relative">
                    
                    {/* Internal Overlay Animation */}
                    {overlayState !== 'hidden' && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[4px] animate-fade-in rounded-2xl">
                             <div className="flex flex-col items-center justify-center animate-slide-up">
                                {overlayState === 'rolling' ? (
                                    <Dices className="w-16 h-16 text-indigo-400 animate-spin" style={{ animationDuration: '0.25s' }} />
                                ) : (
                                    currentResult && (
                                        <div className="flex flex-col items-center scale-90">
                                            <div className="text-7xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                                {currentResult.total}
                                            </div>
                                            <div className="mt-2 bg-slate-900/90 border border-white/20 px-3 py-1 rounded-full text-slate-300 font-mono text-sm flex items-center gap-2 shadow-xl">
                                                <span className="font-bold text-indigo-400">{currentResult.sender}</span>
                                                <span className="text-slate-500">|</span>
                                                <span>{currentResult.formula}</span>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="bg-slate-900/80 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                             <Dices className="w-4 h-4 text-indigo-500" />
                             <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Dice Log</span>
                        </div>
                        {isNameSet && (
                            <div className="flex items-center gap-2">
                                <button onClick={clearChat} className="text-slate-600 hover:text-red-400 transition-colors" title="Clear Chat">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                                <button onClick={handleResetName} className="text-slate-500 hover:text-white transition-colors" title="Change Name">
                                    <Settings className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    {!isNameSet ? (
                        /* Name Entry Screen */
                        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                            <div className="bg-indigo-500/10 p-4 rounded-full mb-2">
                                <User className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-white font-serif text-xl">Who's rolling?</h3>
                            <p className="text-slate-400 text-sm text-center mb-4">
                                Enter your name to appear in the chat.
                            </p>
                            <input 
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSetName()}
                                placeholder="Your Name..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-center text-white focus:border-indigo-500"
                                autoFocus
                            />
                            <button 
                                onClick={handleSetName}
                                disabled={!tempName.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span>Join</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        /* Chat Log */
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.type === 'system' ? 'items-center my-4' : 'items-start'}`}>
                                    {msg.type === 'system' ? (
                                        <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-900/50 px-2 py-1 rounded-full">{msg.text}</span>
                                    ) : (
                                        <div className="max-w-[85%] animate-fade-in">
                                            <div className="text-[10px] text-slate-500 font-bold ml-1 mb-0.5 flex justify-between w-full gap-4">
                                                <span>{msg.sender}</span>
                                                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-none p-3 shadow-sm hover:border-indigo-500/30 transition-colors">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-serif font-bold text-white">{msg.total}</span>
                                                    <span className="text-xs font-mono text-slate-400">({msg.formula})</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-1 break-all">
                                                    [{msg.rolls?.join(', ')}]
                                                    {msg.modifier !== 0 && (
                                                        <span className={msg.modifier! > 0 ? "text-emerald-500" : "text-red-500"}>
                                                             {msg.modifier! > 0 ? ` +${msg.modifier}` : ` ${msg.modifier}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    )}

                    {/* Controls Footer */}
                    {isNameSet && (
                        <div className="bg-slate-900 border-t border-white/10 p-3 shrink-0">
                            
                            {/* Input Row */}
                            <div className="flex gap-2 mb-3">
                                <div className="flex-1 flex gap-1">
                                    <div className="relative flex-1">
                                        <span className="absolute -top-2 left-1 text-[8px] uppercase font-bold text-slate-500 bg-slate-900 px-1">Count</span>
                                        <input 
                                            type="number" 
                                            value={count} 
                                            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full h-9 bg-slate-950 border border-slate-700 rounded text-center text-sm text-white font-mono" 
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <span className="absolute -top-2 left-1 text-[8px] uppercase font-bold text-slate-500 bg-slate-900 px-1">Sides</span>
                                        <input 
                                            type="number" 
                                            value={sides} 
                                            onChange={(e) => setSides(Math.max(2, parseInt(e.target.value) || 20))}
                                            className="w-full h-9 bg-slate-950 border border-slate-700 rounded text-center text-sm text-white font-mono" 
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <span className="absolute -top-2 left-1 text-[8px] uppercase font-bold text-slate-500 bg-slate-900 px-1">Mod</span>
                                        <input 
                                            type="number" 
                                            value={modifier} 
                                            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                                            className="w-full h-9 bg-slate-950 border border-slate-700 rounded text-center text-sm text-white font-mono" 
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => performRoll()}
                                    className="h-9 w-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded flex items-center justify-center shadow-lg active:scale-95 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Quick Dice Row */}
                            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar justify-between">
                                {[4, 6, 8, 10, 12, 20, 100].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => performRoll(s)}
                                        className={`
                                            w-8 h-8 rounded border flex items-center justify-center font-bold font-serif text-xs transition-all active:scale-95 shrink-0
                                            ${getDieColor(s)}
                                            ${s === 100 ? 'text-[10px]' : ''}
                                            bg-slate-950
                                        `}
                                    >
                                        d{s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </>
  );
};

// Small helper for Lucide import
const ArrowRight = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" viewBox="0 0 24 24" 
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
        className={className}
    >
        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
);

export default DiceRoller;