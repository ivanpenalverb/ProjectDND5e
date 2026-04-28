// utils/classProgression.ts

export interface ClassFeatures {
  cantripsKnown: number;
  spellsKnown?: number;
  maxSpellSlots: number[]; // Index 0 = Level 1 slots, Index 8 = Level 9 slots
  pactSlots?: { max: number; level: number };
}

const FULL_CASTER_SLOTS = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // Lvl 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // Lvl 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // Lvl 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // Lvl 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // Lvl 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // Lvl 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // Lvl 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // Lvl 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // Lvl 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // Lvl 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // Lvl 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // Lvl 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // Lvl 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // Lvl 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // Lvl 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // Lvl 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // Lvl 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // Lvl 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // Lvl 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // Lvl 20
];

const HALF_CASTER_SLOTS = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 5
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 7
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 8
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 9
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 10
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 11
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 12
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 13
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 14
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 15
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 16
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 17
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 18
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 19
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 20
];

const WARLOCK_PACT_SLOTS = [
  { level: 1, max: 1 }, // 1
  { level: 1, max: 2 }, // 2
  { level: 2, max: 2 }, // 3
  { level: 2, max: 2 }, // 4
  { level: 3, max: 2 }, // 5
  { level: 3, max: 2 }, // 6
  { level: 4, max: 2 }, // 7
  { level: 4, max: 2 }, // 8
  { level: 5, max: 2 }, // 9
  { level: 5, max: 2 }, // 10
  { level: 5, max: 3 }, // 11
  { level: 5, max: 3 }, // 12
  { level: 5, max: 3 }, // 13
  { level: 5, max: 3 }, // 14
  { level: 5, max: 3 }, // 15
  { level: 5, max: 3 }, // 16
  { level: 5, max: 4 }, // 17
  { level: 5, max: 4 }, // 18
  { level: 5, max: 4 }, // 19
  { level: 5, max: 4 }, // 20
]; // Mystic Arcanum is considered a class feature outside of pact magic

const ARTIFICER_SLOTS = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 5
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 7
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 8
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 9
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 10
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 11
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 12
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 13
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 14
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 15
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 16
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 17
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 18
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 19
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 20
];

const getCantrips = (className: string, level: number): number => {
  const isFull = ['Bard', 'Cleric', 'Druid', 'Wizard', 'Sorcerer', 'Warlock'].includes(className);
  const isArtificer = className === 'Artificer';
  if (!isFull && !isArtificer) return 0;

  if (className === 'Sorcerer') return level < 4 ? 4 : level < 10 ? 5 : 6;
  if (className === 'Bard' || className === 'Warlock' || className === 'Druid') return level < 4 ? 2 : level < 10 ? 3 : 4;
  if (className === 'Cleric' || className === 'Wizard') return level < 4 ? 3 : level < 10 ? 4 : 5;
  if (className === 'Artificer') return level < 10 ? 2 : level < 14 ? 3 : 4;
  
  return 0;
};

export const getClassProgression = (className: string, level: number): ClassFeatures => {
  const normLevel = Math.max(1, Math.min(20, level));
  const lvlIdx = normLevel - 1;
  const cName = className.trim().replace(/^([a-z])/, (m) => m.toUpperCase());

  const features: ClassFeatures = {
    cantripsKnown: getCantrips(cName, normLevel),
    maxSpellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  if (['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(cName)) {
    features.maxSpellSlots = FULL_CASTER_SLOTS[lvlIdx];
  } else if (['Paladin', 'Ranger'].includes(cName)) {
    features.maxSpellSlots = HALF_CASTER_SLOTS[lvlIdx];
  } else if (cName === 'Artificer') {
    features.maxSpellSlots = ARTIFICER_SLOTS[lvlIdx];
  } else if (cName === 'Warlock') {
    features.pactSlots = WARLOCK_PACT_SLOTS[lvlIdx];
  }

  return features;
};
