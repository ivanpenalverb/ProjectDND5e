import { useCharacterStore } from '@/store/useCharacterStore';

export interface DiceRollResult {
  id: string;
  notation: string;
  diceName: string; // e.g., 'd20'
  rolls: number[];
  modifier: number;
  total: number;
  isCritical: boolean; // 20 natural on a d20
  isFumble: boolean; // 1 natural on a d20
  timestamp: number;
  source?: string; // e.g., 'STR Check', 'Longsword Attack'
}

export const rollDice = (notation: string, source?: string): DiceRollResult => {
  // Limpiamos espacios
  const cleanNotation = notation.replace(/\s/g, '');
  // Regex para parsear notaciones como '1d20+4', '2d6-1', '1d8'
  const regex = /^(\d+)d(\d+)(?:([+\-])(\d+))?$/i;
  const match = cleanNotation.match(regex);

  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  let count = parseInt(match[1], 10) || 1;
  const sides = parseInt(match[2], 10);
  const operator = match[3] || '+';
  const modValue = parseInt(match[4], 10) || 0;
  
  const modifier = operator === '-' ? -modValue : modValue;
  
  // Intercepción global de Estado:
  const rollMode = useCharacterStore.getState().rollMode;
  let isAdvDisadv = false;
  let finalSource = source;
  
  // Interceptamos tiradas de d20 
  if (sides === 20 && rollMode !== 'normal') {
     isAdvDisadv = true;
     count = 2; // Forzar a lanzar 2 dados
     if (rollMode === 'advantage') finalSource = finalSource ? `${finalSource} (Adv)` : 'Advantage D20';
     if (rollMode === 'disadvantage') finalSource = finalSource ? `${finalSource} (Disadv)` : 'Disadvantage D20';
  }

  const rolls: number[] = [];
  let sum = 0;
  
  for (let i = 0; i < count; i++) {
    // Generar número entre 1 y 'sides'
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    sum += roll;
  }
  
  let total = sum + modifier;
  
  // Lógica específica de D&D 5e: Solo aplica a tiradas de d20
  let isCritical = false;
  let isFumble = false;

  if (isAdvDisadv && rolls.length === 2) {
    const finalVal = rollMode === 'advantage' ? Math.max(rolls[0], rolls[1]) : Math.min(rolls[0], rolls[1]);
    total = finalVal + modifier;
    if (finalVal === 20) isCritical = true;
    if (finalVal === 1) isFumble = true;
  } else if (sides === 20 && count === 1) {
    if (rolls[0] === 20) isCritical = true;
    if (rolls[0] === 1) isFumble = true;
  }

  return {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    notation,
    diceName: `d${sides}`,
    rolls,
    modifier,
    total,
    isCritical,
    isFumble,
    timestamp: Date.now(),
    source: finalSource
  };
};
