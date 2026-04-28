"use client";
import React from 'react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { useTranslation } from 'react-i18next';

export const TabNavigation = () => {
  const { activeTab, setActiveTab } = useCharacterStore();
  const { t } = useTranslation();
  const tabs = ['Stats', 'Actions', 'Spells', 'Inventory', 'History', 'Notes', 'Roll'];

  return (
    <div className="w-full flex space-x-2 md:space-x-8 border-b border-zinc-800 px-4 md:px-0 mt-6 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-4 whitespace-nowrap text-lg md:text-xl font-medium tracking-wide transition-colors duration-200 border-b-2 hover:text-zinc-100 ${
            activeTab === tab 
              ? 'border-accent-gold text-zinc-100' 
              : 'border-transparent text-zinc-500'
          }`}
        >
          {t(`tabs.${tab.toLowerCase()}`)}
        </button>
      ))}
    </div>
  );
};
