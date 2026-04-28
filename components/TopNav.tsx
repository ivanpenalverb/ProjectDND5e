"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Download, Upload, Globe, Palette } from 'lucide-react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { exportCharacterToJSON, importCharacterFromJSON } from '@/services/fileService';
import { useTranslation } from 'react-i18next';
import { useUiStore, ThemeType } from '@/store/useUiStore';

export const TopNav = () => {
  const { t, i18n } = useTranslation();
  const { characters, setIsWizardOpen, setActiveCharacter, activeCharacterId, importCharacter } = useCharacterStore();
  const { currentTheme, setTheme } = useUiStore();
  const activeChar = characters.find(c => c.id === activeCharacterId);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    setIsLangOpen(false);
  };

  const handleExport = () => {
    if (activeChar) {
      exportCharacterToJSON(activeChar);
    } else {
      showToast("No active character to export");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedChar = await importCharacterFromJSON(file);
      importCharacter(importedChar);
      showToast("Character imported successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to import character");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const links = ['help', 'templates'];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shadow-sm sticky top-0 z-50">
      {/* Mobile Menu Button */}
      <button className="md:hidden p-2 text-zinc-400 hover:text-zinc-200 focus:outline-none">
        <Menu size={24} />
      </button>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
        <button
          onClick={() => setIsWizardOpen(true)}
          className="text-zinc-400 hover:text-accent-gold transition-colors duration-200 tracking-wide"
        >
          {t('nav.new')}
        </button>

        {/* Export / Import */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1 text-zinc-400 hover:text-accent-gold transition-colors duration-200 tracking-wide"
          title="Export Active Character"
        >
          <Download size={14} /> {t('nav.export')}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-zinc-400 hover:text-accent-gold transition-colors duration-200 tracking-wide"
          title="Import Character"
        >
          <Upload size={14} /> {t('nav.import')}
        </button>
        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />



        {/* Language Dropdown */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1 text-zinc-400 hover:text-accent-gold transition-colors duration-200 tracking-wide"
          >
            <Globe size={14} /> <span className="uppercase">{i18n.language}</span> <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangOpen && (
            <div className="absolute top-full left-0 mt-2 w-32 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 z-50 overflow-hidden">
              <button
                onClick={() => changeLanguage('en')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors ${i18n.language === 'en' ? 'text-accent-gold font-bold bg-zinc-900/50' : 'text-zinc-200'}`}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('es')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors ${i18n.language === 'es' ? 'text-accent-gold font-bold bg-zinc-900/50' : 'text-zinc-200'}`}
              >
                Español
              </button>
            </div>
          )}
        </div>

        {/* Theme Dropdown */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="flex items-center gap-1 text-zinc-400 hover:text-accent-gold transition-colors duration-200 tracking-wide capitalize"
          >
            <Palette size={14} /> <span>{t('nav.background')}</span> <ChevronDown size={14} className={`transition-transform duration-200 ${isThemeOpen ? 'rotate-180' : ''}`} />
          </button>

          {isThemeOpen && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 z-50 overflow-hidden">
              {[
                { id: 'obsidian', label: 'Obsidian', hex: '#09090b' },
                { id: 'parchment', label: 'Parchment', hex: '#fdf6e3' },
                { id: 'arcane', label: 'Arcane', hex: '#05051a' }
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setTheme(theme.id as ThemeType);
                    setIsThemeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-700 transition-colors ${currentTheme === theme.id ? 'text-accent-gold font-bold bg-zinc-900/50' : 'text-zinc-200'}`}
                >
                  <span>{theme.label}</span>
                  <span className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-sm inline-block" style={{ backgroundColor: theme.hex }}></span>
                </button>
              ))}
            </div>
          )}
        </div>

        {links.map((link) => (
          <button
            key={link}
            className="text-zinc-400 hover:text-accent-gold transition-colors duration-200 tracking-wide capitalize"
          >
            {t(`nav.${link}`)}
          </button>
        ))}
      </div>

      <div className="flex items-center">
        <span className="text-accent-gold font-bold italic tracking-wider text-lg hidden md:block">
          Epic!!!
        </span>
      </div>

      {/* Elegant Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-zinc-200 px-4 py-2 rounded-md shadow-lg z-50 text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage}
        </div>
      )}
    </nav>
  );
};
