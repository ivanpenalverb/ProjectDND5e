"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, Tent, Moon, Dices, Heart, ArrowUpCircle, Camera, Eye, Footprints } from 'lucide-react';
import { useCharacterStore, calculateModifier } from '@/store/useCharacterStore';
import { rollDice } from '@/services/diceService';
import { compressImage } from '@/utils/imageParser';
import { useTranslation } from 'react-i18next';
import { AvatarCropModal } from './modals/AvatarCropModal';

export const CharacterHeader = () => {
  const { t } = useTranslation();
  const { characters, activeCharacterId, updateActiveCharacter, shortRest, longRest, addRoll, rollMode, setRollMode, updateAvatar, getPassivePerception } = useCharacterStore();
  const character = characters.find(c => c.id === activeCharacterId);

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [manualHpGained, setManualHpGained] = useState<string>('');
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result?.toString() || null);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (base64Str: string) => {
    updateAvatar(base64Str);
    setCropImageSrc(null);
  };
  if (!character) {
    return (
      <div className="w-full flex items-center justify-center p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-md h-40">
        <p className="text-zinc-500 italic text-lg tracking-wide">Select or create a character to view details.</p>
      </div>
    );
  }

  const handleUpdate = (field: string, value: string | number) => {
    if (field === 'level' && typeof value === 'number') {
      if (value > character.level) {
         setShowLevelUpModal(true);
      }
      // Also increase hit dice max safely
      updateActiveCharacter({ 
        level: value,
        hitDice: { ...(character.hitDice || { current: value, max: value, face: 10 }), max: value } // Hit dice max scales with level
      });
      return;
    }
    updateActiveCharacter({ [field]: value });
  };

  const handleLevelUpRoll = () => {
    const conMod = calculateModifier(character.abilityScores.CON);
    const sign = conMod >= 0 ? '+' : '';
    const face = character.hitDice?.face || 10;
    const roll = rollDice(`1d${face}${sign}${conMod}`, 'Level Up HP Increase');
    addRoll(roll);
    
    // Minimum 1 HP per level even with negative con
    const hpGained = Math.max(1, roll.total); 
    const newMaxHp = character.maxHp + hpGained;
    
    updateActiveCharacter({ 
      maxHp: newMaxHp, 
      currentHp: newMaxHp, // Heal to full on level up
    });
    setShowLevelUpModal(false);
  };

  const handleLevelUpManual = () => {
    const hpGained = parseInt(manualHpGained);
    if (!isNaN(hpGained) && hpGained > 0) {
      const newMaxHp = character.maxHp + hpGained;
      updateActiveCharacter({ 
        maxHp: newMaxHp, 
        currentHp: newMaxHp, // Heal to full
      });
      setShowLevelUpModal(false);
      setManualHpGained('');
    }
  };

  const handleHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    updateActiveCharacter({ currentHp: val });
  };

  const handleShortRest = () => {
    const currentHitDice = character.hitDice?.current || 0;
    if (currentHitDice > 0) {
      const conMod = calculateModifier(character.abilityScores.CON);
      shortRest(1, conMod);
      const face = character.hitDice?.face || 10;
      const roll = rollDice(`1d${face}+${conMod}`, 'Short Rest (Hit Dice)');
      addRoll(roll);
      updateActiveCharacter({ currentHp: Math.min(character.maxHp, character.currentHp + roll.total) });
    } else {
      alert("No hit dice remaining!");
    }
  };

  const handleLongRest = () => {
    longRest();
    const notification = rollDice('0d0', 'Long Rest');
    notification.total = character.maxHp;
    notification.rolls = [];
    addRoll(notification);
  };

  const rollInitiative = () => {
    const dexMod = calculateModifier(character.abilityScores.DEX);
    const roll = rollDice(`1d20${dexMod >= 0 ? '+' : ''}${dexMod}`, 'Initiative');
    addRoll(roll);
  };

  const handleDeathSaveRoll = () => {
    const roll = rollDice('1d20', 'Death Save');
    addRoll(roll);
    const result = roll.total;
    
    let { success, failure } = character.deathSaves || { success: 0, failure: 0 };
    
    if (result === 20) {
      updateActiveCharacter({ currentHp: 1, deathSaves: { success: 0, failure: 0 } });
      return;
    } else if (result === 1) {
      failure += 2;
    } else if (result >= 10) {
      success += 1;
    } else {
      failure += 1;
    }
    
    updateActiveCharacter({ deathSaves: { success: Math.min(3, success), failure: Math.min(3, failure) } });
  };

  const toggleDeathSave = (type: 'success' | 'failure', index: number) => {
    let { success, failure } = character.deathSaves || { success: 0, failure: 0 };
    if (type === 'success') {
      success = success === index + 1 ? index : index + 1;
    } else {
      failure = failure === index + 1 ? index : index + 1;
    }
    updateActiveCharacter({ deathSaves: { success, failure } });
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-md">
      {/* Left Group: Avatar & Details */}
      <div className="flex flex-col md:flex-row items-center gap-6 w-full">
        {/* Avatar Image Placeholder */}
        <div 
          className="relative w-32 h-32 md:w-40 md:h-40 shrink-0 bg-zinc-800 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700 cursor-pointer overflow-hidden group hover:border-accent-gold transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={32} className="text-zinc-300" />
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
        </div>

        {/* Character Details & Actions */}
        <div className="flex-1 w-full space-y-4">
          {/* Name Header */}
          <div>
            <input
              type="text"
              placeholder="Character Name"
              className="w-full bg-transparent text-3xl md:text-5xl font-bold font-serif text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-0 border-b border-transparent hover:border-zinc-800 focus:border-accent-gold transition-colors pb-1"
              value={character.name}
              onChange={(e) => handleUpdate('name', e.target.value)}
            />
          </div>

          {/* Info Badge (Read-Only) */}
          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base mb-2">
            <span className="text-zinc-400 font-medium tracking-wider">
              {character.race} <span className="text-accent-gold mx-1">•</span> {character.className}
            </span>
          </div>

          {/* Interactive Core Stats */}
          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">

            {/* Armor Class */}
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md shadow-sm focus-within:border-accent-gold transition-colors">
              <Shield size={16} className="text-zinc-400" />
              <input 
                type="number" 
                className="bg-transparent text-zinc-200 w-10 font-bold focus:outline-none text-center appearance-none" 
                value={character.armorClass || 10}
                onChange={(e) => handleUpdate('armorClass', parseInt(e.target.value, 10) || 10)}
              />
            </div>

            {/* Speed */}
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md shadow-sm focus-within:border-accent-gold transition-colors">
              <Footprints size={16} className="text-zinc-400" />
              <div className="flex items-center">
                <input 
                  type="number" 
                  className="bg-transparent text-zinc-200 w-10 font-bold focus:outline-none text-right appearance-none" 
                  value={character.speed || 30}
                  onChange={(e) => handleUpdate('speed', parseInt(e.target.value, 10) || 30)}
                />
                <span className="text-zinc-500 text-xs ml-1 font-medium">ft</span>
              </div>
            </div>

            {/* Passive Perception */}
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md shadow-sm" title="Passive Perception">
              <Eye size={16} className="text-zinc-400" />
              <span className="text-zinc-200 font-bold w-6 text-center">{getPassivePerception()}</span>
            </div>

            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md shadow-sm focus-within:border-accent-gold transition-colors">
              <span className="text-zinc-400 font-medium">Lvl</span>
              <input 
                type="number" 
                className="bg-transparent text-zinc-200 w-10 font-bold focus:outline-none text-center appearance-none" 
                value={character.level}
                onChange={(e) => handleUpdate('level', parseInt(e.target.value, 10) || 1)}
                min={1} 
                max={20} 
              />
            </div>
            
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md shadow-sm focus-within:border-accent-gold transition-colors">
              <span className="text-zinc-400 font-medium">Hit Die</span>
              <select 
                className="bg-transparent text-zinc-200 font-bold focus:outline-none cursor-pointer"
                value={character.hitDice?.face || 10}
                onChange={(e) => updateActiveCharacter({ hitDice: { ...(character.hitDice || { current: character.level, max: character.level }), face: Number(e.target.value) } })}
              >
                 <option value={6}>d6</option>
                 <option value={8}>d8</option>
                 <option value={10}>d10</option>
                 <option value={12}>d12</option>
              </select>
            </div>
          </div>

          {/* Action Buttons & HP HUD */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-zinc-800 mt-2">
            
            {/* Roll Mode Selector */}
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 shadow-inner mr-2">
              <button 
                onClick={() => setRollMode('disadvantage')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${rollMode === 'disadvantage' ? 'bg-red-900/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-zinc-600 hover:text-red-900 hover:bg-red-950/20'}`}
              >
                Disadv
              </button>
              <button 
                onClick={() => setRollMode('normal')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${rollMode === 'normal' ? 'bg-zinc-800 text-zinc-300 shadow-md' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50'}`}
              >
                Normal
              </button>
              <button 
                onClick={() => setRollMode('advantage')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${rollMode === 'advantage' ? 'bg-emerald-900/30 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]' : 'text-zinc-600 hover:text-emerald-900 hover:bg-emerald-950/20'}`}
              >
                Adv
              </button>
            </div>

            {/* Embedded HP HUD */}
            <div className="relative mr-2">
              {character.currentHp === 0 && (
                <div className="absolute -top-[120px] left-0 w-64 bg-zinc-950 border border-red-900/50 rounded-xl p-3 shadow-2xl z-20 shadow-red-900/20 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-500 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                      <Heart size={12} className="animate-pulse" />
                      Death Saves
                    </span>
                    {(character.deathSaves?.failure ?? 0) >= 3 ? (
                      <span className="text-zinc-500 font-bold text-[10px] uppercase bg-red-950/50 px-2 py-0.5 rounded border border-red-900/30">Dead</span>
                    ) : (character.deathSaves?.success ?? 0) >= 3 ? (
                       <span className="text-emerald-500 font-bold text-[10px] uppercase bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/30">Stable</span>
                    ) : null}
                  </div>
                  
                  <div className="flex gap-2 items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 text-[10px] uppercase w-14">Success</span>
                      {[0, 1, 2].map(i => (
                        <button key={`s-${i}`} onClick={() => toggleDeathSave('success', i)} className={`w-4 h-4 rounded-full border transition-all ${(character.deathSaves?.success ?? 0) > i ? 'bg-emerald-500 border-emerald-400' : 'bg-zinc-800 border-zinc-700 hover:border-emerald-500'}`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 text-[10px] uppercase w-12 text-right mr-1">Failure</span>
                      {[0, 1, 2].map(i => (
                        <button key={`f-${i}`} onClick={() => toggleDeathSave('failure', i)} className={`w-4 h-4 rounded-full border transition-all ${(character.deathSaves?.failure ?? 0) > i ? 'bg-red-500 border-red-400' : 'bg-zinc-800 border-zinc-700 hover:border-red-500'}`} />
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleDeathSaveRoll}
                    disabled={(character.deathSaves?.success ?? 0) >= 3 || (character.deathSaves?.failure ?? 0) >= 3}
                    className="w-full py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 text-xs font-bold uppercase tracking-widest rounded border border-red-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Roll Death Save
                  </button>
                </div>
              )}
            <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-lg border border-zinc-800 shadow-inner">
               <Heart size={20} className="text-red-500 ml-2 animate-pulse" />
               <div className="flex items-center gap-2">
                 <button onClick={() => updateActiveCharacter({ currentHp: Math.max(0, character.currentHp - 1) })} className="w-8 h-8 flex items-center justify-center bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 font-bold text-lg">-</button>
                 <input 
                   type="number" 
                   value={character.currentHp}
                   onChange={handleHpChange}
                   className={`w-16 h-10 text-center text-xl font-bold bg-zinc-950 border-2 rounded-md ${
                     character.currentHp <= 0 ? 'text-red-500 border-red-900/50 bg-red-950/20' 
                     : character.currentHp < character.maxHp / 2 ? 'text-yellow-500 border-yellow-900/50'
                     : 'text-zinc-100 border-zinc-700'
                   } focus:border-accent-gold outline-none transition-colors appearance-none`}
                 />
                 <div className="text-xl text-zinc-700 font-light">/</div>
                 <input 
                   type="number" 
                   value={character.maxHp}
                   onChange={(e) => updateActiveCharacter({ maxHp: parseInt(e.target.value) || 0 })}
                   className="w-12 h-10 text-center text-lg text-zinc-500 font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-accent-gold outline-none transition-colors appearance-none px-1"
                   placeholder="Max"
                 />
                 <button onClick={() => updateActiveCharacter({ currentHp: Math.min(character.maxHp, character.currentHp + 1) })} className="w-8 h-8 flex items-center justify-center bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 font-bold text-lg">+</button>
               </div>
            </div>
            </div>

            <button 
              onClick={handleShortRest}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-md border border-zinc-700 hover:border-accent-gold transition-all shadow-sm"
            >
              <Tent size={18} className="text-accent-gold" />
              <span>{t('actions.shortRest')}</span>
            </button>
            <button 
              onClick={handleLongRest}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-md border border-zinc-700 hover:border-blue-500 transition-all shadow-sm"
            >
              <Moon size={18} className="text-blue-500" />
              <span>{t('actions.longRest')}</span>
            </button>
            <button 
              onClick={rollInitiative}
              className="ml-auto md:ml-4 flex items-center gap-2 px-4 py-2 bg-accent-gold/20 hover:bg-accent-gold/40 text-accent-gold font-bold uppercase tracking-widest rounded-md border border-accent-gold/50 transition-all shadow-lg"
            >
              <Dices size={18} />
              <span>{t('stats.initiative')} {calculateModifier(character.abilityScores.DEX) >= 0 ? '+' : ''}{calculateModifier(character.abilityScores.DEX)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Level Up Modal */}
      {showLevelUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
             
             {/* Decorative Background */}
             <div className="absolute -top-10 -right-10 text-accent-gold opacity-10 pointer-events-none transform rotate-12">
               <ArrowUpCircle size={200} />
             </div>
             
             <div className="relative z-10">
               <h3 className="text-3xl font-serif text-accent-gold mb-2 drop-shadow-lg flex items-center gap-3">
                 <ArrowUpCircle className="text-accent-gold" size={32} />
                 Level Up!
               </h3>
               <p className="text-zinc-400 text-sm mb-6 pb-4 border-b border-zinc-800">
                 Congratulations on reaching level {character.level}. Your Max HP increases. How would you like to determine your extra hit points?
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Roll Option */}
                 <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 hover:border-accent-gold/50 transition-colors flex flex-col items-center text-center justify-between">
                    <div>
                      <h4 className="text-zinc-200 font-bold mb-2">Roll Hit Die</h4>
                      <p className="text-xs text-zinc-500 mb-4">
                         Roll 1d{character.hitDice?.face || 10} and add your Constitution modifier (+{calculateModifier(character.abilityScores.CON)}).
                      </p>
                    </div>
                    <button 
                      onClick={handleLevelUpRoll}
                      className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-accent-gold font-bold uppercase tracking-widest text-sm rounded-lg border border-zinc-700/50 hover:border-accent-gold shadow-lg transition-all"
                    >
                      Roll 1d{character.hitDice?.face || 10} {calculateModifier(character.abilityScores.CON) >= 0 ? '+' : ''}{calculateModifier(character.abilityScores.CON)}
                    </button>
                 </div>

                 {/* Manual Option */}
                 <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 hover:border-blue-900/50 transition-colors flex flex-col items-center text-center justify-between">
                    <div>
                      <h4 className="text-zinc-200 font-bold mb-2">Manual Entry</h4>
                      <p className="text-xs text-zinc-500 mb-4">
                         Take the average or enter a custom amount approved by your Dungeon Master.
                      </p>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                       <input 
                         type="number" 
                         value={manualHpGained}
                         onChange={(e) => setManualHpGained(e.target.value)}
                         placeholder="HP to add"
                         className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 px-3 text-center text-zinc-200 focus:border-blue-500 outline-none"
                       />
                       <button 
                         onClick={handleLevelUpManual}
                         disabled={!manualHpGained}
                         className="w-full py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 font-bold uppercase tracking-widest text-sm rounded-lg border border-blue-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         Add HP
                       </button>
                    </div>
                 </div>
               </div>

               <div className="mt-6 flex justify-end">
                 <button 
                   onClick={() => setShowLevelUpModal(false)}
                   className="text-zinc-600 hover:text-zinc-400 text-sm font-bold transition-colors"
                 >
                   Skip for now
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropCompleteAction={handleCropComplete}
        />
      )}
    </div>
  );
};
