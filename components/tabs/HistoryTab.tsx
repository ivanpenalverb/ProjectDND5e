"use client";
import React from 'react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { Scroll, Users, Heart, ShieldAlert, Sparkles, User } from 'lucide-react';

const TextAreaField = ({ label, value, onChange, placeholder, icon, rows = 4 }: any) => (
  <div className="flex flex-col gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5 w-full shadow-lg transition-all focus-within:border-accent-gold/50 focus-within:shadow-[0_0_15px_rgba(184,134,11,0.1)] group">
    <div className="flex items-center gap-3 mb-2 opacity-80 group-focus-within:opacity-100 transition-opacity">
      {icon}
      <h3 className="text-base font-serif text-accent-gold tracking-widest uppercase">{label}</h3>
    </div>
    <textarea
      className="w-full bg-transparent border-0 text-zinc-300 placeholder-zinc-700/50 focus:ring-0 resize-y no-scrollbar outline-none leading-relaxed text-sm"
      rows={rows}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);

export const HistoryTab = () => {
  const { characters, activeCharacterId, updateActiveCharacter } = useCharacterStore();
  const character = characters.find(c => c.id === activeCharacterId);

  if (!character) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-16 animate-in fade-in duration-500 pt-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="md:col-span-2">
          <TextAreaField 
            label="Backstory" 
            icon={<Scroll className="text-accent-gold/80" size={20} />} 
            value={character.backstory} 
            onChange={(e: any) => updateActiveCharacter({ backstory: e.target.value })} 
            placeholder="Tell the tale of your origins... A sprawling epic or a humble beginning."
            rows={10}
          />
        </div>

        <TextAreaField 
          label="Ideals" 
          icon={<Heart className="text-accent-gold/80" size={20} />} 
          value={character.ideals} 
          onChange={(e: any) => updateActiveCharacter({ ideals: e.target.value })} 
          placeholder="What drives your character?"
        />
        
        <TextAreaField 
          label="Bonds" 
          icon={<Users className="text-accent-gold/80" size={20} />} 
          value={character.bonds} 
          onChange={(e: any) => updateActiveCharacter({ bonds: e.target.value })} 
          placeholder="Who or what are you tied to?"
        />
        
        <TextAreaField 
          label="Flaws" 
          icon={<ShieldAlert className="text-accent-gold/80" size={20} />} 
          value={character.flaws} 
          onChange={(e: any) => updateActiveCharacter({ flaws: e.target.value })} 
          placeholder="What is your character's greatest weakness?"
        />

        <TextAreaField 
          label="Allies & Organizations" 
          icon={<Sparkles className="text-accent-gold/80" size={20} />} 
          value={character.allies} 
          onChange={(e: any) => updateActiveCharacter({ allies: e.target.value })} 
          placeholder="Guilds, friends, mentors, and patrons..."
        />

        <div className="md:col-span-2 mt-4 border-t border-zinc-800 pt-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent"></div>
          <TextAreaField 
            label="Appearance" 
            icon={<User className="text-accent-gold/80" size={20} />} 
            value={character.appearance} 
            onChange={(e: any) => updateActiveCharacter({ appearance: e.target.value })} 
            placeholder="Describe your character's physical appearance... Scars, eye color, typical attire."
            rows={5}
          />
        </div>
      </div>
    </div>
  );
};
