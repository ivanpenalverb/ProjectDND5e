"use client";
import React, { useEffect, useState } from 'react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { Dices, X } from 'lucide-react';
import { DiceRollResult } from '@/services/diceService';

const RollResultItem = ({ roll }: { roll: DiceRollResult }) => {
  const isCrit = roll.isCritical;
  const isFumble = roll.isFumble;
  
  let resultColor = "text-zinc-200";
  let borderColor = "border-zinc-700";
  let bgColor = "bg-zinc-800";
  
  if (isCrit) {
    resultColor = "text-accent-gold";
    borderColor = "border-accent-gold/50";
    bgColor = "bg-yellow-900/20";
  } else if (isFumble) {
    resultColor = "text-red-500";
    borderColor = "border-red-900/50";
    bgColor = "bg-red-950/30";
  }

  return (
    <div className={`flex flex-col p-3 rounded-md border ${borderColor} ${bgColor} mb-2`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-zinc-400 uppercase">{roll.source || 'Roll'}</span>
        <span className="text-[10px] text-zinc-500">{roll.notation}</span>
      </div>
      <div className="flex items-center gap-2">
        <Dices size={14} className="text-zinc-500" />
        <span className="text-xs text-zinc-400">
          [{roll.rolls.join(', ')}] {roll.modifier >= 0 ? `+${roll.modifier}` : roll.modifier}
        </span>
        <span className={`ml-auto text-xl font-bold font-serif ${resultColor}`}>
          {roll.total}
        </span>
      </div>
      {isCrit && <div className="text-[10px] text-accent-gold mt-1 font-bold italic tracking-wide">CRITICAL HIT!</div>}
      {isFumble && <div className="text-[10px] text-red-500 mt-1 font-bold italic tracking-wide">CRITICAL MISS!</div>}
    </div>
  );
};

export const DiceSystem = () => {
  const { currentRoll, diceHistory, clearCurrentRoll } = useCharacterStore();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Trigger overlay when new roll comes
  useEffect(() => {
    if (currentRoll) {
      setShowOverlay(true);
      const timer = setTimeout(() => {
        setShowOverlay(false);
        clearCurrentRoll();
      }, 2500); // 2.5 seconds visible
      return () => clearTimeout(timer);
    }
  }, [currentRoll, clearCurrentRoll]);

  return (
    <>
      {/* Visual Feedback Overlay (Massive) */}
      <div 
        className={`fixed inset-0 pointer-events-none flex items-center justify-center z-[100] transition-all duration-300 ${
          showOverlay ? 'opacity-100 backdrop-blur-sm bg-zinc-950/60' : 'opacity-0 scale-95'
        }`}
      >
        {currentRoll && (
          <div className="flex flex-col items-center justify-center transform transition-transform animate-in fade-in zoom-in duration-300">
            <span className="text-2xl font-bold text-zinc-400 mb-2 uppercase tracking-widest animate-pulse">
              {currentRoll.source}
            </span>
            
            <div className="relative flex items-center justify-center w-40 h-40">
              {/* Pseudo-polyhedron frame */}
               <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-zinc-800 animate-spin-slow" style={{ animationDuration: '10s' }}>
                <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="50,5 50,95" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <polygon points="5,25 95,75" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <polygon points="5,75 95,25" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              </svg>

              <span className={`text-7xl font-bold font-serif z-10 drop-shadow-2xl ${
                currentRoll.isCritical ? 'text-accent-gold drop-shadow-[0_0_15px_rgba(184,134,11,0.8)]' 
                : currentRoll.isFumble ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' 
                : 'text-zinc-100 text-shadow-lg'
              }`}>
                {currentRoll.rolls[0]}
              </span>
            </div>
            
            <div className="text-2xl font-bold text-zinc-200 mt-4 flex items-center justify-center min-w-[200px] border-b border-zinc-700 pb-2">
               {currentRoll.notation}
               <span className="mx-3 opacity-50">=</span>
               <span className="text-3xl text-zinc-100">{currentRoll.total}</span>
            </div>
            
            {currentRoll.isCritical && <span className="text-xl text-accent-gold mt-2 font-bold uppercase tracking-widest animate-bounce">Critical Hit!</span>}
            {currentRoll.isFumble && <span className="text-xl text-red-500 mt-2 font-bold uppercase tracking-widest">Critical Miss!</span>}
          </div>
        )}
      </div>

      {/* Persistent Dice Log Toast */}
      {diceHistory.length > 0 && (
        <div className={`fixed bottom-4 right-4 z-40 flex flex-col items-end transition-all duration-300 ${!isOpen ? 'translate-y-[calc(100%-48px)]' : ''}`}>
          
          {/* Header Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-72 bg-zinc-900 border border-zinc-700 rounded-t-lg px-4 py-3 shadow-2xl hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-2 text-zinc-200">
              <Dices size={18} />
              <span className="font-bold tracking-wider text-sm">DICE LOG ({diceHistory.length})</span>
            </div>
            <ChevronToggle isOpen={isOpen} />
          </button>
          
          {/* Roll List Container */}
          <div className="w-72 bg-zinc-900/95 border-x border-b border-zinc-700 rounded-b-lg shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
            <div className="p-3 max-h-80 overflow-y-auto no-scrollbar scroll-smooth">
               {diceHistory.map(roll => (
                 <RollResultItem key={roll.id} roll={roll} />
               ))}
            </div>
          </div>
          
        </div>
      )}
    </>
  );
};

const ChevronToggle = ({ isOpen }: { isOpen: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" height="16" 
    viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" strokeWidth="2" 
    strokeLinecap="round" strokeLinejoin="round" 
    className={`text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
