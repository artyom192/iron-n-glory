/**
 * Core type definitions for Iron & Glory
 */

export type CharacterClassId = 
  | 'warrior' 
  | 'berserker' 
  | 'rogue' 
  | 'archer' 
  | 'mage' 
  | 'knight';

export interface AttributeStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  attackSpeed: number; // attacks per second
  critChance: number;  // 0 - 1
  abilityPower: number; // multiplier e.g. 1.0 - 2.5
}

export interface CharacterClassDef {
  id: CharacterClassId;
  name: string;
  title: string;
  description: string;
  weaponName: string;
  weaponType: 'sword_shield' | 'greataxe' | 'daggers' | 'bow' | 'staff' | 'broadsword';
  baseStats: AttributeStats;
  ability: {
    id: string;
    name: string;
    description: string;
    cooldown: number; // in seconds
    damageMultiplier: number;
    icon: string;
  };
  visuals: {
    primaryColor: string;
    secondaryColor: string;
    capeColor?: string;
    skinColor: string;
    hairColor: string;
    helmetType: 'spartan' | 'horned' | 'hood' | 'hood_feather' | 'wizard_hat' | 'full_helm';
    weaponColor: string;
  };
}

export interface CharacterProgress {
  level: number;
  xp: number;
  attributePoints: number;
  upgrades: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    attackSpeed: number;
    abilityPower: number;
  };
  weaponLevel: number; // 1 to 5
}

export type ArenaId = 
  | 'courtyard' 
  | 'village' 
  | 'forest' 
  | 'colosseum' 
  | 'throne';

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'pillar' | 'barrel' | 'crate' | 'rock' | 'throne_pillar';
}

export interface ArenaDef {
  id: ArenaId;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  groundColor: string;
  borderColor: string;
  accentColor: string;
  obstacles: Obstacle[];
  decorations?: {
    type: 'banner' | 'torch' | 'leaf' | 'carpet';
    x: number;
    y: number;
  }[];
}

export interface CampaignStage {
  stageNumber: number;
  title: string;
  arenaId: ArenaId;
  enemyClass: CharacterClassId;
  enemyName: string;
  enemyLevel: number;
  aiDifficulty: 'easy' | 'normal' | 'hard';
  rewardXp: number;
  rewardGold: number;
  description: string;
}

export type GameMode = 'CAMPAIGN' | 'LOCAL_VS' | 'PRACTICE';
export type AppScreen = 
  | 'MAIN_MENU' 
  | 'CHARACTER_SELECT' 
  | 'CAMPAIGN_MAP' 
  | 'ARMORY' 
  | 'CHARACTER_UPGRADE' 
  | 'BATTLE';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  ability: boolean;
  dash: boolean;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  fontSize: number;
  opacity: number;
  life: number;
  maxLife: number;
}
