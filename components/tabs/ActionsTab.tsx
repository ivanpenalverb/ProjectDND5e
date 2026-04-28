"use client";
import React from 'react';
import { useCharacterStore, calculateModifier, calculateProficiency, calculateSaveDC } from '@/store/useCharacterStore';
import { Heart, Activity, ShieldPlus, Swords, Wand2, Target, Dices, Flame } from 'lucide-react';
import { rollDice } from '@/services/diceService';

export const ActionsTab = () => {
  const { characters, activeCharacterId, updateActiveCharacter, consumeSpellSlot, addRoll } = useCharacterStore();
  const character = characters.find(c => c.id === activeCharacterId);

  if (!character) return null;

  const profBonus = calculateProficiency(character.level);
  const strMod = calculateModifier(character.abilityScores.STR);
  const dexMod = calculateModifier(character.abilityScores.DEX);
  
  // Highest mental stat for generic spellcasting calculation
  const spellCastingMod = Math.max(
    calculateModifier(character.abilityScores.INT),
    calculateModifier(character.abilityScores.WIS),
    calculateModifier(character.abilityScores.CHA)
  );

  const spellSaveDC = calculateSaveDC(profBonus, spellCastingMod);

  // Extract weapons
  const weapons = character.inventory.filter((item: any) => item.damage && item.damage.damage_dice);
  
  // Extract damaging/attack spells
  const combatSpells = character.knownSpells.filter((spell: any) => 
    spell.damage || spell.attack_type
  );

  // Helpers
  const handleHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    updateActiveCharacter({ currentHp: val });
  };

  const setSlotCurrent = (levelIndex: number, current: number, isPact = false) => {
    if (isPact && character.pactSlots) {
       updateActiveCharacter({ pactSlots: { ...character.pactSlots, current } });
    } else {
       const newCurrentSlots = [...character.currentSpellSlots];
       newCurrentSlots[levelIndex] = current;
       updateActiveCharacter({ currentSpellSlots: newCurrentSlots });
    }
  };

  const executeWeaponAttack = (weapon: any) => {
    // Simple logic: finesse/ranged use DEX, else STR
    const isFinesse = weapon.properties && weapon.properties.some((p: any) => p.name === 'Finesse');
    const isRanged = weapon.equipment_category?.name?.includes('Ranged');
    const mod = isFinesse ? Math.max(strMod, dexMod) : (isRanged ? dexMod : strMod);
    
    const totalBonus = mod + profBonus;
    const sign = totalBonus >= 0 ? '+' : '';
    const roll = rollDice(`1d20${sign}${totalBonus}`, `${weapon.name} Attack`);
    addRoll(roll);
  };

  const executeWeaponDamage = (weapon: any) => {
    const isFinesse = weapon.properties && weapon.properties.some((p: any) => p.name === 'Finesse');
    const isRanged = weapon.equipment_category?.name?.includes('Ranged');
    const mod = isFinesse ? Math.max(strMod, dexMod) : (isRanged ? dexMod : strMod);
    
    const damageDice = weapon.damage.damage_dice;
    const sign = mod >= 0 ? '+' : '';
    const numMatches = damageDice.match(/(\d+)d(\d+)/);
    // Remove fixed modifiers from SRD damage dice if any exist and re-apply our calculated mod
    const cleanDice = numMatches ? numMatches[0] : damageDice;
    
    const roll = rollDice(`${cleanDice}${sign}${mod}`, `${weapon.name} Damage`);
    addRoll(roll);
  };

  const executeSpellAttack = (spell: any) => {
    const totalBonus = spellCastingMod + profBonus;
    const sign = totalBonus >= 0 ? '+' : '';
    const roll = rollDice(`1d20${sign}${totalBonus}`, `${spell.name} Attack`);
    addRoll(roll);
  };

  const executeSpellDamage = (spell: any) => {
    // Base level damage
    let damageDice = '0d0';
    if (spell.damage) {
      if (spell.damage.damage_at_slot_level && spell.damage.damage_at_slot_level[spell.level]) {
        damageDice = spell.damage.damage_at_slot_level[spell.level];
      } else if (spell.damage.damage_at_character_level && spell.damage.damage_at_character_level['1']) {
        // Cantrips scale dynamically but we grab baseline 1 for simplicity in V1
        damageDice = spell.damage.damage_at_character_level['1'];
      }
    }
    
    // Automatically consume slot if level > 0
    if (spell.level > 0) {
      const isPact = character.pactSlots && character.pactSlots.level === spell.level;
      const currentStandard = character.currentSpellSlots[spell.level - 1] || 0;
      const currentPact = isPact ? (character.pactSlots?.current || 0) : 0;
      
      if (currentStandard > 0) {
         consumeSpellSlot(spell.level, false);
      } else if (currentPact > 0) {
         consumeSpellSlot(spell.level, true);
      } else {
         alert(`No level ${spell.level} slots available! Rolling anyway...`);
      }
    }

    const roll = rollDice(`${damageDice}`, `${spell.name} Damage`);
    addRoll(roll);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* 1. Combat Tracker Header */}
      <section className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/80 flex flex-col xl:flex-row gap-8 items-center justify-between">
        {/* HP Moved to Character Header */}

        {/* Traditional Bubbles for Spell Slots */}
        <div className="flex-1 w-full bg-zinc-950/50 p-4 rounded-lg border border-zinc-900 min-h-[120px]">
           <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Activity size={16} /> Spell Slots
           </h3>
           <div className="flex flex-wrap gap-6">
             {character.pactSlots && character.pactSlots.max > 0 && (
                 <div className="flex flex-col gap-1 items-center">
                   <div className="text-[10px] text-zinc-500 font-bold uppercase">Pact (Lvl {character.pactSlots.level})</div>
                   <div className="flex gap-1">
                     {Array.from({ length: character.pactSlots.max }).map((_, i) => (
                       <button
                         key={i}
                         onClick={() => setSlotCurrent(character.pactSlots!.level, i < character.pactSlots!.current ? i : i + 1, true)}
                         className={`w-5 h-5 rounded-sm border border-purple-500 transition-colors ${
                           i < character.pactSlots!.current ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-transparent'
                         }`}
                       />
                     ))}
                   </div>
                 </div>
             )}
             
             {character.maxSpellSlots && character.maxSpellSlots.some(s => s > 0) ? (
                character.maxSpellSlots.map((max, levelIndex) => {
                 if (max === 0) return null;
                 const current = character.currentSpellSlots[levelIndex];
                 const level = levelIndex + 1;
                 
                 return (
                   <div key={level} className="flex flex-col gap-1 items-center bg-zinc-900/30 p-2 rounded-lg border border-zinc-800/50">
                     <div className="text-[10px] text-zinc-500 font-bold">Lvl {level}</div>
                     <div className="flex gap-1">
                       {Array.from({ length: max }).map((_, i) => (
                         <button
                           key={i}
                           onClick={() => setSlotCurrent(levelIndex, i < current ? i : i + 1, false)}
                           className={`w-5 h-5 rounded-full border border-accent-gold transition-colors ${
                             i < current ? 'bg-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-transparent'
                           }`}
                         />
                       ))}
                     </div>
                   </div>
                 );
               })
             ) : (
                !character.pactSlots && <span className="text-sm text-zinc-600 italic">No Spell Slots</span>
             )}
           </div>
        </div>
      </section>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* 2. Arsenal (Weapons) */}
        <section className="flex-1 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/80">
          <h3 className="text-xl font-serif text-accent-gold flex items-center gap-2 mb-6 tracking-wide border-b border-zinc-800 pb-2">
            <Swords size={20} /> Arsenal Actions
          </h3>
          <div className="space-y-4">
            {weapons.length === 0 ? (
              <p className="text-zinc-600 italic text-sm">No weapons equipped. Unarmed strikes beckon.</p>
            ) : (
              weapons.map((weapon: any) => (
                <div key={weapon.customId} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex justify-between items-center group hover:border-zinc-700 transition-colors">
                  <div>
                     <h4 className="text-lg font-bold text-zinc-200">{weapon.name}</h4>
                     <p className="text-xs text-zinc-500">{weapon.damage.damage_dice} {weapon.damage.damage_type?.name} • {(weapon.properties || []).map((p: any) => p.name).join(', ')}</p>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => executeWeaponAttack(weapon)}
                       className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded flex items-center gap-2 font-bold transition-colors text-sm border border-zinc-700"
                     >
                       <Target size={14} className="text-accent-gold" /> Attack
                     </button>
                     <button 
                       onClick={() => executeWeaponDamage(weapon)}
                       className="bg-red-950/40 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded flex items-center gap-2 font-bold transition-colors text-sm border border-red-900/50"
                     >
                       <Flame size={14} className="text-red-500" /> Damage
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 3. Spell Artillery (Combat Spells) */}
        <section className="flex-1 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/80">
          <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
             <h3 className="text-xl font-serif text-accent-gold flex items-center gap-2 tracking-wide">
               <Wand2 size={20} /> Spell Artillery
             </h3>
             <span className="bg-zinc-950 border border-zinc-800 text-zinc-400 px-3 py-1 rounded text-sm font-bold shadow-inner">
                Save DC: <span className="text-accent-gold">{spellSaveDC}</span>
             </span>
          </div>

          <div className="space-y-4">
            {combatSpells.length === 0 ? (
              <p className="text-zinc-600 italic text-sm">No damaging spells prepared.</p>
            ) : (
              combatSpells.map((spell: any) => {
                const isAttack = !!spell.attack_type;
                const isSave = !isAttack && spell.dc;
                return (
                  <div key={spell.index} className="bg-zinc-950 p-4 rounded-lg border border-blue-900/20 flex justify-between items-center group hover:border-blue-900/50 transition-colors">
                    <div>
                       <h4 className="text-lg font-bold text-blue-200">{spell.name}</h4>
                       <p className="text-xs text-blue-500/70">{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • Cast: {spell.casting_time}</p>
                    </div>
                    <div className="flex gap-2">
                       {isAttack && (
                         <button 
                           onClick={() => executeSpellAttack(spell)}
                           className="bg-zinc-800 hover:bg-zinc-700 text-blue-300 px-3 py-1.5 rounded flex items-center gap-2 font-bold transition-colors text-sm border border-zinc-700"
                         >
                           <Target size={14} className="text-blue-400" /> Attack
                         </button>
                       )}
                       {isSave && (
                         <div className="bg-zinc-900 text-zinc-400 px-3 py-1.5 rounded flex items-center gap-1 font-bold text-sm border border-zinc-800 cursor-help" title={`Requires ${spell.dc?.dc_type?.name} save against DC ${spellSaveDC}`}>
                           <ShieldPlus size={14} /> {spell.dc?.dc_type?.name} Save
                         </div>
                       )}
                       <button 
                         onClick={() => executeSpellDamage(spell)}
                         className="bg-orange-950/40 hover:bg-orange-900/60 text-orange-400 px-3 py-1.5 rounded flex items-center gap-2 font-bold transition-colors text-sm border border-orange-900/50"
                       >
                         <Flame size={14} className="text-orange-500" /> Cast & Dmg
                       </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
