"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { dataService } from '@/services/dataService';
import { BookOpen, Skull, Sword, Shield, Activity, ChevronDown, ChevronUp, Zap, Trash2, Search, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';
import { ExpandableText } from '@/components/ExpandableText';

const MonsterCard = ({ monster, unpin }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-lg transition-all mb-4 group/card">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/80 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Skull className="text-red-500/80 flex-shrink-0" size={18} />
          <h4 className="font-serif text-zinc-100 font-bold tracking-wide truncate pr-2 text-sm">{monster.name}</h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
           <button 
             onClick={(e) => { e.stopPropagation(); unpin(); }}
             className="p-1 hover:bg-red-500/20 text-zinc-600 hover:text-red-500 rounded transition-colors opacity-0 group-hover/card:opacity-100"
             title="Remove pinned monster"
           >
             <Trash2 size={14} />
           </button>
           <div className="p-1 text-zinc-500">
             {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
           </div>
        </div>
      </div>
      
      {isOpen && (
         <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
           {/* Quick Stats Grid */}
           <div className="grid grid-cols-2 gap-3 text-xs">
             <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded border border-zinc-800/50" title="Armor Class">
               <Shield size={14} className="text-blue-400" /> 
               <span className="text-zinc-300 font-medium">{monster.armor_class?.[0]?.value || '?'} {t('stats.ac')}</span>
             </div>
             <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded border border-zinc-800/50" title="Hit Points">
               <Activity size={14} className="text-red-400" /> 
               <span className="text-zinc-300 font-medium">{monster.hit_points || '?'} HP</span>
             </div>
              <div className="col-span-2 flex items-center gap-2 bg-zinc-900/80 p-2 rounded border border-zinc-800/50" title="Speed">
               <Zap size={14} className="text-accent-gold/80" /> 
               <span className="text-zinc-300 capitalize">{Object.values(monster.speed || {}).join(', ') || '?'}</span>
             </div>
           </div>
           
           {/* Actions */}
           {monster.actions?.length > 0 && (
             <div className="mt-1">
               <span className="text-[10px] uppercase tracking-widest text-accent-gold border-b border-zinc-800/50 pb-1 mb-2 flex">{t('bestiary.actions')}</span>
               <div className="flex flex-col gap-3 mt-3">
                 {monster.actions.map((act: any, i: number) => (
                   <div key={i} className="text-xs text-zinc-400 leading-relaxed">
                     <strong className="text-zinc-200 mb-1 block uppercase tracking-wider">{act.name}</strong>
                     <ExpandableText text={act.desc} />
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
      )}
    </div>
  );
};

export const NotesTab = () => {
  const { characters, activeCharacterId, updateActiveCharacter, pinMonster, unpinMonster } = useCharacterStore();
  const character = characters.find(c => c.id === activeCharacterId);
  const { t, i18n } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [monsters, setMonsters] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dataService.getMonsters(i18n.language).then(setMonsters);
  }, [i18n.language]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      setSearchResults(monsters.filter(m => m.name.toLowerCase().includes(debouncedQuery.toLowerCase())).slice(0, 10));
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, monsters]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!character) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto h-[calc(100vh-140px)] animate-in fade-in pt-3 pb-8">
      {/* Left side: Notes */}
      <div className="flex-grow flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden relative group transition-all focus-within:border-accent-gold/30">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-accent-gold/0 via-accent-gold/20 to-accent-gold/0 opacity-0 group-focus-within:opacity-100 transition-opacity" />
        
        <div className="flex items-center gap-3 p-5 border-b border-zinc-800/80 bg-zinc-900/80 z-10 w-full">
          <BookOpen className="text-accent-gold" size={20} />
          <h3 className="text-lg font-serif text-accent-gold tracking-widest uppercase shadow-sm">{t('notes.title')}</h3>
        </div>
        
        <textarea
          className="w-full flex-grow bg-transparent border-0 text-zinc-300 placeholder-zinc-700 p-6 focus:ring-0 resize-none outline-none leading-relaxed text-[15px] no-scrollbar"
          value={character.sessionNotes || ''}
          onChange={(e: any) => updateActiveCharacter({ sessionNotes: e.target.value })}
          placeholder={t('notes.placeholder') as string}
        />
      </div>

      {/* Right side: Pinned Bestiary */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
          <Sword className="text-red-500/80" size={18} />
          <h3 className="text-sm font-serif text-zinc-100 tracking-widest uppercase">{t('bestiary.title')}</h3>
        </div>
        
        {/* Search Box */}
        <div className="px-4 pt-4 pb-2 relative z-20" ref={searchContainerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder={t('bestiary.search') as string}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accent-gold transition-colors"
            />
            
            {/* Search Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-2xl max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                {searchResults.map(monster => {
                  const isPinned = character.monsters.some(m => m.index === monster.index);
                  return (
                    <div key={monster.index} className="flex items-center justify-between p-3 hover:bg-zinc-700/50 border-b border-zinc-700/50 last:border-0 transition-colors">
                      <span className="text-sm text-zinc-200 font-medium truncate pr-2">{monster.name}</span>
                      <button
                        onClick={() => {
                          if (!isPinned) pinMonster(monster);
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        disabled={isPinned}
                        className={`p-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                          isPinned 
                            ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed' 
                            : 'bg-zinc-900 text-accent-gold hover:bg-zinc-950 border border-zinc-700 hover:border-accent-gold'
                        }`}
                      >
                        {isPinned ? 'Pinned' : t('bestiary.pin')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pinned List */}
        <div className="bg-zinc-950/80 rounded-b-lg flex-grow p-4 overflow-y-auto no-scrollbar shadow-inner relative z-10">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>
          {character.monsters.filter(m => m.pinned).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-40 gap-3 text-zinc-600 px-4">
              <Skull size={32} className="opacity-20" />
              <p className="text-xs italic leading-relaxed whitespace-pre-wrap">
                {t('bestiary.empty')}
              </p>
            </div>
          ) : (
            character.monsters.filter(m => m.pinned).map((monster) => (
              <MonsterCard key={monster.index} monster={monster} unpin={() => unpinMonster(monster.index)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
