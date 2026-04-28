"use client";
import React from 'react';
import { useCharacterStore, calculateModifier, calculateProficiency } from '@/store/useCharacterStore';
import { Shield, Sparkles, Brain, Check, Dices, Plus, Trash2, BookOpen, Flame, Eye, Search } from 'lucide-react';
import { rollDice } from '@/services/diceService';
import { ExpandableText } from '@/components/ExpandableText';

const SAVING_THROWS = [
  { name: 'Strength', attr: 'STR' },
  { name: 'Dexterity', attr: 'DEX' },
  { name: 'Constitution', attr: 'CON' },
  { name: 'Intelligence', attr: 'INT' },
  { name: 'Wisdom', attr: 'WIS' },
  { name: 'Charisma', attr: 'CHA' },
] as const;

const SKILLS = [
  { name: 'Acrobatics', attr: 'DEX' },
  { name: 'Animal Handling', attr: 'WIS' },
  { name: 'Arcana', attr: 'INT' },
  { name: 'Athletics', attr: 'STR' },
  { name: 'Deception', attr: 'CHA' },
  { name: 'History', attr: 'INT' },
  { name: 'Insight', attr: 'WIS' },
  { name: 'Intimidation', attr: 'CHA' },
  { name: 'Investigation', attr: 'INT' },
  { name: 'Medicine', attr: 'WIS' },
  { name: 'Nature', attr: 'INT' },
  { name: 'Perception', attr: 'WIS' },
  { name: 'Performance', attr: 'CHA' },
  { name: 'Persuasion', attr: 'CHA' },
  { name: 'Religion', attr: 'INT' },
  { name: 'Sleight of Hand', attr: 'DEX' },
  { name: 'Stealth', attr: 'DEX' },
  { name: 'Survival', attr: 'WIS' },
] as const;

