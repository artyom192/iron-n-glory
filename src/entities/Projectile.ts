import { Obstacle } from '../types/game';
import { Physics } from '../systems/physics';

export type ProjectileType = 'arrow' | 'power_shot' | 'magic_bolt' | 'fireball';

export class Projectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public type: ProjectileType;
  public damage: number;
  public ownerId: string; // 'p1' | 'p2' / 'bot'
  public isCrit: boolean;
  public life: number;
  public maxLife: number;
  public isDead: boolean = false;
  public angle: number;
  public pierceCount: number;

  constructor(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    type: ProjectileType,
    damage: number,
    ownerId: string,
    isCrit: boolean = false
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.damage = damage;
    this.ownerId = ownerId;
    this.isCrit = isCrit;

    const angle = Physics.angle({ x, y }, { x: targetX, y: targetY });
    this.angle = angle;

    let speed = 650;
    this.radius = 6;
    this.maxLife = 2.0;
    this.pierceCount = 1;

    if (type === 'arrow') {
      speed = 700;
      this.radius = 4;
      this.maxLife = 1.6;
    } else if (type === 'power_shot') {
      speed = 850;
      this.radius = 8;
      this.maxLife = 2.0;
      this.pierceCount = 3;
    } else if (type === 'magic_bolt') {
      speed = 520;
      this.radius = 7;
      this.maxLife = 1.8;
    } else if (type === 'fireball') {
      speed = 460;
      this.radius = 12;
      this.maxLife = 2.0;
    }

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = this.maxLife;
  }

  public update(dt: number, obstacles: Obstacle[]): boolean {
    if (this.isDead) return true;

    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return true;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check collision with obstacles
    for (const obs of obstacles) {
      if (Physics.pointInRect({ x: this.x, y: this.y }, obs)) {
        this.isDead = true;
        return true;
      }
    }

    return false;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'arrow' || this.type === 'power_shot') {
      const isPower = this.type === 'power_shot';
      const len = isPower ? 36 : 26;

      // Shaft
      ctx.strokeStyle = isPower ? '#fbbf24' : '#d97706';
      ctx.lineWidth = isPower ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(-len / 2, 0);
      ctx.lineTo(len / 2, 0);
      ctx.stroke();

      // Arrow head
      ctx.fillStyle = isPower ? '#ef4444' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(len / 2 + 5, 0);
      ctx.lineTo(len / 2 - 4, -4);
      ctx.lineTo(len / 2 - 4, 4);
      ctx.closePath();
      ctx.fill();

      // Fletching (feathers)
      ctx.fillStyle = isPower ? '#f59e0b' : '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-len / 2, 0);
      ctx.lineTo(-len / 2 - 4, -3);
      ctx.lineTo(-len / 2 + 2, 0);
      ctx.lineTo(-len / 2 - 4, 3);
      ctx.closePath();
      ctx.fill();

      if (isPower) {
        // Glowing aura
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-len / 2, 0);
        ctx.lineTo(len / 2 + 5, 0);
        ctx.stroke();
      }
    } else if (this.type === 'magic_bolt') {
      // Arcane pulse
      const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, '#a855f7');
      gradient.addColorStop(1, 'rgba(126, 34, 206, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'fireball') {
      // Flaming core
      const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 1.4);
      gradient.addColorStop(0, '#fef08a');
      gradient.addColorStop(0.3, '#f97316');
      gradient.addColorStop(0.8, '#dc2626');
      gradient.addColorStop(1, 'rgba(185, 28, 28, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Fire trail tail
      ctx.fillStyle = 'rgba(249, 115, 22, 0.6)';
      ctx.beginPath();
      ctx.moveTo(-this.radius, -this.radius * 0.6);
      ctx.lineTo(-this.radius * 2.2, 0);
      ctx.lineTo(-this.radius, this.radius * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
