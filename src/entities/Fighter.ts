import { CharacterClassDef, CharacterProgress, InputState } from '../types/game';
import { soundEngine } from '../systems/audio';
import { ParticleSystem } from '../systems/particles';
import { Projectile } from './Projectile';

export interface FighterConfig {
  id: string; // 'p1' | 'p2' | 'bot'
  name: string;
  classDef: CharacterClassDef;
  progress?: CharacterProgress;
  x: number;
  y: number;
  facing: 1 | -1; // 1 = right, -1 = left
  isBot?: boolean;
}

export class Fighter {
  public id: string;
  public name: string;
  public classDef: CharacterClassDef;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number = 22;
  public facing: 1 | -1 = 1;
  public isBot: boolean = false;

  // Computed Combat Attributes
  public maxHp: number;
  public hp: number;
  public attack: number;
  public defense: number;
  public speed: number;
  public attackSpeed: number;
  public critChance: number;
  public abilityPower: number;
  public weaponLevel: number = 1;

  // Action States & Timers
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public dashCooldown: number = 0;
  public dashDuration: number = 0.22;
  public dashCooldownMax: number = 1.4;

  public isAttacking: boolean = false;
  public attackTimer: number = 0;
  public attackDuration: number = 0.35;
  public attackCooldown: number = 0;
  public attackHasHit: boolean = false;

  public isAbilityActive: boolean = false;
  public abilityTimer: number = 0;
  public abilityDuration: number = 0.45;
  public abilityCooldown: number = 0;
  public abilityMaxCooldown: number = 6.0;

  public stunTimer: number = 0;
  public isStunned: boolean = false;

  public hurtTimer: number = 0;
  public isDead: boolean = false;
  public deathTimer: number = 0;

  // Animation accumulators (for juicy bouncing / GladiHoppers limb articulation)
  public walkAnim: number = 0;
  public swingProgress: number = 0; // 0 to 1 during swing
  public lastMoveDir: { x: number; y: number } = { x: 1, y: 0 };

  constructor(config: FighterConfig) {
    this.id = config.id;
    this.name = config.name;
    this.classDef = config.classDef;
    this.x = config.x;
    this.y = config.y;
    this.facing = config.facing;
    this.isBot = !!config.isBot;

    // Apply progression & weapon upgrades
    const base = config.classDef.baseStats;
    const prog = config.progress || {
      level: 1,
      xp: 0,
      attributePoints: 0,
      upgrades: { hp: 0, attack: 0, defense: 0, speed: 0, attackSpeed: 0, abilityPower: 0 },
      weaponLevel: 1,
    };

    this.weaponLevel = prog.weaponLevel || 1;
    const wBonus = (this.weaponLevel - 1) * 0.15; // 15% weapon boost per level

    this.maxHp = Math.round((base.maxHp + prog.upgrades.hp * 18) * (1 + (prog.weaponLevel - 1) * 0.05));
    this.hp = this.maxHp;
    this.attack = Math.round((base.attack + prog.upgrades.attack * 4) * (1 + wBonus));
    this.defense = Math.round(base.defense + prog.upgrades.defense * 2.5);
    this.speed = Math.round(base.speed + prog.upgrades.speed * 8);
    this.attackSpeed = Number((base.attackSpeed + prog.upgrades.attackSpeed * 0.08 + (prog.weaponLevel - 1) * 0.05).toFixed(2));
    this.critChance = Math.min(0.75, Number((base.critChance + prog.upgrades.attack * 0.01).toFixed(2)));
    this.abilityPower = Number((base.abilityPower + prog.upgrades.abilityPower * 0.12).toFixed(2));

    this.abilityMaxCooldown = config.classDef.ability.cooldown;
    this.attackDuration = Math.max(0.18, 0.45 / this.attackSpeed);
  }