export const StatsTab = () => {
  const { characters, activeCharacterId, toggleProficiency, toggleInspiration, addRoll, addFeature, removeFeature } = useCharacterStore();
  const character = characters.find(c => c.id === activeCharacterId);

  const [showFeatureModal, setShowFeatureModal] = React.useState(false);
  const [featureName, setFeatureName] = React.useState('');
  const [featureDesc, setFeatureDesc] = React.useState('');

  const handleAddFeature = () => {
    if (!featureName.trim() || !featureDesc.trim()) return;
    addFeature({
      index: `custom-${Date.now()}`,
      name: featureName,
      desc: [featureDesc],
      source: 'Custom',
      customId: Math.random().toString(36).substring(7)
    });
    setFeatureName('');
    setFeatureDesc('');
    setShowFeatureModal(false);
  };

  if (!character) return null;

  const profBonus = calculateProficiency(character.level);
  const proficiencies = character.proficiencies || [];

  const wisMod = calculateModifier(character.abilityScores.WIS);
  const passivePerception = 10 + wisMod + (proficiencies.includes('Perception') ? profBonus : 0);
  const passiveInsight = 10 + wisMod + (proficiencies.includes('Insight') ? profBonus : 0);

  const handleRoll = (name: string, totalMod: number) => {
    const operator = totalMod >= 0 ? '+' : '';
    const diceRoll = rollDice(`1d20${operator}${totalMod}`, `${name} Check`);
    addRoll(diceRoll);
  };

  const renderStatGroup = (
    title: string, 
    icon: React.ReactNode, 
    items: { name: string, attr: string }[]
  ) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 w-full shadow-lg">
      <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-3">
        {icon}
        <h3 className="text-xl font-serif text-accent-gold tracking-widest uppercase">{title}</h3>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-1 w-full">
        {items.map((item) => {
          const isProficient = proficiencies.includes(item.name);
          const attrValue = character.abilityScores[item.attr as keyof typeof character.abilityScores];
          const attrMod = calculateModifier(attrValue);
          const totalMod = attrMod + (isProficient ? profBonus : 0);
          const formattedMod = totalMod >= 0 ? `+${totalMod}` : totalMod.toString();

          return (
            <div key={item.name} className="flex items-center justify-between w-full py-1.5 px-1 hover:bg-zinc-800/30 rounded-md transition-colors">
              
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button 
                  onClick={() => toggleProficiency(item.name)}
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                    isProficient 
                      ? 'bg-accent-gold text-zinc-950 shadow-[0_0_10px_rgba(184,134,11,0.5)]' 
                      : 'bg-zinc-950 border border-zinc-700 text-transparent hover:border-accent-gold/50'
                  }`}
                  title={isProficient ? "Proficient" : "Not Proficient"}
                >
                  <Check size={14} className={isProficient ? 'opacity-100' : 'opacity-0 transition-opacity'} strokeWidth={3} />
                </button>
                
                <div className="flex flex-col min-w-0 text-left cursor-default group/tooltip relative w-full">
                  <span className={`text-sm font-medium truncate ${isProficient ? 'text-accent-gold' : 'text-zinc-200'}`}>
                    {item.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                    {item.attr}
                  </span>

                  <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs bg-zinc-950 border border-zinc-700 text-xs text-zinc-300 p-2 rounded shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10 hidden md:block">
                     <div className="text-zinc-500 uppercase font-bold text-[9px] tracking-widest border-b border-zinc-800 pb-1 mb-1">{item.name} Calculation</div>
                     <div className="flex items-center space-x-1">
                       <span className="text-zinc-400">[{item.attr}{attrMod >= 0 ? `+${attrMod}` : attrMod}]</span> 
                       <span className="text-zinc-600">+</span> 
                       <span className={isProficient ? "text-accent-gold" : "text-zinc-600"}>[Prof+{isProficient ? profBonus : 0}]</span> 
                       <span className="text-zinc-600">=</span> 
                       <strong className="text-zinc-100">Total {formattedMod}</strong>
                     </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 shrink-0">
                <span className={`text-sm font-bold text-right w-6 ${isProficient ? 'text-zinc-100' : 'text-zinc-400'}`}>
                  {formattedMod}
                </span>
                <button 
                  onClick={() => handleRoll(item.name, totalMod)}
                  className="w-7 h-7 flex items-center justify-center shrink-0 rounded bg-zinc-800 border border-zinc-700 hover:border-accent-gold/50 cursor-pointer transition-colors group/roll active:scale-95"
                  title={`Roll ${item.name}`}
                >
                  <Dices size={14} className="text-zinc-500 group-hover/roll:text-accent-gold transition-colors" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 pt-2">
      {/* Header Info Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {/* Proficiency Bonus */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 relative z-0 opacity-50 pointer-events-none" />
          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 relative z-10 flex-shrink-0">
             <Brain className="text-accent-gold" size={20} />
          </div>
          <div className="relative z-10 flex flex-col justify-center min-w-0">
            <span className="block text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-0.5 truncate">Proficiency</span>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-serif text-zinc-100 leading-none">+{profBonus}</span>
            </div>
          </div>
        </div>

        {/* Inspiration */}
        <button 
          onClick={toggleInspiration}
          className={`flex items-center gap-4 bg-zinc-900 border rounded-lg p-4 shadow-lg relative overflow-hidden group text-left transition-all ${character.hasInspiration ? 'border-accent-gold shadow-[0_0_15px_rgba(184,134,11,0.15)]' : 'border-zinc-800 hover:border-zinc-700'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 relative z-0 opacity-50 pointer-events-none" />
          <div className={`p-2.5 rounded-lg border relative z-10 flex-shrink-0 transition-colors ${character.hasInspiration ? 'bg-accent-gold/10 border-accent-gold text-accent-gold shadow-[0_0_10px_rgba(184,134,11,0.3)]' : 'bg-zinc-950 border-zinc-800 text-zinc-600 group-hover:text-zinc-400'}`}>
             <Flame size={20} />
          </div>
          <div className="relative z-10 flex flex-col justify-center min-w-0">
            <span className="block text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-0.5 truncate">Inspiration</span>
            <span className={`text-sm font-bold uppercase tracking-wider ${character.hasInspiration ? 'text-accent-gold' : 'text-zinc-600'}`}>
              {character.hasInspiration ? 'Active' : 'None'}
            </span>
          </div>
        </button>

        {/* Passive Perception */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 relative z-0 opacity-50 pointer-events-none" />
          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 relative z-10 flex-shrink-0">
             <Eye className="text-accent-gold" size={20} />
          </div>
          <div className="relative z-10 flex flex-col justify-center min-w-0">
            <span className="block text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-0.5 truncate">Passive Perc.</span>
            <span className="text-2xl font-serif text-zinc-100 leading-none">{passivePerception}</span>
          </div>
        </div>

        {/* Passive Insight */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 relative z-0 opacity-50 pointer-events-none" />
          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 relative z-10 flex-shrink-0">
             <Search className="text-accent-gold" size={20} />
          </div>
          <div className="relative z-10 flex flex-col justify-center min-w-0">
            <span className="block text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-0.5 truncate">Passive Insight</span>
            <span className="text-2xl font-serif text-zinc-100 leading-none">{passiveInsight}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-6 flex-[4]">
          {renderStatGroup(
            "Saving Throws", 
            <Shield className="text-accent-gold/80" size={24} />, 
            [...SAVING_THROWS]
          )}

          {renderStatGroup(
            "Skills", 
            <Sparkles className="text-accent-gold/80" size={24} />, 
            [...SKILLS]
          )}
        </div>

        {/* Right Column: Features & Traits */}
        <div className="flex flex-col gap-6 flex-[5]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 w-full shadow-lg h-full">
        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <BookOpen className="text-accent-gold/80" size={24} />
            <h3 className="text-xl font-serif text-accent-gold tracking-widest uppercase">Features & Traits</h3>
          </div>
          <button 
             onClick={() => setShowFeatureModal(true)}
             className="px-3 py-1.5 bg-zinc-950 text-accent-gold border border-zinc-800 rounded-md text-xs font-bold flex items-center gap-1 hover:border-accent-gold/50 transition-colors"
          >
             <Plus size={14} /> Custom Feature
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          {(!character.features || character.features.length === 0) ? (
            <p className="text-zinc-600 italic text-sm md:col-span-2">No features acquired.</p>
          ) : (
            character.features.map(f => (
              <div key={f.customId || f.index} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 group relative overflow-hidden flex flex-col gap-2">
                 <div className="flex items-start justify-between">
                   <div>
                     <span className="font-bold text-zinc-100 text-lg block">{f.name}</span>
                     <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Source: {f.source}</span>
                   </div>
                   <button onClick={() => removeFeature(f.customId || f.index)} className="text-zinc-700 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                     <Trash2 size={16} />
                   </button>
                 </div>
                 {f.desc && f.desc.length > 0 && (
                   <ExpandableText text={f.desc} />
                 )}
              </div>
            ))
          )}
        </div>
      </div>

        </div>
      </div>

      {/* Feature Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-serif text-accent-gold mb-4 border-b border-zinc-800 pb-2">Add Custom Feature</h3>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Name</label>
                 <input type="text" value={featureName} onChange={(e) => setFeatureName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:border-accent-gold outline-none" placeholder="e.g. Infernal Legacy" />
               </div>
               
               <div>
                 <label className="block text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Description</label>
                 <textarea value={featureDesc} onChange={(e) => setFeatureDesc(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 h-32 resize-none focus:border-accent-gold outline-none" placeholder="Details of your feature..." />
               </div>
             </div>

             <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowFeatureModal(false)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 font-bold text-sm">Cancel</button>
                <button 
                  onClick={handleAddFeature} 
                  disabled={!featureName || !featureDesc}
                  className="px-4 py-2 bg-accent-gold text-zinc-950 hover:bg-yellow-600 rounded font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Feature
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
