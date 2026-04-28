"use client";
import React, { useState, useEffect } from 'react';
import { useCharacterStore, calculateModifier, Character } from '@/store/useCharacterStore';
import { rollDice } from '@/services/diceService';
import { useTranslation } from 'react-i18next';

export const StatSidebar = () => {
  const { t } = useTranslation();
  const { characters, activeCharacterId, updateActiveCharacter, addRoll } = useCharacterStore();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const character = characters.find(c => c.id === activeCharacterId);
  const isDataReady = isMounted && !!character;

  const stats = isDataReady && character
    ? character.abilityScores 
    : { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };

  const statOrder: (keyof Character['abilityScores'])[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

  const handleStatChange = (stat: keyof Character['abilityScores'], value: string) => {
    if (!character) return;
    const numValue = parseInt(value, 10);
    const finalValue = isNaN(numValue) ? 0 : numValue;
    
    updateActiveCharacter({
      abilityScores: {
        ...character.abilityScores,
        [stat]: finalValue
      }
    });
  };

  const getFormatModifier = (score: number) => {
    const mod = calculateModifier(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleRoll = (stat: keyof Character['abilityScores']) => {
    if (!character) return;
    const mod = calculateModifier(stats[stat]);
    const operator = mod >= 0 ? '+' : '';
    const notation = `1d20${operator}${mod}`;
    
    const result = rollDice(notation, `${stat} Check`);
    addRoll(result);
  };

  return (
    <div className="w-full lg:w-32 flex lg:flex-col gap-4 p-4 lg:p-6 bg-zinc-900 border-r border-b lg:border-b-0 border-zinc-800 shadow-xl overflow-x-auto lg:overflow-visible shrink-0 lg:sticky lg:top-[61px] lg:h-[calc(100vh-61px)] items-center relative z-10">
      {statOrder.map((stat) => (
        <div key={stat} className="relative flex flex-col items-center flex-shrink-0 group">
          {/* Main Stat Block (Now a Button) */}
          <button 
            onClick={() => handleRoll(stat)}
            disabled={!isDataReady}
            className="w-20 h-24 lg:w-24 lg:h-28 bg-zinc-950 border border-zinc-700 rounded-lg flex flex-col items-center pt-2 gap-1 shadow-md group-focus-within:border-accent-gold group-hover:border-accent-gold hover:bg-zinc-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Stat Name */}
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t(`stats.${stat.toLowerCase()}`)}
            </span>
            {/* Modifier (Big) */}
            <span className="text-3xl lg:text-4xl font-serif font-bold text-zinc-100 mt-1 pointer-events-none">
              {getFormatModifier(stats[stat])}
            </span>
          </button>
          
          {/* Base Score (Small oval at bottom overlap) */}
          <div className="absolute -bottom-3 bg-zinc-800 border-2 border-zinc-700 w-12 py-1 flex items-center justify-center shadow-lg group-focus-within:border-accent-gold group-hover:border-accent-gold transition-colors duration-300 z-10" style={{ borderRadius: '1rem' }}>
            <input
              type="number"
              value={stats[stat].toString()}
              onChange={(e) => handleStatChange(stat, e.target.value)}
              disabled={!isDataReady}
              className={`w-full text-center text-sm font-bold bg-transparent focus:outline-none appearance-none ${isDataReady ? 'text-zinc-300' : 'text-zinc-600'}`}
              style={{ MozAppearance: 'textfield' }} // hide inner arrows in Firefox
            />
          </div>
          
          <div className="h-4 lg:h-6 w-px bg-transparent shrink-0" /> {/* Spacing helper for absolute bottom element */}
        </div>
      ))}
      
      {/* Required global styles to remove spinner arrows in webkit */}
      <style jsx global>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};
