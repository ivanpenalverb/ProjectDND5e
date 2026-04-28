"use client";
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useCharacterStore, CharacterFeature } from '@/store/useCharacterStore';
import { AvatarCropModal } from './AvatarCropModal';
import { getClassProgression } from '@/utils/classProgression';
import { exportCharacterToJSON } from '@/services/fileService';
import { dataService, Spell, InventoryItem, Monster } from '@/services/dataService';
import { ChevronRight, ChevronLeft, Upload, User, Wand2, Shield, Beaker, Dices, Loader2, X } from 'lucide-react';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const POINT_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const CLASSES = ['Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const RACES = ['Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Halfling', 'Half-Orc', 'Human', 'Tiefling'];

export const CharacterCreatorWizard = ({ isOpen, onClose }: WizardProps) => {
  const { createCharacter, importCharacter, setActiveCharacter, characters } = useCharacterStore();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [race, setRace] = useState('Human');
  const [className, setClassName] = useState('Fighter');
  const [level, setLevel] = useState(1);
  
  const [abilityScores, setAbilityScores] = useState({
    STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10
  });

  // Avatar State
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Features State
  const [fixedFeatures, setFixedFeatures] = useState<CharacterFeature[]>([]);
  const [featureChoices, setFeatureChoices] = useState<Record<string, CharacterFeature[]>>({});
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [isProcessingFeatures, setIsProcessingFeatures] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setRace('Human');
      setClassName('Fighter');
      setLevel(1);
      setAbilityScores({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 });
      setRawImageSrc(null);
      setAvatarData('');
      setShowCropModal(false);
      setIsExporting(false);
      setFixedFeatures([]);
      setFeatureChoices({});
      setSelectedChoices({});
      setIsProcessingFeatures(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (step > 1 || name.trim() !== '' || avatarData) {
      if (!window.confirm("Are you sure you want to exit? All progress on this new character will be lost.")) {
        return;
      }
    }
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setRawImageSrc(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (base64Str: string) => {
    setAvatarData(base64Str);
    setShowCropModal(false);
  };

  const setStandardArray = () => {
    setAbilityScores({ STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 });
  };

  const pointsSpent = useMemo(() => {
    return Object.values(abilityScores).reduce((acc, score) => acc + (POINT_COSTS[score] || 0), 0);
  }, [abilityScores]);

  const progression = useMemo(() => getClassProgression(className, level), [className, level]);

  const processFeatures = async () => {
    setIsProcessingFeatures(true);
    try {
      const [allFeatures, allTraits] = await Promise.all([
        dataService.getFeatures('en'),
        dataService.getTraits('en')
      ]);

      const classFeatures = allFeatures.filter(f => f.level === 1 && f.class?.name.toLowerCase() === className.toLowerCase());
      const raceTraits = allTraits.filter(t => t.races?.some(r => r.name.toLowerCase() === race.toLowerCase()));

      const combined = [
        ...classFeatures.map(f => ({ ...f, source: 'Class' })),
        ...raceTraits.map(t => ({ ...t, source: 'Race' }))
      ];

      const fixed: any[] = [];
      const choices: Record<string, any[]> = {};

      const regex = /^(.*)\s\((.*)\)$/;
      const potentialGroups: Record<string, any[]> = {};
      
      combined.forEach(item => {
        const match = item.name.match(regex);
        if (match) {
          const groupName = match[1];
          if (!potentialGroups[groupName]) potentialGroups[groupName] = [];
          potentialGroups[groupName].push({ ...item, _optionName: match[2] });
        } else {
          fixed.push(item);
        }
      });

      Object.keys(potentialGroups).forEach(groupName => {
        if (potentialGroups[groupName].length > 1) {
          choices[groupName] = potentialGroups[groupName];
        } else {
          fixed.push(potentialGroups[groupName][0]);
        }
      });

      setFixedFeatures(fixed.map(f => ({ index: f.index, name: f.name, desc: f.desc, source: f.source, customId: Math.random().toString(36).substring(7) })));
      
      const mappedChoices: Record<string, CharacterFeature[]> = {};
      Object.keys(choices).forEach(k => {
        mappedChoices[k] = choices[k].map(f => ({ index: f.index, name: f.name, desc: f.desc, source: f.source, customId: Math.random().toString(36).substring(7), _optionName: f._optionName } as any));
      });
      
      setFeatureChoices(mappedChoices);
      setSelectedChoices({});
    } catch (e) {
      console.warn("Could not load SRD features: ", e);
      setFixedFeatures([]);
      setFeatureChoices({});
    }
    setIsProcessingFeatures(false);
  };

  const handleFinish = async () => {
    setIsExporting(true);
    
    const newId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const newChar = {
      id: newId,
      name: name || 'Unnamed Hero',
      race,
      className,
      level,
      abilityScores,
      avatarUrl: avatarData || undefined,
      knownSpells: [] as Spell[],
      inventory: [] as InventoryItem[],
      monsters: [] as (Monster & { pinned: boolean })[],
      features: [] as CharacterFeature[],
      maxHp: 10 + Math.floor((abilityScores.CON - 10) / 2),
      currentHp: 10 + Math.floor((abilityScores.CON - 10) / 2),
      hitDice: { current: level, max: level, face: 10 },
      maxSpellSlots: progression.maxSpellSlots,
      currentSpellSlots: [...progression.maxSpellSlots],
      pactSlots: progression.pactSlots ? { ...progression.pactSlots, current: progression.pactSlots.max } : undefined,
      proficiencies: [] as string[],
      sessionNotes: '',
      backstory: '',
      allies: '',
      ideals: '',
      bonds: '',
      flaws: '',
      appearance: ''
    };

    const finalFeatures = [...fixedFeatures];
    Object.keys(selectedChoices).forEach(groupName => {
       const selectedIndex = selectedChoices[groupName];
       const feature = featureChoices[groupName].find(f => f.index === selectedIndex);
       if (feature) {
          const cleanFeature = { ...feature };
          delete (cleanFeature as any)._optionName;
          finalFeatures.push(cleanFeature);
       }
    });
    newChar.features = finalFeatures;
    
    // Suggest backup export
    try {
      await exportCharacterToJSON(newChar as any);
    } catch (e) {
      console.warn("Export interrupted: ", e);
    }
    
    // We bypass the generic createCharacter that starts everything at level 1 fighter and import this fresh one
    importCharacter(newChar as any);
    setActiveCharacter(newId);
    setIsExporting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-accent-gold/30 rounded-2xl overflow-hidden w-full max-w-3xl shadow-[0_0_80px_rgba(184,134,11,0.15)] flex flex-col h-[85vh] max-h-[800px] animate-in zoom-in-95 duration-500">
        
        {/* Wizard Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/50 flex justify-between items-start shrink-0">
          <div className="flex gap-4 items-center">
             <Wand2 className="text-accent-gold" size={24} />
             <div>
               <h2 className="text-2xl font-serif text-zinc-100 tracking-wide uppercase">Summon Hero</h2>
               <p className="text-sm text-zinc-500 tracking-widest">Step {step} of 4</p>
             </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <button 
              onClick={handleClose} 
              className="text-zinc-500 hover:text-red-400 bg-zinc-950/50 border border-zinc-800 hover:border-red-900/50 p-1.5 rounded-full transition-all"
              title="Close Wizard"
            >
              <X size={18} />
            </button>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 w-10 md:w-12 rounded-full transition-colors duration-500 ${step >= i ? 'bg-accent-gold shadow-[0_0_10px_rgba(184,134,11,0.8)]' : 'bg-zinc-800'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 relative">
          
          {step === 1 && (
            <div className="flex flex-col md:flex-row gap-10 h-full animate-in slide-in-from-right-8 duration-500">
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div 
                  className="w-48 h-48 rounded-full border-2 border-dashed border-zinc-700 hover:border-accent-gold/50 flex items-center justify-center bg-zinc-900/50 overflow-hidden cursor-pointer transition-colors group relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarData ? (
                    <>
                      <img src={avatarData} alt="Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-zinc-300 font-bold tracking-widest uppercase">
                        Change
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-600 group-hover:text-accent-gold/80 transition-colors">
                      <Upload size={32} className="mb-2" />
                      <span className="text-xs font-bold tracking-widest uppercase">Upload Portrait</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                <p className="text-xs text-zinc-600 text-center uppercase tracking-widest">A face for the legends.</p>
              </div>

              <div className="flex-[1.5] flex flex-col justify-center gap-6">
                <div>
                  <label className="block text-accent-gold text-xs font-bold uppercase tracking-widest mb-2">Character Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-zinc-900/50 border-b-2 border-zinc-700 focus:border-accent-gold px-4 py-3 text-2xl font-serif text-zinc-100 outline-none transition-colors"
                    placeholder="E.g. Alaric"
                    autoFocus
                  />
                </div>
                <div>
                   <label className="block text-accent-gold text-xs font-bold uppercase tracking-widest mb-2">Race</label>
                   <select 
                     value={race} 
                     onChange={e => setRace(e.target.value)}
                     className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 outline-none focus:border-accent-gold transition-colors font-bold"
                   >
                     {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-8 h-full animate-in slide-in-from-right-8 duration-500">
              <div className="flex gap-6">
                <div className="flex-1">
                   <label className="block text-accent-gold text-xs font-bold uppercase tracking-widest mb-2">Class</label>
                   <select 
                     value={className} 
                     onChange={e => setClassName(e.target.value)}
                     className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 outline-none focus:border-accent-gold transition-colors font-bold text-lg"
                   >
                     {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="w-32">
                   <label className="block text-accent-gold text-xs font-bold uppercase tracking-widest mb-2">Level</label>
                   <input 
                     type="number" min={1} max={20}
                     value={level} 
                     onChange={e => setLevel(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                     className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 outline-none focus:border-accent-gold transition-colors font-bold text-lg text-center"
                   />
                </div>
              </div>

              {/* Class Matrix Preview */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-inner relative overflow-hidden flex-1">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                <h4 className="text-zinc-100 font-serif text-xl tracking-wide flex items-center gap-2 mb-4">
                  <Shield className="text-accent-gold" size={20} /> Class Features Acquired
                </h4>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-zinc-950/80 p-4 rounded-lg border border-zinc-800">
                     <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Magical Aptitude</span>
                     {progression.cantripsKnown > 0 ? (
                       <div className="text-sm text-zinc-300"><strong className="text-accent-gold">{progression.cantripsKnown}</strong> Cantrips Known</div>
                     ) : (
                       <div className="text-sm text-zinc-600 italic">No Cantrips</div>
                     )}
                  </div>

                  <div className="bg-zinc-950/80 p-4 rounded-lg border border-zinc-800">
                     <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Spell Capacity</span>
                     {progression.pactSlots ? (
                       <div className="text-sm text-zinc-300">
                         <strong className="text-purple-400">{progression.pactSlots.max}</strong> Slots of Level <strong className="text-purple-400">{progression.pactSlots.level}</strong> (Recovers on Short Rest)
                       </div>
                     ) : progression.maxSpellSlots.some(s => s > 0) ? (
                       <div className="text-sm text-zinc-300">
                         {progression.maxSpellSlots.map((slots, i) => slots > 0 ? (
                           <span key={i} className="inline-block mr-3 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-xs mb-2">
                             Lvl {i + 1}: <strong className="text-accent-gold">{slots}</strong>
                           </span>
                         ) : null)}
                       </div>
                     ) : (
                       <div className="text-sm text-zinc-600 italic">Martial Class. Rely on steel and muscle.</div>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 duration-500">
              <div className="flex justify-between items-end">
                <p className="text-zinc-400 text-sm">Assign numbers representing your character's capabilities.</p>
                <div className="flex gap-2">
                   <button onClick={setStandardArray} className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-accent-gold text-zinc-300 text-xs font-bold uppercase tracking-widest rounded transition-colors">Standard Array</button>
                </div>
              </div>
              
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                 <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Point Buy Generator:</span>
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-32 bg-zinc-950 rounded-full overflow-hidden">
                     <div className={`h-full transition-all ${pointsSpent > 27 ? 'bg-red-500' : 'bg-accent-gold'}`} style={{ width: `${Math.min(100, (pointsSpent / 27) * 100)}%` }} />
                   </div>
                   <span className={`text-sm font-bold ${pointsSpent === 27 ? 'text-accent-gold' : pointsSpent > 27 ? 'text-red-500' : 'text-zinc-400'}`}>{pointsSpent} / 27</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                 {Object.keys(abilityScores).map(score => (
                   <div key={score} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col items-center gap-2 group focus-within:border-accent-gold/50 transition-colors">
                     <span className="text-accent-gold font-serif text-lg tracking-widest">{score}</span>
                     <input 
                       type="number" 
                       min={8} 
                       max={15}
                       value={abilityScores[score as keyof typeof abilityScores]}
                       onChange={e => setAbilityScores({ ...abilityScores, [score]: Math.min(15, Math.max(8, Number(e.target.value) || 8)) })}
                       className="w-16 h-12 bg-zinc-900 rounded border border-zinc-700 text-center font-bold text-xl text-zinc-100 outline-none focus:border-accent-gold"
                     />
                     <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Cost: {POINT_COSTS[abilityScores[score as keyof typeof abilityScores]] || 0} pts</span>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6 h-full animate-in slide-in-from-right-8 duration-500">
               {isProcessingFeatures ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-accent-gold" size={48} />
                    <p className="text-zinc-400 text-sm tracking-widest uppercase font-bold">Divining Pathways...</p>
                 </div>
               ) : Object.keys(featureChoices).length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                    <Wand2 size={48} className="text-zinc-600" />
                    <p className="text-zinc-400">Your path is clear. No further choices are required for your race and class.</p>
                 </div>
               ) : (
                 <div className="flex flex-col gap-8 pb-10">
                   <div>
                     <h3 className="text-xl font-serif text-accent-gold mb-1">Refine Capabilities</h3>
                     <p className="text-zinc-400 text-sm">Your ancestry and training offer multiple paths. Choose wisely.</p>
                   </div>
                   
                   {Object.keys(featureChoices).map(groupName => {
                     const options = featureChoices[groupName];
                     const selectedIndex = selectedChoices[groupName];
                     const selectedOption = options.find(o => o.index === selectedIndex);

                     return (
                       <div key={groupName} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl">
                          <h4 className="text-accent-gold font-bold uppercase tracking-widest text-sm mb-3">{groupName}</h4>
                          <select 
                            value={selectedIndex || ''}
                            onChange={(e) => setSelectedChoices({ ...selectedChoices, [groupName]: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-100 outline-none focus:border-accent-gold mb-3 font-bold"
                          >
                            <option value="" disabled>-- Select an option --</option>
                            {options.map(opt => (
                              <option key={opt.index} value={opt.index}>{(opt as any)._optionName || opt.name}</option>
                            ))}
                          </select>
                          
                          {selectedOption && (
                            <div className="bg-zinc-950/50 p-4 rounded text-sm text-zinc-300 border border-zinc-800/50 leading-relaxed shadow-inner">
                               {selectedOption.desc.map((p, i) => <p key={i} className="mb-2 last:mb-0">{p}</p>)}
                            </div>
                          )}
                       </div>
                     )
                   })}
                 </div>
               )}
            </div>
          )}

        </div>

        <div className="p-6 border-t border-zinc-800/80 bg-zinc-950 flex justify-between shrink-0">
          <button 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1}
            className="px-6 py-2 rounded font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors disabled:opacity-0 disabled:pointer-events-none text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={() => {
                if (step === 3) {
                  processFeatures().then(() => setStep(4));
                } else {
                  setStep(step + 1);
                }
              }} 
              disabled={step === 1 && !name}
              className="px-6 py-2 bg-accent-gold text-zinc-950 hover:bg-yellow-600 rounded font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors disabled:opacity-50 disabled:grayscale"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleFinish} 
              disabled={isExporting || (Object.keys(featureChoices).length > 0 && Object.keys(selectedChoices).length < Object.keys(featureChoices).length)}
              className="px-6 py-2 bg-green-900 border border-green-700 text-green-100 hover:bg-green-800 rounded font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:grayscale"
            >
              {isExporting ? <><Loader2 size={16} className="animate-spin" /> Scribing...</> : 'Conclude Ritual'}
            </button>
          )}
        </div>
      </div>

      {showCropModal && rawImageSrc && (
        <AvatarCropModal
          imageSrc={rawImageSrc}
          onClose={() => setShowCropModal(false)}
          onCropCompleteAction={handleCropComplete}
        />
      )}
    </div>
  );
};
