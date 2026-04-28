import { z } from 'zod';

// --- ZOD SCHEMAS ---

export const SpellSchema = z.object({
  index: z.string(),
  name: z.string(),
  level: z.number(),
  desc: z.array(z.string()).optional().default([]),
  higher_level: z.array(z.string()).optional(),
  range: z.string().optional(),
  components: z.array(z.string()).optional(),
  material: z.string().optional(),
  ritual: z.boolean().optional(),
  duration: z.string().optional(),
  concentration: z.boolean().optional(),
  casting_time: z.string().optional(),
  school: z.object({ name: z.string() }).optional(),
  classes: z.array(z.object({ name: z.string() })).optional().default([]),
}).passthrough();

export type Spell = z.infer<typeof SpellSchema>;

export const EquipmentSchema = z.object({
  index: z.string().optional().default('homebrew'),
  name: z.string(),
  equipment_category: z.object({ name: z.string() }).optional(),
  weight: z.number().optional().default(0),
  cost: z.object({ quantity: z.number(), unit: z.string() }).optional(),
  desc: z.array(z.string()).optional().default([]),
}).passthrough();

export type Equipment = z.infer<typeof EquipmentSchema>;
export type InventoryItem = Equipment & { quantity: number; customId: string };

export const MonsterSchema = z.object({
  index: z.string(),
  name: z.string(),
  size: z.string().optional(),
  type: z.string().optional(),
  alignment: z.string().optional(),
  armor_class: z.array(z.any()).optional().default([]),
  hit_points: z.number().optional().default(0),
  speed: z.any().optional(),
  strength: z.number().optional(),
  dexterity: z.number().optional(),
  constitution: z.number().optional(),
  intelligence: z.number().optional(),
  wisdom: z.number().optional(),
  charisma: z.number().optional(),
  actions: z.array(z.any()).optional().default([]),
  special_abilities: z.array(z.any()).optional().default([]),
}).passthrough();

export type Monster = z.infer<typeof MonsterSchema>;

export const FeatureSchema = z.object({
  index: z.string(),
  name: z.string(),
  level: z.number().optional(),
  desc: z.array(z.string()).optional().default([]),
  class: z.object({ name: z.string() }).optional(),
}).passthrough();

export type Feature = z.infer<typeof FeatureSchema>;

export const TraitSchema = z.object({
  index: z.string(),
  name: z.string(),
  desc: z.array(z.string()).optional().default([]),
  races: z.array(z.object({ name: z.string() })).optional(),
}).passthrough();

export type Trait = z.infer<typeof TraitSchema>;

// --- CACHE & DATA SERVICE ---

let spellsCache: Record<string, Spell[]> = {};
let equipmentCache: Record<string, Equipment[]> = {};
let monstersCache: Record<string, Monster[]> = {};
let featuresCache: Record<string, Feature[]> = {};
let traitsCache: Record<string, Trait[]> = {};

let spellsPromise: Record<string, Promise<Spell[]>> = {};
let equipmentPromise: Record<string, Promise<Equipment[]>> = {};
let monstersPromise: Record<string, Promise<Monster[]>> = {};
let featuresPromise: Record<string, Promise<Feature[]>> = {};
let traitsPromise: Record<string, Promise<Trait[]>> = {};

export const dataService = {
  getSpells: (lang: string = 'en'): Promise<Spell[]> => {
    if (spellsCache[lang]) return Promise.resolve(spellsCache[lang]);
    if (!spellsPromise[lang]) {
      spellsPromise[lang] = (async () => {
        let data;
        try {
          const res = await fetch(`/data/${lang}/5e-SRD-Spells.json`);
          if (!res.ok) throw new Error('Not found');
          data = await res.json();
        } catch (e) {
          console.warn(`[SRD] Missing ${lang} spells, falling back to English default.`);
          const fallbackRes = await fetch(`/2014/5e-SRD-Spells.json`);
          data = await fallbackRes.json();
        }
        spellsCache[lang] = z.array(SpellSchema).parse(data);
        return spellsCache[lang];
      })();
    }
    return spellsPromise[lang];
  },

  getEquipment: (lang: string = 'en'): Promise<Equipment[]> => {
    if (equipmentCache[lang]) return Promise.resolve(equipmentCache[lang]);
    if (!equipmentPromise[lang]) {
      equipmentPromise[lang] = (async () => {
        let data;
        try {
          const res = await fetch(`/data/${lang}/5e-SRD-Equipment.json`);
          if (!res.ok) throw new Error('Not found');
          data = await res.json();
        } catch (e) {
          console.warn(`[SRD] Missing ${lang} equipment, falling back to English default.`);
          const fallbackRes = await fetch(`/2014/5e-SRD-Equipment.json`);
          data = await fallbackRes.json();
        }
        equipmentCache[lang] = z.array(EquipmentSchema).parse(data);
        return equipmentCache[lang];
      })();
    }
    return equipmentPromise[lang];
  },

  getMonsters: (lang: string = 'en'): Promise<Monster[]> => {
    if (monstersCache[lang]) return Promise.resolve(monstersCache[lang]);
    if (!monstersPromise[lang]) {
      monstersPromise[lang] = (async () => {
        let data;
        try {
          const res = await fetch(`/data/${lang}/5e-SRD-Monsters.json`);
          if (!res.ok) throw new Error('Not found');
          data = await res.json();
        } catch (e) {
          console.warn(`[SRD] Missing ${lang} monsters, falling back to English default.`);
          const fallbackRes = await fetch(`/2014/5e-SRD-Monsters.json`);
          data = await fallbackRes.json();
        }
        monstersCache[lang] = z.array(MonsterSchema).parse(data);
        return monstersCache[lang];
      })();
    }
    return monstersPromise[lang];
  },

  getFeatures: (lang: string = 'en'): Promise<Feature[]> => {
    if (featuresCache[lang]) return Promise.resolve(featuresCache[lang]);
    if (!featuresPromise[lang]) {
      featuresPromise[lang] = (async () => {
        let data;
        try {
          const res = await fetch(`/data/${lang}/5e-SRD-Features.json`);
          if (!res.ok) throw new Error('Not found');
          data = await res.json();
        } catch (e) {
          const fallbackRes = await fetch(`/2014/5e-SRD-Features.json`);
          data = await fallbackRes.json();
        }
        featuresCache[lang] = z.array(FeatureSchema).parse(data);
        return featuresCache[lang];
      })();
    }
    return featuresPromise[lang];
  },

  getTraits: (lang: string = 'en'): Promise<Trait[]> => {
    if (traitsCache[lang]) return Promise.resolve(traitsCache[lang]);
    if (!traitsPromise[lang]) {
      traitsPromise[lang] = (async () => {
        let data;
        try {
          const res = await fetch(`/data/${lang}/5e-SRD-Traits.json`);
          if (!res.ok) throw new Error('Not found');
          data = await res.json();
        } catch (e) {
          const fallbackRes = await fetch(`/2014/5e-SRD-Traits.json`);
          data = await fallbackRes.json();
        }
        traitsCache[lang] = z.array(TraitSchema).parse(data);
        return traitsCache[lang];
      })();
    }
    return traitsPromise[lang];
  }
};
