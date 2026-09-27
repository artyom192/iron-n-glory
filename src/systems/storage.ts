import { CharacterClassId, CharacterProgress } from '../types/game';

const STORAGE_KEY = 'iron_and_glory_save_v1';

export interface GameSaveData {
  campaignStageUnlocked: number;
  gold: number;
  characters: Record<CharacterClassId, CharacterProgress>;
  soundEnabled: boolean;
}

const DEFAULT_CHARACTER_PROGRESS: CharacterProgress = {
  level: 1,
  xp: 0,
  attributePoints: 0,
  upgrades: {
    hp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    attackSpeed: 0,
    abilityPower: 0,
  },
  weaponLevel: 1,
};

const DEFAULT_SAVE: GameSaveData = {
  campaignStageUnlocked: 1,
  gold: 200,
  characters: {
    warrior: { ...DEFAULT_CHARACTER_PROGRESS },
    berserker: { ...DEFAULT_CHARACTER_PROGRESS },
    rogue: { ...DEFAULT_CHARACTER_PROGRESS },
    archer: { ...DEFAULT_CHARACTER_PROGRESS },
    mage: { ...DEFAULT_CHARACTER_PROGRESS },
    knight: { ...DEFAULT_CHARACTER_PROGRESS },
  },
  soundEnabled: true,
};

export class StorageManager {
  private static cachedData: GameSaveData | null = null;

  public static load(): GameSaveData {
    if (this.cachedData) return this.cachedData;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Merge with default to guarantee all keys exist
          const merged: GameSaveData = {
            ...DEFAULT_SAVE,
            ...parsed,
            characters: {
              ...DEFAULT_SAVE.characters,
              ...(parsed.characters || {}),
            },
          };
          this.cachedData = merged;
          return merged;
        }
      }
    } catch {
      // In case localStorage is blocked or throws
    }

    this.cachedData = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    return this.cachedData!;
  }

  public static save(data: GameSaveData): void {
    this.cachedData = data;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // Ignore write errors
    }
  }

  // Calculate XP required for next level
  public static getXpForNextLevel(currentLevel: number): number {
    return Math.floor(100 * Math.pow(1.35, currentLevel - 1));
  }

  // Add XP and handle level up
  public static addXp(classId: CharacterClassId, amount: number): { leveledUp: boolean; newLevel: number } {
    const data = this.load();
    const char = data.characters[classId] || { ...DEFAULT_CHARACTER_PROGRESS };
    char.xp += amount;

    let leveledUp = false;
    let needed = this.getXpForNextLevel(char.level);

    while (char.xp >= needed && char.level < 30) {
      char.xp -= needed;
      char.level += 1;
      char.attributePoints += 2; // 2 attribute points per level!
      leveledUp = true;
      needed = this.getXpForNextLevel(char.level);
    }

    data.characters[classId] = char;
    this.save(data);
    return { leveledUp, newLevel: char.level };
  }

  public static addGold(amount: number): number {
    const data = this.load();
    data.gold += amount;
    this.save(data);
    return data.gold;
  }

  public static unlockNextStage(stageCompleted: number): void {
    const data = this.load();
    if (stageCompleted >= data.campaignStageUnlocked && data.campaignStageUnlocked < 6) {
      data.campaignStageUnlocked = stageCompleted + 1;
      this.save(data);
    }
  }

  public static upgradeAttribute(
    classId: CharacterClassId,
    stat: 'hp' | 'attack' | 'defense' | 'speed' | 'attackSpeed' | 'abilityPower'
  ): boolean {
    const data = this.load();
    const char = data.characters[classId];
    if (!char || char.attributePoints <= 0) return false;

    // Stat caps to preserve balance
    if (stat === 'hp' && char.upgrades.hp >= 20) return false;
    if (stat === 'attack' && char.upgrades.attack >= 20) return false;
    if (stat === 'defense' && char.upgrades.defense >= 15) return false;
    if (stat === 'speed' && char.upgrades.speed >= 10) return false;
    if (stat === 'attackSpeed' && char.upgrades.attackSpeed >= 10) return false;
    if (stat === 'abilityPower' && char.upgrades.abilityPower >= 15) return false;

    char.attributePoints -= 1;
    char.upgrades[stat] += 1;
    this.save(data);
    return true;
  }

  public static upgradeWeapon(classId: CharacterClassId): boolean {
    const data = this.load();
    const char = data.characters[classId];
    if (!char || char.weaponLevel >= 5) return false;

    const costs = [0, 150, 300, 550, 900];
    const cost = costs[char.weaponLevel];

    if (data.gold < cost) return false;

    data.gold -= cost;
    char.weaponLevel += 1;
    this.save(data);
    return true;
  }
}
