import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storageAdapter } from '@/utils/storageAdapter';
import { DiceRollResult } from '@/services/diceService';
import { Spell, InventoryItem, Monster, Feature, Trait } from '@/services/dataService';

export type CharacterFeature = {
  index: string;
  name: string;
  desc: string[];
  source: string; // e.g. "Class", "Race", "Custom"
  customId?: string;
};
import { getClassProgression } from '@/utils/classProgression';

export interface Character {
  id: string;
  name: string;
  race: string;
  className: string;
  level: number;
  abilityScores: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  // Data additions
  knownSpells: Spell[];
  inventory: InventoryItem[];
  monsters: (Monster & { pinned: boolean })[];
  features: CharacterFeature[];
  currency: { cp: number; sp: number; gp: number; };
  // Combat Tracker
  armorClass: number;
  speed: number;
  maxHp: number;
  currentHp: number;
  hitDice: { current: number; max: number; face: number };
  deathSaves: { success: number; failure: number };
  maxSpellSlots: number[];
  currentSpellSlots: number[];
  pactSlots?: { max: number; current: number; level: number };
  proficiencies: string[];
  sessionNotes: string;
  backstory: string;
  allies: string;
  ideals: string;
  bonds: string;
  flaws: string;
  appearance: string;
  avatarUrl?: string;
  hasInspiration?: boolean;
}

interface CharacterState {
  characters: Character[];
  activeCharacterId: string | null;
  activeTab: string;
  diceHistory: DiceRollResult[];
  currentRoll: DiceRollResult | null;
  rollMode: 'normal' | 'advantage' | 'disadvantage';
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  setRollMode: (mode: 'normal' | 'advantage' | 'disadvantage') => void;
  setActiveTab: (tab: string) => void;
  createCharacter: () => void;
  setActiveCharacter: (id: string) => void;
  updateActiveCharacter: (updates: Partial<Character>) => void;
  importCharacter: (characterData: Character) => void;
  updateAvatar: (base64String: string) => void;

  // Custom specific mutations
  addSpell: (spell: Spell) => void;
  removeSpell: (spellIndex: string) => void;
  addEquipment: (equipment: InventoryItem | Omit<InventoryItem, 'customId'>) => void;
  updateEquipmentQuantity: (customId: string, delta: number) => void;
  removeEquipment: (customId: string) => void;
  addFeature: (feature: CharacterFeature) => void;
  removeFeature: (featureId: string) => void;
  pinMonster: (monster: Monster) => void;
  unpinMonster: (monsterIndex: string) => void;

  // Combat Status Mutations
  shortRest: (hitDiceToSpend: number, constitutionMod: number) => void;
  longRest: () => void;
  consumeSpellSlot: (level: number, isPact?: boolean) => void;

  // Dice Actions
  addRoll: (roll: DiceRollResult) => void;
  clearCurrentRoll: () => void;
  clearDiceHistory: () => void;

  toggleProficiency: (proficiency: string) => void;
  getPassivePerception: () => number;
  toggleInspiration: () => void;
}

