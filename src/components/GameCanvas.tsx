import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArenaDef, GameMode, InputState, CharacterClassId } from '../types/game';
import { Fighter } from '../entities/Fighter';
import { Projectile } from '../entities/Projectile';
import { Physics } from '../systems/physics';
import { ParticleSystem } from '../systems/particles';
import { FighterAI } from '../systems/ai';
import { soundEngine } from '../systems/audio';

export interface GameCanvasProps {
  arena: ArenaDef;
  player1: Fighter;
  player2: Fighter;
  gameMode: GameMode;
  aiDifficulty?: 'easy' | 'normal' | 'hard';
  onMatchEnd: (winnerId: string, p1HpPercent: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  arena,
  player1,
  player2,
  gameMode,
  aiDifficulty = 'normal',
  onMatchEnd,
  isPaused,
  onTogglePause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard input states
  const p1Inputs = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    ability: false,
    dash: false,
  });

  const p2Inputs = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    ability: false,
    dash: false,
  });

  // State refs for game loop
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const projectilesRef = useRef<Projectile[]>([]);
  const botAiRef = useRef<FighterAI>(new FighterAI(aiDifficulty));
  const isMatchOverRef = useRef<boolean>(false);
  const hitStopTimerRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const p1WhirlwindTimerRef = useRef<number>(0);
  const p2WhirlwindTimerRef = useRef<number>(0);

  // Reset arena match state
  useEffect(() => {
    isMatchOverRef.current = false;
    projectilesRef.current = [];
    particlesRef.current.clear();
    botAiRef.current = new FighterAI(aiDifficulty);

    // Initial positions
    player1.x = arena.width * 0.25;
    player1.y = arena.height * 0.5;
    player1.facing = 1;
    player1.hp = player1.maxHp;
    player1.isDead = false;

    player2.x = arena.width * 0.75;
    player2.y = arena.height * 0.5;
    player2.facing = -1;
    player2.hp = player2.maxHp;
    player2.isDead = false;
  }, [arena, player1, player2, aiDifficulty]);

  // Key event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onTogglePause();
        return;
      }

      // Player 1 controls (WASD, F = attack, G = ability, Space / H = dash)
      if (e.code === 'KeyW') p1Inputs.current.up = true;
      if (e.code === 'KeyS') p1Inputs.current.down = true;
      if (e.code === 'KeyA') p1Inputs.current.left = true;
      if (e.code === 'KeyD') p1Inputs.current.right = true;
      if (e.code === 'KeyF') p1Inputs.current.attack = true;
      if (e.code === 'KeyG') p1Inputs.current.ability = true;
      if (e.code === 'Space' || e.code === 'KeyH') p1Inputs.current.dash = true;

      // Player 2 controls (Arrow keys, K / Numpad 1 = attack, L / Numpad 2 = ability, J / Numpad 3 = dash)
      if (gameMode === 'LOCAL_VS') {
        if (e.code === 'ArrowUp') p2Inputs.current.up = true;
        if (e.code === 'ArrowDown') p2Inputs.current.down = true;
        if (e.code === 'ArrowLeft') p2Inputs.current.left = true;
        if (e.code === 'ArrowRight') p2Inputs.current.right = true;
        if (e.code === 'KeyK' || e.code === 'Numpad1') p2Inputs.current.attack = true;
        if (e.code === 'KeyL' || e.code === 'Numpad2') p2Inputs.current.ability = true;
        if (e.code === 'KeyJ' || e.code === 'Numpad3') p2Inputs.current.dash = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') p1Inputs.current.up = false;
      if (e.code === 'KeyS') p1Inputs.current.down = false;
      if (e.code === 'KeyA') p1Inputs.current.left = false;
      if (e.code === 'KeyD') p1Inputs.current.right = false;
      if (e.code === 'KeyF') p1Inputs.current.attack = false;
      if (e.code === 'KeyG') p1Inputs.current.ability = false;
      if (e.code === 'Space' || e.code === 'KeyH') p1Inputs.current.dash = false;

      if (gameMode === 'LOCAL_VS') {
        if (e.code === 'ArrowUp') p2Inputs.current.up = false;
        if (e.code === 'ArrowDown') p2Inputs.current.down = false;
        if (e.code === 'ArrowLeft') p2Inputs.current.left = false;
        if (e.code === 'ArrowRight') p2Inputs.current.right = false;
        if (e.code === 'KeyK' || e.code === 'Numpad1') p2Inputs.current.attack = false;
        if (e.code === 'KeyL' || e.code === 'Numpad2') p2Inputs.current.ability = false;
        if (e.code === 'KeyJ' || e.code === 'Numpad3') p2Inputs.current.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameMode, onTogglePause]);

  // Main combat update loop
  const updateCombat = useCallback(
    (dt: number) => {
      if (isPaused) return;

      const particles = particlesRef.current;
      const projectiles = projectilesRef.current;

      // Hit stop logic
      if (hitStopTimerRef.current > 0) {
        hitStopTimerRef.current -= dt;
        return;
      }

      // 1. Process Player 1 Inputs
      const p1Triggers = player1.handleInput(p1Inputs.current, player2.x, player2.y);
      if (p1Triggers.attackTriggered) {
        handleAttackLaunch(player1, player2, projectiles);
      }
      if (p1Triggers.abilityTriggered) {
        handleAbilityLaunch(player1, player2, projectiles, particles);
      }

      // 2. Process Player 2 / Bot Inputs
      let p2ActualInput: InputState;
      if (gameMode === 'LOCAL_VS') {
        p2ActualInput = p2Inputs.current;
      } else {
        // AI Controlled Bot
        p2ActualInput = botAiRef.current.update(dt, player2, player1, arena.obstacles);
      }

      const p2Triggers = player2.handleInput(p2ActualInput, player1.x, player1.y);
      if (p2Triggers.attackTriggered) {
        handleAttackLaunch(player2, player1, projectiles);
      }
      if (p2Triggers.abilityTriggered) {
        handleAbilityLaunch(player2, player1, projectiles, particles);
      }

      // 3. Update Fighters
      player1.update(dt, particles);
      player2.update(dt, particles);

      // Melee Swing Hit Detection for P1
      checkMeleeHit(player1, player2, particles);
      checkMeleeHit(player2, player1, particles);

      // Continuous Ability Ticks (Knight Whirlwind)
      handleWhirlwind(player1, player2, p1WhirlwindTimerRef, dt, particles);
      handleWhirlwind(player2, player1, p2WhirlwindTimerRef, dt, particles);

      // 4. Update Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        const isDead = proj.update(dt, arena.obstacles);

        if (isDead) {
          if (proj.type === 'fireball') {
            soundEngine.playExplosion();
            particles.spawnExplosion(proj.x, proj.y, 50);
            particles.triggerScreenShake(7, 0.2);
            // Splash damage
            [player1, player2].forEach((target) => {
              if (target.id !== proj.ownerId) {
                const splashDist = Physics.distance(proj, target);
                if (splashDist < 70) {
                  const dmg = target.takeDamage(proj.damage, proj.isCrit, proj.x, particles, true);
                  if (dmg > 0) hitStopTimerRef.current = 0.04;
                }
              }
            });
          } else {
            particles.spawnSparks(proj.x, proj.y, 4, '#cbd5e1');
          }
          projectiles.splice(i, 1);
          continue;
        }

        // Check projectile hit on opposing fighter
        const target = proj.ownerId === player1.id ? player2 : player1;
        const dist = Physics.distance(proj, target);

        if (dist < proj.radius + target.radius) {
          const dmg = target.takeDamage(proj.damage, proj.isCrit, proj.x, particles, proj.type === 'power_shot');
          if (dmg > 0) hitStopTimerRef.current = 0.04;

          proj.pierceCount--;
          if (proj.pierceCount <= 0) {
            if (proj.type === 'fireball') {
              soundEngine.playExplosion();
              particles.spawnExplosion(proj.x, proj.y, 50);
              particles.triggerScreenShake(8, 0.22);
            }
            projectiles.splice(i, 1);
          }
        }
      }

      // 5. Physical Collisions
      Physics.resolveCircleCollision(player1, player2);

      for (const obs of arena.obstacles) {
        Physics.resolveObstacleCollision(player1, obs);
        Physics.resolveObstacleCollision(player2, obs);
      }

      Physics.clampToArena(player1, arena.width, arena.height);
      Physics.clampToArena(player2, arena.width, arena.height);

      // 6. Update Particles & Numbers
      particles.update(dt);

      // 7. Check Victory Condition
      if (!isMatchOverRef.current) {
        if (player1.isDead || player2.isDead) {
          isMatchOverRef.current = true;
          const winner = player1.isDead ? player2.id : player1.id;
          const p1HpRatio = player1.hp / player1.maxHp;

          if (winner === player1.id) {
            soundEngine.playVictory();
          } else {
            soundEngine.playDefeat();
          }

          setTimeout(() => {
            onMatchEnd(winner, p1HpRatio);
          }, 1400);
        }
      }
    },
    [arena, player1, player2, gameMode, isPaused, onMatchEnd]
  );

  // Attack launcher (ranged vs melee)
  const handleAttackLaunch = (
    attacker: Fighter,
    target: Fighter,
    projectiles: Projectile[]
  ) => {
    const wt = attacker.classDef.weaponType;

    if (wt === 'bow') {
      const isCrit = Math.random() < attacker.critChance;
      const dmg = attacker.attack * (isCrit ? 1.75 : 1.0);
      const proj = new Projectile(
        attacker.x + attacker.facing * 16,
        attacker.y - 2,
        target.x,
        target.y,
        'arrow',
        dmg,
        attacker.id,
        isCrit
      );
      projectiles.push(proj);
    } else if (wt === 'staff') {
      const isCrit = Math.random() < attacker.critChance;
      const dmg = attacker.attack * (isCrit ? 1.6 : 1.0);
      const proj = new Projectile(
        attacker.x + attacker.facing * 16,
        attacker.y - 4,
        target.x,
        target.y,
        'magic_bolt',
        dmg,
        attacker.id,
        isCrit
      );
      projectiles.push(proj);
    }
  };

  // Ability launcher
  const handleAbilityLaunch = (
    attacker: Fighter,
    target: Fighter,
    projectiles: Projectile[],
    particles: ParticleSystem
  ) => {
    const ability = attacker.classDef.ability;
    const isCrit = Math.random() < attacker.critChance + 0.15;
    const dmg = attacker.attack * ability.damageMultiplier * attacker.abilityPower * (isCrit ? 1.5 : 1.0);

    if (ability.id === 'shield_bash') {
      // Check collision with target in front
      const dist = Physics.distance(attacker, target);
      if (dist < 85 && (target.x - attacker.x) * attacker.facing >= -10) {
        target.takeDamage(dmg, isCrit, attacker.x, particles, true);
        target.stun(1.1); // Stun 1.1s!
        hitStopTimerRef.current = 0.06;
      }
    } else if (ability.id === 'rage_strike') {
      // Leap slam
      particles.triggerScreenShake(12, 0.3);
      particles.spawnExplosion(attacker.x + attacker.facing * 30, attacker.y, 35);
      const dist = Physics.distance(attacker, target);
      if (dist < 95) {
        target.takeDamage(dmg, isCrit, attacker.x, particles, true);
        hitStopTimerRef.current = 0.08;
      }
    } else if (ability.id === 'dash_attack') {
      // Rogue teleport slash
      target.takeDamage(dmg, true, attacker.x, particles, true);
      attacker.x = target.x + (target.facing === 1 ? -40 : 40); // Teleport behind!
      attacker.facing = target.facing;
      hitStopTimerRef.current = 0.05;
      particles.spawnSparks(target.x, target.y, 14, '#10b981');
    } else if (ability.id === 'power_shot') {
      // Archer ballista power shot
      const proj = new Projectile(
        attacker.x + attacker.facing * 20,
        attacker.y - 2,
        target.x,
        target.y,
        'power_shot',
        dmg,
        attacker.id,
        true
      );
      projectiles.push(proj);
    } else if (ability.id === 'fireball') {
      // Mage exploding fireball
      const proj = new Projectile(
        attacker.x + attacker.facing * 20,
        attacker.y - 4,
        target.x,
        target.y,
        'fireball',
        dmg,
        attacker.id,
        isCrit
      );
      projectiles.push(proj);
    }
  };

  // Melee hit check
  const checkMeleeHit = (attacker: Fighter, target: Fighter, particles: ParticleSystem) => {
    if (!attacker.isAttacking || attacker.attackHasHit) return;

    // Melee window (middle of swing animation)
    if (attacker.swingProgress >= 0.25 && attacker.swingProgress <= 0.85) {
      const wt = attacker.classDef.weaponType;
      if (wt === 'bow' || wt === 'staff') return;

      const reach = wt === 'greataxe' ? 72 : wt === 'broadsword' ? 64 : 52;
      const dist = Physics.distance(attacker, target);

      // Facing check: target must be roughly in the direction attacker is facing
      const dot = (target.x - attacker.x) * attacker.facing;

      if (dist <= reach && dot >= -15) {
        attacker.attackHasHit = true;
        const isCrit = Math.random() < attacker.critChance;
        const dmg = attacker.attack * (isCrit ? 1.6 : 1.0);
        target.takeDamage(dmg, isCrit, attacker.x, particles, false);
        hitStopTimerRef.current = isCrit ? 0.06 : 0.03;
      }
    }
  };

  // Whirlwind multi-hit
  const handleWhirlwind = (
    attacker: Fighter,
    target: Fighter,
    timerRef: React.MutableRefObject<number>,
    dt: number,
    particles: ParticleSystem
  ) => {
    if (!attacker.isAbilityActive || attacker.classDef.ability.id !== 'whirlwind') return;

    timerRef.current += dt;
    if (timerRef.current >= 0.12) {
      timerRef.current = 0;
      const dist = Physics.distance(attacker, target);
      if (dist < 75) {
        const dmg = attacker.attack * 0.75 * attacker.abilityPower;
        target.takeDamage(dmg, false, attacker.x, particles, true);
      }
    }
  };

  // Main Render Loop
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      updateCombat(dt);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Apply screen shake
          const shake = particlesRef.current.getScreenShakeOffset();
          ctx.save();
          ctx.translate(shake.x, shake.y);

          // 1. Draw Arena Floor & Boundary
          drawArena(ctx, arena);

          // 2. Draw Arena Obstacles
          drawObstacles(ctx, arena.obstacles);

          // 3. Draw Projectiles
          for (const proj of projectilesRef.current) {
            proj.draw(ctx);
          }

          // 4. Draw Fighters (Y-sorted so fighter in front renders over fighter behind)
          if (player1.y <= player2.y) {
            player1.draw(ctx);
            player2.draw(ctx);
          } else {
            player2.draw(ctx);
            player1.draw(ctx);
          }

          // 5. Draw Particles and Floating Numbers
          particlesRef.current.draw(ctx);

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [updateCombat, arena, player1, player2]);

  // Arena background drawing
  const drawArena = (ctx: CanvasRenderingContext2D, a: ArenaDef) => {
    // Ground base
    ctx.fillStyle = a.groundColor;
    ctx.fillRect(0, 0, a.width, a.height);

    // Grid tiles / cobblestone pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const tileSize = 50;
    for (let x = 0; x < a.width; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, a.height);
      ctx.stroke();
    }
    for (let y = 0; y < a.height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(a.width, y);
      ctx.stroke();
    }

    // Royal carpet decoration for Throne arena
    if (a.decorations) {
      for (const dec of a.decorations) {
        if (dec.type === 'carpet') {
          ctx.fillStyle = 'rgba(185, 28, 28, 0.35)';
          ctx.fillRect(dec.x - 220, dec.y - 120, 440, 240);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2;
          ctx.strokeRect(dec.x - 220, dec.y - 120, 440, 240);
        }
      }
    }

    // Outer stone arena boundary with inner glow
    ctx.lineWidth = 12;
    ctx.strokeStyle = a.borderColor;
    ctx.strokeRect(6, 6, a.width - 12, a.height - 12);

    ctx.lineWidth = 2;
    ctx.strokeStyle = a.accentColor;
    ctx.strokeRect(14, 14, a.width - 28, a.height - 28);
  };

  // Obstacle drawing
  const drawObstacles = (ctx: CanvasRenderingContext2D, obstacles: ArenaDef['obstacles']) => {
    for (const obs of obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, obs.height / 2 + 3, obs.width / 2 + 4, obs.height / 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (obs.type === 'pillar' || obs.type === 'throne_pillar') {
        const isThrone = obs.type === 'throne_pillar';
        // Stone / Gilded Pillar
        ctx.fillStyle = isThrone ? '#a16207' : '#44403c';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        // Pillar capital & base
        ctx.fillStyle = isThrone ? '#facc15' : '#78716c';
        ctx.fillRect(-obs.width / 2 - 4, -obs.height / 2, obs.width + 8, 8);
        ctx.fillRect(-obs.width / 2 - 4, obs.height / 2 - 8, obs.width + 8, 8);
        // Vertical grooves
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-obs.width / 4, -obs.height / 2 + 8);
        ctx.lineTo(-obs.width / 4, obs.height / 2 - 8);
        ctx.moveTo(obs.width / 4, -obs.height / 2 + 8);
        ctx.lineTo(obs.width / 4, obs.height / 2 - 8);
        ctx.stroke();
      } else if (obs.type === 'barrel') {
        // Wooden barrel
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 10);
        ctx.fill();
        // Iron bands
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-obs.width / 2, -obs.height / 4, obs.width, 3);
        ctx.fillRect(-obs.width / 2, obs.height / 4, obs.width, 3);
      } else if (obs.type === 'crate') {
        // Wooden crate
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        // Diagonal cross
        ctx.beginPath();
        ctx.moveTo(-obs.width / 2, -obs.height / 2);
        ctx.lineTo(obs.width / 2, obs.height / 2);
        ctx.moveTo(obs.width / 2, -obs.height / 2);
        ctx.lineTo(-obs.width / 2, obs.height / 2);
        ctx.stroke();
      } else if (obs.type === 'rock') {
        // Mossy forest rock
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Moss patch
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(-obs.width / 6, -obs.height / 6, obs.width / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-stone-950 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={arena.width}
        height={arena.height}
        className="w-full h-full object-contain max-h-[88vh] shadow-2xl rounded-sm border border-stone-800"
      />
    </div>
  );
};
