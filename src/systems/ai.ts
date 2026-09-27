import { Fighter } from '../entities/Fighter';
import { InputState, Obstacle } from '../types/game';
import { Physics } from './physics';

export class FighterAI {
  private difficulty: 'easy' | 'normal' | 'hard';
  private decisionTimer: number = 0;
  private currentInput: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    ability: false,
    dash: false,
  };
  private retreatTimer: number = 0;

  constructor(difficulty: 'easy' | 'normal' | 'hard' = 'normal') {
    this.difficulty = difficulty;
  }

  public update(
    dt: number,
    bot: Fighter,
    target: Fighter,
    obstacles: Obstacle[]
  ): InputState {
    if (bot.isDead || target.isDead) {
      return {
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        ability: false,
        dash: false,
      };
    }

    this.decisionTimer -= dt;
    if (this.retreatTimer > 0) this.retreatTimer -= dt;

    // AI decision tick rate depends on difficulty:
    // Easy: reacts every 220ms
    // Normal: reacts every 110ms
    // Hard: reacts every 45ms (very responsive!)
    const tickInterval = this.difficulty === 'hard' ? 0.045 : this.difficulty === 'normal' ? 0.11 : 0.22;

    if (this.decisionTimer <= 0) {
      this.decisionTimer = tickInterval;
      this.makeDecision(bot, target, obstacles);
    }

    return this.currentInput;
  }

  private makeDecision(bot: Fighter, target: Fighter, obstacles: Obstacle[]): void {
    const dist = Physics.distance(bot, target);
    const hpRatio = bot.hp / bot.maxHp;

    const wt = bot.classDef.weaponType;
    const isRanged = wt === 'bow' || wt === 'staff';

    // Reset buttons
    this.currentInput.attack = false;
    this.currentInput.ability = false;
    this.currentInput.dash = false;

    // Low HP retreat behavior
    if (hpRatio < 0.25 && this.difficulty !== 'easy' && Math.random() < 0.4) {
      this.retreatTimer = 1.2;
    }

    // Determine target movement direction
    let targetX = target.x;
    let targetY = target.y;

    if (this.retreatTimer > 0) {
      // Run away from target
      const awayAngle = Physics.angle(target, bot);
      targetX = bot.x + Math.cos(awayAngle) * 300;
      targetY = bot.y + Math.sin(awayAngle) * 300;

      // Maybe dash away to save life!
      if (dist < 120 && Math.random() < 0.35 && bot.dashCooldown <= 0) {
        this.currentInput.dash = true;
      }
    } else if (isRanged) {
      // Ranged strategy (Archer / Mage): keep optimal kiting distance (~240-340px)
      const idealDist = 280;
      if (dist < idealDist - 60) {
        // Back up
        const awayAngle = Physics.angle(target, bot);
        targetX = bot.x + Math.cos(awayAngle) * 150;
        targetY = bot.y + Math.sin(awayAngle) * 150;

        if (dist < 90 && bot.dashCooldown <= 0 && this.difficulty !== 'easy') {
          this.currentInput.dash = true;
        }
      } else if (dist > idealDist + 90) {
        // Move closer
        targetX = target.x;
        targetY = target.y;
      } else {
        // Strafe around target
        const strafeAngle = Physics.angle(bot, target) + Math.PI / 2;
        targetX = bot.x + Math.cos(strafeAngle) * 80;
        targetY = bot.y + Math.sin(strafeAngle) * 80;
      }
    } else {
      // Melee strategy: advance toward target
      targetX = target.x;
      targetY = target.y;

      // Close gap with dash if far away
      if (dist > 180 && dist < 360 && bot.dashCooldown <= 0 && Math.random() < (this.difficulty === 'hard' ? 0.3 : 0.15)) {
        this.currentInput.dash = true;
      }
    }

    // Set movement inputs towards targetX, targetY
    const dx = targetX - bot.x;
    const dy = targetY - bot.y;
    const moveThreshold = 18;

    this.currentInput.left = dx < -moveThreshold;
    this.currentInput.right = dx > moveThreshold;
    this.currentInput.up = dy < -moveThreshold;
    this.currentInput.down = dy > moveThreshold;

    // Tactical combat attacks:
    const meleeRange = wt === 'greataxe' ? 65 : wt === 'broadsword' ? 58 : 48;

    if (isRanged) {
      // Ranged can shoot from afar if line of sight is roughly clear
      if (dist < 460) {
        const attackChance = this.difficulty === 'hard' ? 0.85 : this.difficulty === 'normal' ? 0.65 : 0.45;
        if (Math.random() < attackChance) {
          this.currentInput.attack = true;
        }
      }

      // Use ability (Power Shot or Fireball)
      if (bot.abilityCooldown <= 0 && dist < 420 && Math.random() < 0.4) {
        this.currentInput.ability = true;
      }
    } else {
      // Melee attack when in weapon range
      if (dist <= meleeRange + 15) {
        const attackChance = this.difficulty === 'hard' ? 0.95 : this.difficulty === 'normal' ? 0.75 : 0.55;
        if (Math.random() < attackChance) {
          this.currentInput.attack = true;
        }
      }

      // Use melee ability
      if (bot.abilityCooldown <= 0) {
        const abilityRange = bot.classDef.ability.id === 'shield_bash' || bot.classDef.ability.id === 'dash_attack' ? 140 : 70;
        if (dist <= abilityRange && Math.random() < 0.6) {
          this.currentInput.ability = true;
        }
      }

      // Reactive dodge: if enemy is attacking and bot is close, dodge!
      if (target.isAttacking && dist < 70 && bot.dashCooldown <= 0 && this.difficulty === 'hard' && Math.random() < 0.45) {
        this.currentInput.dash = true;
      }
    }
  }
}
