"use client";
import React from 'react';
import { TopNav } from '@/components/TopNav';
import { CharacterHeader } from '@/components/CharacterHeader';
import { StatSidebar } from '@/components/StatSidebar';
import { TabNavigation } from '@/components/TabNavigation';
import { useCharacterStore } from '@/store/useCharacterStore';
import { CharacterCreatorWizard } from '@/components/modals/CharacterCreatorWizard';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { DiceSystem } from '@/components/DiceSystem';

// Import New Active Tabs
import { StatsTab } from '@/components/tabs/StatsTab';
import { ActionsTab } from '@/components/tabs/ActionsTab';
import { SpellsTab } from '@/components/tabs/SpellsTab';
import { InventoryTab } from '@/components/tabs/InventoryTab';
import { NotesTab } from '@/components/tabs/NotesTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import { RollTab } from '@/components/tabs/RollTab';

export default function Home() {
  const { characters, activeCharacterId, activeTab, isWizardOpen, setIsWizardOpen, _hasHydrated } = useCharacterStore();
  
  const character = characters.find(c => c.id === activeCharacterId);
  const isAgony = character && character.currentHp === 0;
  
  // 1. Block rendering until Zustand has rehydrated from localStorage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-l-2 border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  // 2. Strict UI routing based on activeCharacterId
  if (!activeCharacterId) {
    return (
      <>
         <WelcomeScreen />
         <CharacterCreatorWizard 
           isOpen={isWizardOpen} 
           onClose={() => setIsWizardOpen(false)} 
         />
      </>
    );
  }

  const renderActiveTab = () => {
    switch(activeTab) {
      case 'Stats': return <StatsTab />;
      case 'Actions': return <ActionsTab />;
      case 'Spells': return <SpellsTab />;
      case 'Inventory': return <InventoryTab />;
      case 'Notes': return <NotesTab />;
      case 'History': return <HistoryTab />;
      case 'Roll': return <RollTab />;
      default: 
        return <div className="text-zinc-500 italic text-center mt-20 flex flex-col items-center">
          <span className="text-4xl text-zinc-800 font-serif mb-4 animate-pulse">?</span>
          Content for {activeTab} is still under development...
        </div>;
    }
  };

  return (
    <main className={`min-h-screen flex flex-col bg-zinc-950 transition-all duration-1000 relative ${isAgony ? 'saturate-50' : ''}`}>
      {isAgony && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-pulse border-[12px] border-red-900/30"></div>
      )}
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-screen-2xl mx-auto">
        {/* Left Sidebar (Stats) */}
        <StatSidebar />
        
        {/* Central Layout */}
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-10 lg:pl-12 w-full gap-6 overflow-hidden">
          {/* Character Header Section */}
          <CharacterHeader />
          
          {activeCharacterId ? (
            <>
              {/* Tab Navigation Section */}
              <div className="w-full mt-4">
                <TabNavigation />
              </div>

              {/* Active Tab Panel */}
              <div className="flex-1 mt-4 min-h-[400px]">
                {renderActiveTab()}
              </div>
            </>
          ) : (
             <div className="text-zinc-500 italic text-center mt-20 flex flex-col items-center">
               <span className="text-4xl text-zinc-800 font-serif mb-4">...</span>
               No Active Character Selected. Please select one from the Top Navigation.
             </div>
          )}
        </div>
      </div>
      
      {/* Global Dice Feedback & Log Overlay */}
      <DiceSystem />

      <CharacterCreatorWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
      />
    </main>
  );
}
