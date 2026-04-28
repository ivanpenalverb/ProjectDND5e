import { z } from 'zod';
import { Character } from '@/store/useCharacterStore';

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  race: z.string(),
  className: z.string(),
  level: z.number(),
  abilityScores: z.object({
    STR: z.number(), DEX: z.number(), CON: z.number(), INT: z.number(), WIS: z.number(), CHA: z.number()
  }),
  knownSpells: z.array(z.any()).optional().default([]),
  inventory: z.array(z.any()).optional().default([]),
  monsters: z.array(z.any()).optional().default([]),
  maxHp: z.number(),
  currentHp: z.number(),
  hitDice: z.object({ current: z.number(), max: z.number(), face: z.number() }),
  spellSlots: z.record(z.string().or(z.number()), z.object({ current: z.number(), max: z.number() })).optional().default({}),
  proficiencies: z.array(z.string()).optional().default([]),
  sessionNotes: z.string().optional().default(''),
  backstory: z.string().optional().default(''),
  allies: z.string().optional().default(''),
  ideals: z.string().optional().default(''),
  bonds: z.string().optional().default(''),
  flaws: z.string().optional().default(''),
  appearance: z.string().optional().default(''),
  avatarUrl: z.string().optional(),
}).passthrough();

export const exportCharacterToJSON = async (character: Character) => {
  const data = JSON.stringify(character, null, 2);
  const safeName = character.name.replace(/[^a-z0-9]/gi, '_');
  const filename = `${safeName}_${character.className}_Nivel${character.level}.json`;

  try {
    // Attempt to use the modern File System Access API
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'D&D Character JSON',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return;
    }
  } catch (error: any) {
    // If user cancelled the dialog (AbortError), just return silently.
    if (error.name === 'AbortError') {
      return;
    }
    console.warn("File System Access API failed or rejected, falling back to legacy download:", error);
  }

  // Fallback: Legacy <a> download approach
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const importCharacterFromJSON = (file: File): Promise<Character> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const validCharacter = CharacterSchema.parse(json);
        resolve(validCharacter as unknown as Character);
      } catch (error) {
        console.error("Invalid character file format:", error);
        reject(new Error("Invalid character file format."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
};