  // Handle inputs
  public handleInput(input: InputState, targetX?: number, targetY?: number): { attackTriggered?: boolean; abilityTriggered?: boolean; dashTriggered?: boolean } {
    if (this.isDead || this.isStunned) return {};

    const res: { attackTriggered?: boolean; abilityTriggered?: boolean; dashTriggered?: boolean } = {};

    // Directional movement
    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;

    if (mx !== 0 || my !== 0) {
      // Normalize
      const len = Math.sqrt(mx * mx + my * my);
      const nx = mx / len;
      const ny = my / len;

      this.lastMoveDir = { x: nx, y: ny };

      if (!this.isDashing) {
        this.vx = nx * this.speed;
        this.vy = ny * this.speed;
        if (mx !== 0) {
          this.facing = mx > 0 ? 1 : -1;
        }
      }
    } else if (!this.isDashing) {
      // Friction
      this.vx *= 0.75;
      this.vy *= 0.75;
      if (Math.abs(this.vx) < 5) this.vx = 0;
      if (Math.abs(this.vy) < 5) this.vy = 0;
    }

    // Aim facing at enemy/target if provided
    if (targetX !== undefined) {
      this.facing = targetX > this.x ? 1 : -1;
    }

    // Dash
    if (input.dash && this.dashCooldown <= 0 && !this.isDashing) {
      this.startDash();
      res.dashTriggered = true;
    }

    // Ability
    if (input.ability && this.abilityCooldown <= 0 && !this.isAttacking && !this.isAbilityActive) {
      this.startAbility();
      res.abilityTriggered = true;
    }

    // Attack
    if (input.attack && this.attackCooldown <= 0 && !this.isAttacking && !this.isAbilityActive) {
      this.startAttack();
      res.attackTriggered = true;
    }

    return res;
  }

  public startDash(): void {
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldown = this.dashCooldownMax;
    const dashSpeed = this.speed * 2.8;
    this.vx = this.lastMoveDir.x * dashSpeed;
    this.vy = this.lastMoveDir.y * dashSpeed;
    soundEngine.playDash();
  }

  public startAttack(): void {
    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.attackCooldown = 1 / this.attackSpeed;
    this.attackHasHit = false;

    if (this.classDef.weaponType === 'bow') {
      soundEngine.playBowShoot();
    } else if (this.classDef.weaponType === 'staff') {
      soundEngine.playMagicCast();
    } else {
      soundEngine.playSwing();
    }
  }

  public startAbility(): void {
    this.isAbilityActive = true;
    this.abilityTimer = this.abilityDuration;
    this.abilityCooldown = this.abilityMaxCooldown;
    soundEngine.playAbility();

    if (this.classDef.ability.id === 'shield_bash') {
      // Dash forward with shield
      this.vx = this.facing * this.speed * 2.2;
    } else if (this.classDef.ability.id === 'dash_attack') {
      this.vx = this.facing * this.speed * 3.2;
    } else if (this.classDef.ability.id === 'fireball') {
      soundEngine.playMagicCast();
    }
  }

  public update(dt: number, particles: ParticleSystem): void {
    if (this.isDead) {
      this.deathTimer += dt;
      return;
    }

    // Hurt timer & Stun timer
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.isStunned = false;
    }

