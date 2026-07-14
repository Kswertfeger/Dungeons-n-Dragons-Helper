export type StatKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export const STAT_KEYS: StatKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export const STAT_LABELS: Record<StatKey, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

export type RaceData = {
  name: string;
  abilityBonuses: Partial<Record<StatKey, number>>;
  description: string;
};

export const RACES: RaceData[] = [
  {
    name: 'Human',
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    description: 'Versatile and ambitious, humans gain +1 to all ability scores.',
  },
  {
    name: 'Elf',
    abilityBonuses: { dexterity: 2 },
    description: 'Graceful and perceptive, elves have keen senses and a natural agility.',
  },
  {
    name: 'Dwarf',
    abilityBonuses: { constitution: 2 },
    description: 'Stout and resilient, dwarves are known for their toughness and craftsmanship.',
  },
  {
    name: 'Halfling',
    abilityBonuses: { dexterity: 2 },
    description: 'Small but nimble, halflings are lucky and surprisingly brave.',
  },
  {
    name: 'Gnome',
    abilityBonuses: { intelligence: 2 },
    description: 'Curious and inventive, gnomes have a natural knack for magic and tinkering.',
  },
  {
    name: 'Half-Elf',
    abilityBonuses: { charisma: 2, strength: 1, dexterity: 1 },
    description: 'Blending human ambition and elven grace, half-elves are natural diplomats.',
  },
  {
    name: 'Half-Orc',
    abilityBonuses: { strength: 2, constitution: 1 },
    description: 'Fierce and enduring, half-orcs are formidable warriors with relentless stamina.',
  },
  {
    name: 'Tiefling',
    abilityBonuses: { intelligence: 1, charisma: 2 },
    description: 'Bearing infernal heritage, tieflings are cunning and charismatic.',
  },
  {
    name: 'Dragonborn',
    abilityBonuses: { strength: 2, charisma: 1 },
    description: 'Proud dragon-descended warriors with a natural breath weapon.',
  },
  {
    name: 'Aasimar',
    abilityBonuses: { wisdom: 1, charisma: 2 },
    description: 'Touched by celestial power, aasimar are radiant and divinely gifted.',
  },
  {
    name: 'Tabaxi',
    abilityBonuses: { dexterity: 2, charisma: 1 },
    description: 'Cat-like and curious, tabaxi are swift and enigmatic wanderers.',
  },
];

export type ClassData = {
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
};

export const CLASSES: ClassData[] = [
  { name: 'Barbarian', hitDie: 12, primaryAbility: 'Strength', savingThrows: ['STR', 'CON'] },
  { name: 'Fighter', hitDie: 10, primaryAbility: 'Strength or Dexterity', savingThrows: ['STR', 'CON'] },
  { name: 'Paladin', hitDie: 10, primaryAbility: 'Strength & Charisma', savingThrows: ['WIS', 'CHA'] },
  { name: 'Ranger', hitDie: 10, primaryAbility: 'Dexterity & Wisdom', savingThrows: ['STR', 'DEX'] },
  { name: 'Bard', hitDie: 8, primaryAbility: 'Charisma', savingThrows: ['DEX', 'CHA'] },
  { name: 'Cleric', hitDie: 8, primaryAbility: 'Wisdom', savingThrows: ['WIS', 'CHA'] },
  { name: 'Druid', hitDie: 8, primaryAbility: 'Wisdom', savingThrows: ['INT', 'WIS'] },
  { name: 'Monk', hitDie: 8, primaryAbility: 'Dexterity & Wisdom', savingThrows: ['STR', 'DEX'] },
  { name: 'Rogue', hitDie: 8, primaryAbility: 'Dexterity', savingThrows: ['DEX', 'INT'] },
  { name: 'Warlock', hitDie: 8, primaryAbility: 'Charisma', savingThrows: ['WIS', 'CHA'] },
  { name: 'Sorcerer', hitDie: 6, primaryAbility: 'Charisma', savingThrows: ['CON', 'CHA'] },
  { name: 'Wizard', hitDie: 6, primaryAbility: 'Intelligence', savingThrows: ['INT', 'WIS'] },
];

export type BackgroundData = {
  name: string;
  skillProficiencies: string[];
};

export const BACKGROUNDS: BackgroundData[] = [
  { name: 'Acolyte', skillProficiencies: ['Insight', 'Religion'] },
  { name: 'Charlatan', skillProficiencies: ['Deception', 'Sleight of Hand'] },
  { name: 'Criminal', skillProficiencies: ['Deception', 'Stealth'] },
  { name: 'Entertainer', skillProficiencies: ['Acrobatics', 'Performance'] },
  { name: 'Folk Hero', skillProficiencies: ['Animal Handling', 'Survival'] },
  { name: 'Guild Artisan', skillProficiencies: ['Insight', 'Persuasion'] },
  { name: 'Hermit', skillProficiencies: ['Medicine', 'Religion'] },
  { name: 'Noble', skillProficiencies: ['History', 'Persuasion'] },
  { name: 'Outlander', skillProficiencies: ['Athletics', 'Survival'] },
  { name: 'Sage', skillProficiencies: ['Arcana', 'History'] },
  { name: 'Sailor', skillProficiencies: ['Athletics', 'Perception'] },
  { name: 'Soldier', skillProficiencies: ['Athletics', 'Intimidation'] },
  { name: 'Urchin', skillProficiencies: ['Sleight of Hand', 'Stealth'] },
];

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