export const calculateModifier = (score: number) => Math.floor((score - 10) / 2);
export const calculateProficiency = (level: number) => Math.ceil(level / 4) + 1;
export const calculateSaveDC = (prof: number, mod: number) => 8 + prof + mod;

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      characters: [],
      activeCharacterId: null,
      activeTab: 'Stats',
      diceHistory: [],
      currentRoll: null,
      rollMode: 'normal',
      isWizardOpen: false,
      setIsWizardOpen: (open) => set({ isWizardOpen: open }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setRollMode: (mode) => set({ rollMode: mode }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      createCharacter: () => set((state) => {
        const newCharacter: Character = {
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          name: 'New Character',
          race: 'Human',
          className: 'Fighter',
          level: 1,
          abilityScores: {
            STR: 14, DEX: 12, CON: 14, INT: 10, WIS: 12, CHA: 8
          },
          knownSpells: [],
          inventory: [],
          monsters: [],
          features: [],
          currency: { cp: 0, sp: 0, gp: 0 },
          armorClass: 16,
          speed: 30,
          maxHp: 10,
          currentHp: 10,
          hitDice: { current: 1, max: 1, face: 10 },
          deathSaves: { success: 0, failure: 0 },
          maxSpellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          currentSpellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          proficiencies: ['Acrobatics', 'History', 'Investigation'],
          sessionNotes: '',
          backstory: '',
          allies: '',
          ideals: '',
          bonds: '',
          flaws: '',
          appearance: '',
          hasInspiration: false
        };
        return {
          characters: [...state.characters, newCharacter],
          activeCharacterId: newCharacter.id
        };
      }),

      setActiveCharacter: (id) => set({ activeCharacterId: id }),

      importCharacter: (characterData) => set((state) => {
        const exists = state.characters.find(c => c.id === characterData.id);
        if (exists) {
          return {
            characters: state.characters.map(c => c.id === characterData.id ? characterData : c),
            activeCharacterId: characterData.id
          };
        }
        return {
          characters: [...state.characters, characterData],
          activeCharacterId: characterData.id
        };
      }),

      updateAvatar: (base64String) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map(char =>
            char.id === state.activeCharacterId ? { ...char, avatarUrl: base64String } : char
          )
        };
      }),

      updateActiveCharacter: (updates) => set((state) => {
        if (!state.activeCharacterId) return state;

        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId) {
              let updatedChar = { ...char, ...updates };

              if (updates.abilityScores) {
                updatedChar.abilityScores = { ...char.abilityScores, ...updates.abilityScores };
              }
              if (updates.hitDice) {
                updatedChar.hitDice = { ...char.hitDice, ...updates.hitDice };
              }
              if (updates.deathSaves) {
                updatedChar.deathSaves = { ...(char.deathSaves || { success: 0, failure: 0 }), ...updates.deathSaves };
              }
              if (updates.currency) {
                updatedChar.currency = { ...(char.currency || { cp: 0, sp: 0, gp: 0 }), ...updates.currency };
              }

              if (updates.features) {
                updatedChar.features = updates.features;
              }

              if (updates.className || updates.level) {
                const className = updates.className || char.className;
                const level = updates.level || char.level;
                const progression = getClassProgression(className, level);
                updatedChar.maxSpellSlots = progression.maxSpellSlots;
                updatedChar.currentSpellSlots = [...progression.maxSpellSlots];
                updatedChar.pactSlots = progression.pactSlots ? { ...progression.pactSlots, current: progression.pactSlots.max } : undefined;
              }

              return updatedChar;
            }
            return char;
          })
        };
      }),

      addSpell: (spell) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId && !char.knownSpells.find(s => s.index === spell.index)) {
              return { ...char, knownSpells: [...char.knownSpells, spell] };
            }
            return char;
          })
        };
      }),

      removeSpell: (spellIndex) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId) {
              return { ...char, knownSpells: char.knownSpells.filter(s => s.index !== spellIndex) };
            }
            return char;
          })
        };
      }),

      addEquipment: (equipment) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId) {
              const existing = char.inventory.find(i => i.index === equipment.index);
              if (existing) {
                return {
                  ...char,
                  inventory: char.inventory.map(i => i.index === existing.index ? { ...i, quantity: Number(i.quantity) + Number(equipment.quantity) } : i)
                };
              }
              const newEquipment = {
                ...equipment,
                index: equipment.index,
                name: equipment.name,
                weight: equipment.weight || 0,
                desc: equipment.desc || [],
                customId: Math.random().toString(36).substring(7)
              } as InventoryItem;
              return {
                ...char,
                inventory: [...char.inventory, newEquipment]
              };
            }
            return char;
          })
        };
      }),

      updateEquipmentQuantity: (customId, delta) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId) {
              return {
                ...char,
                inventory: char.inventory.map(i => {
                  if (i.customId === customId) {
                    return { ...i, quantity: Math.max(0, i.quantity + delta) };
                  }
                  return i;
                }).filter(i => i.quantity > 0)
              };
            }
            return char;
          })
        };
      }),

      removeEquipment: (customId) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId) {
              return { ...char, inventory: char.inventory.filter(i => i.customId !== customId) };
            }
            return char;
          })
        };
      }),

      addFeature: (feature) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            const features = char.features || [];
            if (char.id === state.activeCharacterId && !features.find(f => f.index === feature.index && f.customId === feature.customId)) {
              return { ...char, features: [...features, feature] };
            }
            return char;
          })
        };
      }),

      removeFeature: (featureId) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            const features = char.features || [];
            if (char.id === state.activeCharacterId) {
              return { ...char, features: features.filter(f => f.customId !== featureId && f.index !== featureId) };
            }
            return char;
          })
        };
      }),

      pinMonster: (monster) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId && !char.monsters.find(m => m.index === monster.index)) {
              return { ...char, monsters: [...char.monsters, { ...monster, pinned: true }] };
            }
            return char;
          })
        };
      }),

      unpinMonster: (monsterIndex) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId) {
              return { ...char, monsters: char.monsters.filter(m => m.index !== monsterIndex) };
            }
            return char;
          })
        };
      }),

      shortRest: (hitDiceToSpend, conMod) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map(char => {
            if (char.id === state.activeCharacterId && char.hitDice.current >= hitDiceToSpend) {
              return {
                ...char,
                hitDice: { ...char.hitDice, current: char.hitDice.current - hitDiceToSpend },
                pactSlots: char.pactSlots ? { ...char.pactSlots, current: char.pactSlots.max } : undefined
              };
            }
            return char;
          })
        };
      }),

      longRest: () => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map(char => {
            if (char.id === state.activeCharacterId) {
              const restoreHd = Math.max(1, Math.floor(char.hitDice.max / 2));
              const newHdCurrent = Math.min(char.hitDice.max, char.hitDice.current + restoreHd);

              return {
                ...char,
                currentHp: char.maxHp,
                deathSaves: { success: 0, failure: 0 },
                currentSpellSlots: [...char.maxSpellSlots],
                pactSlots: char.pactSlots ? { ...char.pactSlots, current: char.pactSlots.max } : undefined,
                hitDice: { ...char.hitDice, current: newHdCurrent }
              };
            }
            return char;
          })
        };
      }),

      consumeSpellSlot: (level, isPact = false) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map(char => {
            if (char.id === state.activeCharacterId) {
              if (isPact && char.pactSlots && char.pactSlots.current > 0 && char.pactSlots.level === level) {
                return {
                  ...char,
                  pactSlots: { ...char.pactSlots, current: char.pactSlots.current - 1 }
                };
              } else if (!isPact && char.currentSpellSlots[level - 1] > 0) {
                const newSlots = [...char.currentSpellSlots];
                newSlots[level - 1] -= 1;
                return {
                  ...char,
                  currentSpellSlots: newSlots
                };
              }
            }
            return char;
          })
        };
      }),

      addRoll: (roll) => set((state) => ({
        currentRoll: roll,
        diceHistory: [roll, ...state.diceHistory].slice(0, 10)
      })),
      clearCurrentRoll: () => set({ currentRoll: null }),
      clearDiceHistory: () => set({ diceHistory: [] }),

      toggleProficiency: (proficiency) => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId) {
              const hasProf = char.proficiencies?.includes(proficiency);
              return {
                ...char,
                proficiencies: hasProf
                  ? char.proficiencies.filter(p => p !== proficiency)
                  : [...(char.proficiencies || []), proficiency]
              };
            }
            return char;
          })
        };
      }),

      toggleInspiration: () => set((state) => {
        if (!state.activeCharacterId) return state;
        return {
          characters: state.characters.map((char) => {
            if (char.id === state.activeCharacterId) {
              return { ...char, hasInspiration: !char.hasInspiration };
            }
            return char;
          })
        };
      }),

      getPassivePerception: () => {
        const state = get();
        const char = state.characters.find((c: Character) => c.id === state.activeCharacterId);
        if (!char) return 10;
        return 10 + calculateModifier(char.abilityScores.WIS);
      }
    }),
    {
      name: 'epic-dnd-storage',
      // We explicitly whitelist what we preserve in localStorage so activeTab doesn't reload where we left off, unless we want to
      partialize: (state) => ({ characters: state.characters, activeCharacterId: state.activeCharacterId, diceHistory: state.diceHistory }),
      storage: createJSONStorage(() => storageAdapter),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