    // Cooldown timers
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.abilityCooldown > 0) this.abilityCooldown -= dt;

    // Dash update
    if (this.isDashing) {
      this.dashTimer -= dt;
      particles.spawnDust(this.x, this.y + this.radius, 1);
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    // Attack timer
    if (this.isAttacking) {
      this.attackTimer -= dt;
      this.swingProgress = 1 - Math.max(0, this.attackTimer / this.attackDuration);
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.swingProgress = 0;
      }
    }

    // Ability timer
    if (this.isAbilityActive) {
      this.abilityTimer -= dt;
      if (this.abilityTimer <= 0) {
        this.isAbilityActive = false;
      }
    }

    // Walk animation accumulator
    const speedMagnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speedMagnitude > 20) {
      this.walkAnim += dt * 14;
      if (Math.sin(this.walkAnim) > 0.95) {
        particles.spawnDust(this.x, this.y + this.radius, 1);
      }
    } else {
      this.walkAnim = 0;
    }

    // Apply movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  public takeDamage(
    rawDamage: number,
    isCrit: boolean = false,
    attackerX: number = 0,
    particles?: ParticleSystem,
    isAbility: boolean = false
  ): number {
    if (this.isDead) return 0;
    if (this.isDashing) return 0; // Invulnerable during dash!

    // Defense reduction formula
    const effectiveDef = this.defense;
    const mitigation = effectiveDef / (effectiveDef + 60); // 0 to ~0.45
    let actualDamage = Math.max(4, Math.round(rawDamage * (1 - mitigation)));

    // Shield block chance for warrior
    if (this.classDef.weaponType === 'sword_shield' && Math.random() < 0.22 && !this.isAttacking) {
      actualDamage = Math.round(actualDamage * 0.35);
      soundEngine.playBlock();
      if (particles) {
        particles.spawnSparks(this.x, this.y, 10, '#94a3b8');
        particles.addDamageText(this.x, this.y, actualDamage, false, false);
      }
    } else {
      soundEngine.playHit(isCrit);
    }

    this.hp -= actualDamage;
    this.hurtTimer = 0.16;

    // Knockback
    const kbAngle = Math.atan2(this.y - attackerX, this.x - attackerX);
    const kbForce = isCrit ? 220 : 130;
    this.vx += Math.cos(kbAngle) * kbForce;
    this.vy += Math.sin(kbAngle) * kbForce;

    if (particles) {
      particles.spawnBlood(this.x, this.y, kbAngle, isCrit ? 16 : 8);
      particles.spawnSparks(this.x, this.y, 6, isCrit ? '#facc15' : '#fef08a');
      particles.triggerScreenShake(isCrit ? 10 : 5, 0.22);
      particles.addDamageText(this.x, this.y, actualDamage, isCrit, isAbility);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }

    return actualDamage;
  }

  public stun(duration: number): void {
    this.isStunned = true;
    this.stunTimer = duration;
    this.vx = 0;
    this.vy = 0;
  }

  // Draw character in GladiHoppers articulated bobbing 2D cartoon fighting style
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Hit reaction flash / shake
    if (this.hurtTimer > 0) {
      const hurtFlash = Math.sin(this.hurtTimer * 40) * 4;
      ctx.translate(hurtFlash, 0);
    }

    // Death animation: collapse or fade
    if (this.isDead) {
      const rot = Math.min(Math.PI / 2, this.deathTimer * 4);
      ctx.rotate(this.facing === 1 ? rot : -rot);
      ctx.globalAlpha = Math.max(0.3, 1 - this.deathTimer * 0.6);
    }

    // Ground Shadow (GladiHoppers oval)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius + 4, this.radius * 0.9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body bobbing (bouncy walk or breathing)
    const bobY = Math.abs(Math.sin(this.walkAnim)) * -4;
    ctx.translate(0, bobY);

    const f = this.facing; // 1 or -1
    const v = this.classDef.visuals;

    // 1. Cape (behind body)
    if (v.capeColor) {
      ctx.save();
      const capeWave = Math.sin(this.walkAnim + 1) * 6 * f;
      ctx.fillStyle = v.capeColor;
      ctx.beginPath();
      ctx.moveTo(-6 * f, -8);
      ctx.lineTo(-14 * f + capeWave, 18);
      ctx.lineTo(2 * f, 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Animated Legs (GladiHoppers chunky hopping boots)
    const legOffset1 = Math.sin(this.walkAnim) * 7;
    const legOffset2 = -Math.sin(this.walkAnim) * 7;

    ctx.fillStyle = '#44403c'; // Dark leather boots
    // Left Leg
    ctx.fillRect(-8, 12 + legOffset1, 6, 10);
    // Right Leg
    ctx.fillRect(2, 12 + legOffset2, 6, 10);

    // 3. Torso / Armor / Tunic
    ctx.fillStyle = v.primaryColor;
    ctx.beginPath();
    // Round chest shape
    ctx.roundRect(-12, -10, 24, 22, [6, 6, 3, 3]);
    ctx.fill();

    // Armor trim / belt
    ctx.fillStyle = v.secondaryColor;
    ctx.fillRect(-12, 4, 24, 4); // Belt
    ctx.fillStyle = '#f59e0b'; // Belt buckle
    ctx.fillRect(-3, 4, 6, 4);

    // Chest emblem / plate highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -8, 16, 10);

    // 4. Back Arm / Shield / Offhand
    if (this.classDef.weaponType === 'sword_shield') {
      // Wooden/Steel Shield held in offhand
      ctx.save();
      ctx.translate(-10 * f, 0);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Shield boss
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.classDef.weaponType === 'daggers') {
      // Offhand dagger
      ctx.save();
      ctx.translate(-8 * f, 4);
      ctx.rotate(-0.4 * f);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, -2, 12 * f, 4);
      ctx.restore();
    }

    // 5. Head & Distinctive Helmet/Hat
    ctx.save();
    const headTilt = (this.vx / this.speed) * 0.15;
    ctx.translate(0, -18);
    ctx.rotate(headTilt);

    // Head base (skin)
    ctx.fillStyle = v.skinColor;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Expressive eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(5 * f, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Eye white glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5.5 * f, -1.8, 1, 0, Math.PI * 2);
    ctx.fill();

    // Stun stars overhead
    if (this.isStunned) {
      ctx.fillStyle = '#facc15';
      const starRot = Date.now() * 0.008;
      for (let i = 0; i < 3; i++) {
        const sa = starRot + (i * Math.PI * 2) / 3;
        ctx.fillRect(Math.cos(sa) * 14 - 2, -18 + Math.sin(sa) * 4, 4, 4);
      }
    }

    // Class Helmet / Headgear Render
    this.drawHelmet(ctx, v.helmetType, f, v.secondaryColor, v.hairColor);

    ctx.restore();

    // 6. Main Arm & Weapon Swing
    this.drawMainHandAndWeapon(ctx, f, v);

    // Subtle mini HP bar above head during combat
    this.drawOverheadBar(ctx);

    ctx.restore();
  }

  // Draw helmet based on class
  private drawHelmet(
    ctx: CanvasRenderingContext2D,
    type: string,
    f: number,
    helmColor: string,
    hairColor: string
  ): void {
    if (type === 'spartan') {
      // Crest and cheek guard
      ctx.fillStyle = '#94a3b8'; // Iron cap
      ctx.beginPath();
      ctx.arc(0, -2, 11.5, Math.PI, 0);
      ctx.fill();
      // Red Spartan mohawk crest
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.rect(-8, -17, 16, 6);
      ctx.fill();
    } else if (type === 'horned') {
      // Viking iron helm with big horns
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, -1, 11.5, Math.PI, 0);
      ctx.fill();
      // Horns
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(8 * f, -6);
      ctx.lineTo(16 * f, -16);
      ctx.lineTo(9 * f, -12);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'hood') {
      // Rogue cowl / dark hood
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(0, -2, 12.5, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
    } else if (type === 'hood_feather') {
      // Archer green cap with golden feather
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -2, 12, Math.PI, 0);
      ctx.fill();
      // Feather
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-4 * f, -8);
      ctx.lineTo(-12 * f, -20);
      ctx.lineTo(-6 * f, -14);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'wizard_hat') {
      // Pointy wizard hat
      ctx.fillStyle = '#6d28d9';
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(14, -6);
      ctx.lineTo(0, -26);
      ctx.closePath();
      ctx.fill();
      // Gold hat band
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-10, -8, 20, 3);
    } else if (type === 'full_helm') {
      // Full plate knight visored helm
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      // Eye visor slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(1 * f, -2, 8 * f, 3);
      // Golden helm crown
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-4, -13, 8, 3);
    }
  }

  // Draw main hand and weapon with animated slash arcs
  private drawMainHandAndWeapon(
    ctx: CanvasRenderingContext2D,
    f: number,
    v: CharacterClassDef['visuals']
  ): void {
    ctx.save();
    ctx.translate(6 * f, 2);

    // Calculate weapon rotation based on swing progress
    let weaponAngle = 0;
    if (this.isAttacking) {
      // Swing arc: from -60 deg to +80 deg
      const startAngle = -Math.PI * 0.4;
      const endAngle = Math.PI * 0.55;
      weaponAngle = startAngle + (endAngle - startAngle) * this.swingProgress;
    } else if (this.isAbilityActive && this.classDef.ability.id === 'whirlwind') {
      // Knight Whirlwind 360 spin!
      weaponAngle = (1 - this.abilityTimer / this.abilityDuration) * Math.PI * 4;
    } else {
      // Idle slight weapon sway
      weaponAngle = Math.sin(this.walkAnim || Date.now() * 0.003) * 0.15;
    }

    ctx.rotate(weaponAngle * f);

    // Draw weapon based on type
    const wt = this.classDef.weaponType;

    if (wt === 'sword_shield' || wt === 'broadsword') {
      const isBroad = wt === 'broadsword';
      const bladeLen = isBroad ? 36 : 28;
      const bladeWidth = isBroad ? 7 : 5;

      // Handle & Hilt
      ctx.fillStyle = '#78350f'; // Grip
      ctx.fillRect(-2, 0, 4, 8);
      ctx.fillStyle = '#f59e0b'; // Gold crossguard
      ctx.fillRect(-8, 0, 16, 3);

      // Blade
      ctx.fillStyle = v.weaponColor;
      ctx.beginPath();
      ctx.moveTo(-bladeWidth / 2, 0);
      ctx.lineTo(-bladeWidth / 2, -bladeLen);
      ctx.lineTo(0, -bladeLen - 6);
      ctx.lineTo(bladeWidth / 2, -bladeLen);
      ctx.lineTo(bladeWidth / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Sharp blade center ridge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -bladeLen - 4);
      ctx.stroke();

      // Weapon Upgrade Glow (Levels 2 - 5)
      if (this.weaponLevel >= 2) {
        ctx.strokeStyle = this.weaponLevel >= 4 ? 'rgba(234, 179, 8, 0.7)' : 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = this.weaponLevel >= 4 ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -bladeLen - 4);
        ctx.stroke();
      }
    } else if (wt === 'greataxe') {
      const shaftLen = 42;
      // Sturdy wooden shaft
      ctx.fillStyle = '#573312';
      ctx.fillRect(-2.5, -shaftLen, 5, shaftLen + 6);

      // Massive double-headed axe blade
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      // Left crescent blade
      ctx.arc(-10, -shaftLen + 10, 14, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.lineTo(-2, -shaftLen + 10);
      ctx.closePath();
      ctx.fill();
      // Right crescent blade
      ctx.beginPath();
      ctx.arc(10, -shaftLen + 10, 14, Math.PI * 0.5, Math.PI * 1.5);
      ctx.lineTo(2, -shaftLen + 10);
      ctx.closePath();
      ctx.fill();

      // Axe spikes
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -shaftLen - 4, 4, 6);
    } else if (wt === 'daggers') {
      // Fast iron dagger
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1.5, 0, 3, 5);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-3, -18);
      ctx.lineTo(0, -23);
      ctx.lineTo(3, -18);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill();
    } else if (wt === 'bow') {
      // Curved wooden bow with taut string
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -10, 18, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      // String
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI * 0.45) * 18, -10 + Math.sin(-Math.PI * 0.45) * 18);
      ctx.lineTo(Math.cos(Math.PI * 0.45) * 18, -10 + Math.sin(Math.PI * 0.45) * 18);
      ctx.stroke();
    } else if (wt === 'staff') {
      // Wizard staff with glowing orb
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -38, 4, 46);
      // Glowing orb on top
      const orbGrad = ctx.createRadialGradient(0, -42, 1, 0, -42, 9);
      orbGrad.addColorStop(0, '#fef08a');
      orbGrad.addColorStop(0.5, '#a855f7');
      orbGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, -42, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Dynamic Slash Trail Arc during swing
    if (this.isAttacking && wt !== 'bow' && wt !== 'staff') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const slashRadius = wt === 'greataxe' ? 44 : 34;
      const startArc = f === 1 ? -Math.PI * 0.3 : Math.PI * 0.7;
      const endArc = f === 1 ? Math.PI * 0.3 : Math.PI * 1.3;
      ctx.arc(6 * f, 0, slashRadius, startArc, endArc);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Overhead health and stun bar
  private drawOverheadBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = 40;
    const barHeight = 4;
    const barY = -34;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Current HP
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);
  }
}
