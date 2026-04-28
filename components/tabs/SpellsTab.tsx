"use client";
import React, { useState, useEffect } from 'react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { dataService, Spell } from '@/services/dataService';
import { useDebounce } from 'use-debounce';
import { Search, Loader2, BookmarkPlus, Sparkles, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ExpandableText } from '@/components/ExpandableText';

export const SpellsTab = () => {
  const { characters, activeCharacterId, addSpell, removeSpell, consumeSpellSlot } = useCharacterStore();
  const character = characters.find(c => c.id === activeCharacterId);

  const [srdSpells, setSrdSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    setLoading(true);
    dataService.getSpells(i18n.language).then(data => {
      setSrdSpells(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [i18n.language]);

  if (!character) return null;

  const filteredSrd = debouncedSearch.length >= 2
    ? srdSpells.filter(s => s.name.toLowerCase().includes(debouncedSearch.toLowerCase())).slice(0, 50)
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full">
      {/* Spellbook (Known Spells) */}
      <section className="flex-1 flex flex-col min-h-0 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/80">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-serif text-accent-gold flex items-center gap-2 tracking-wide">
            <Sparkles size={20} /> Spellbook
          </h3>
          
          {/* Dynamic Spell Slots UI */}
          <div className="flex flex-col items-end gap-2">
            {character.pactSlots && character.pactSlots.max > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Pact (Lvl {character.pactSlots.level})</span>
                <div className="flex gap-1">
                  {Array.from({ length: character.pactSlots.max }).map((_, i) => (
                    <button
                      key={i}
                      disabled={i >= character.pactSlots!.current}
                      onClick={() => consumeSpellSlot(character.pactSlots!.level, true)}
                      className={`w-4 h-4 rounded-full border border-purple-500 transition-colors ${i < character.pactSlots!.current ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] cursor-pointer' : 'bg-transparent opacity-30 cursor-not-allowed'}`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {character.maxSpellSlots && character.maxSpellSlots.some(s => s > 0) && (
              <div className="flex flex-col items-end gap-1.5">
                {character.maxSpellSlots.map((max, levelIndex) => {
                  if (max === 0) return null;
                  const current = character.currentSpellSlots[levelIndex];
                  const level = levelIndex + 1;
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Lvl {level}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: max }).map((_, i) => (
                          <button
                            key={i}
                            disabled={i >= current}
                            onClick={() => consumeSpellSlot(level, false)}
                            className={`w-3.5 h-3.5 rounded-sm border border-accent-gold transition-colors ${i < current ? 'bg-accent-gold shadow-[0_0_5px_rgba(184,134,11,0.5)] cursor-pointer hover:bg-yellow-400' : 'bg-transparent opacity-30 cursor-not-allowed'}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4">
          {character.knownSpells.length === 0 ? (
            <p className="text-zinc-500 italic text-center mt-10">No spells known yet. Search the SRD to add some.</p>
          ) : (
            character.knownSpells.map(spell => (
              <div key={spell.index} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 group relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-bold text-zinc-200">{spell.name}</h4>
                    <p className="text-xs text-zinc-500">{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.school?.name}</p>
                  </div>
                  <button
                    onClick={() => removeSpell(spell.index)}
                    className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="text-sm text-zinc-400 mb-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong className="text-zinc-300">Cast:</strong> {spell.casting_time}</span>
                  <span><strong className="text-zinc-300">Range:</strong> {spell.range}</span>
                  <span><strong className="text-zinc-300">Dur:</strong> {spell.duration}</span>
                </div>
                {spell.desc && spell.desc.length > 0 && (
                  <ExpandableText text={spell.desc} />
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* SRD Discovery */}
      <section className="flex-1 flex flex-col min-h-0 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/80">
        <h3 className="text-xl font-serif text-accent-gold mb-6 tracking-wide">
          SRD Compendium
        </h3>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search spells (e.g. Fireball)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-accent-gold transition-colors"
          />
          {loading && <Loader2 size={16} className="absolute right-3 top-3 text-accent-gold animate-spin" />}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-3">
          {!searchTerm ? (
            <p className="text-zinc-600 text-sm text-center mt-10">Type at least 2 characters to search over 300 spells.</p>
          ) : filteredSrd.length === 0 && !loading ? (
            <p className="text-zinc-500 text-sm text-center mt-10">No spells found.</p>
          ) : (
            filteredSrd.map(spell => {
              const isKnown = character.knownSpells.some(s => s.index === spell.index);
              return (
                <div key={spell.index} className="flex items-center justify-between bg-zinc-950 p-3 rounded border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div>
                    <span className="font-bold text-zinc-300 block">{spell.name}</span>
                    <span className="text-xs text-zinc-500">Lvl {spell.level} • {spell.school?.name}</span>
                  </div>
                  <button
                    onClick={() => addSpell(spell)}
                    disabled={isKnown}
                    className={`p-2 rounded flex items-center gap-1 text-xs font-bold transition-all ${isKnown ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/40'
                      }`}
                  >
                    <BookmarkPlus size={14} />
                    {isKnown ? 'Known' : 'Add'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
