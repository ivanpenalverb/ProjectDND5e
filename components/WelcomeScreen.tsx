"use client";
import React, { useRef } from 'react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { Upload, Sparkles, ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const WelcomeScreen = () => {
  const { t } = useTranslation();
  const { setIsWizardOpen, importCharacter, setActiveCharacter } = useCharacterStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (jsonData.id && jsonData.name) {
          importCharacter(jsonData);
          // Set it as active to bypass the welcome screen immediately
          setActiveCharacter(jsonData.id);
        } else {
          alert('Invalid character data format. Missing ID or Name.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 animate-in fade-in duration-[2000ms] blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl px-6 py-12 text-center animate-in slide-in-from-bottom-10 fade-in duration-1000">
        
        <div className="mb-8 relative flex justify-center items-center">
          <div className="absolute w-32 h-32 bg-accent-gold/20 rounded-full blur-[50px] animate-pulse"></div>
          <ScrollText className="text-accent-gold w-20 h-20 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" strokeWidth={1} />
        </div>

        <h1 className="text-5xl md:text-7xl font-serif text-white tracking-widest uppercase mb-4 drop-shadow-2xl">
          Epic <span className="text-accent-gold">D&D</span> Manager
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl font-light mb-12 max-w-xl mx-auto tracking-wide">
          Your grand adventure awaits. Forge a new legend from the ashes, or summon an existing champion from the archives to continue the saga.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
           {/* Create Button */}
           <button 
             onClick={() => setIsWizardOpen(true)}
             className="group relative px-8 py-4 bg-accent-gold/10 hover:bg-accent-gold text-accent-gold hover:text-zinc-950 font-bold uppercase tracking-widest transition-all duration-300 border border-accent-gold/50 hover:border-transparent rounded-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
           >
             <Sparkles size={20} className="group-hover:animate-pulse" />
             Forge New Hero
           </button>

           {/* Import Button */}
           <button 
             onClick={handleImportClick}
             className="group px-8 py-4 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold uppercase tracking-widest transition-all duration-300 rounded-lg flex items-center justify-center gap-3"
           >
             <Upload size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
             Summon from JSON
           </button>
           <input 
             type="file" 
             accept="application/json" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleImport} 
           />
        </div>
      </div>
    </div>
  );
};
