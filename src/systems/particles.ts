import { FloatingText } from '../types/game';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  shape?: 'circle' | 'square' | 'spark' | 'ring';
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  private textIdCounter: number = 0;

  // Screen shake state
  public screenShakeIntensity: number = 0;
  public screenShakeDuration: number = 0;

  public triggerScreenShake(intensity: number = 8, duration: number = 0.2): void {
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    this.screenShakeDuration = Math.max(this.screenShakeDuration, duration);
  }

  public update(dt: number): void {
    // Screen shake countdown
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= dt;
      if (this.screenShakeDuration <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    // Update particles (capped at 250 for high performance)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ft.x += ft.vx * dt;
      ft.y += ft.vy * dt;
      ft.opacity = Math.max(0, ft.life / ft.maxLife);
    }
  }

  // Draw particles and floating numbers on canvas
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.beginPath();
        const angle = Math.atan2(p.vy, p.vx);
        const len = p.size * 2.5;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillRect(-len / 2, -p.size / 2, len, p.size);
        ctx.restore();
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life / p.maxLife)), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Draw floating damage texts
    ctx.save();
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = ft.opacity;
      ctx.font = `bold ${ft.fontSize}px 'Cinzel', serif`;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Outline for legibility
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  public getScreenShakeOffset(): { x: number; y: number } {
    if (this.screenShakeDuration <= 0) return { x: 0, y: 0 };
    const factor = this.screenShakeDuration * this.screenShakeIntensity;
    return {
      x: (Math.random() * 2 - 1) * factor,
      y: (Math.random() * 2 - 1) * factor,
    };
  }

  // Spawn hit sparks
  public spawnSparks(x: number, y: number, count: number = 8, color: string = '#fef08a'): void {
    if (this.particles.length > 200) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2.5,
        color,
        alpha: 1,
        life: 0.15 + Math.random() * 0.15,
        maxLife: 0.3,
        shape: 'spark',
      });
    }
  }

  // Spawn blood / visceral impact splash
  public spawnBlood(x: number, y: number, dirAngle: number, count: number = 10): void {
    if (this.particles.length > 200) return;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.4;
      const angle = dirAngle + spread;
      const speed = 90 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        color: Math.random() > 0.3 ? '#b91c1c' : '#7f1d1d',
        alpha: 1,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
        gravity: 120,
        shape: 'circle',
      });
    }
  }

  // Spawn dust puffs on footsteps or dash
  public spawnDust(x: number, y: number, count: number = 4): void {
    if (this.particles.length > 200) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 40,
        vy: -10 - Math.random() * 30,
        size: 3 + Math.random() * 4,
        color: '#a8a29e',
        alpha: 0.6,
        life: 0.2 + Math.random() * 0.2,
        maxLife: 0.4,
        shape: 'circle',
      });
    }
  }

  // Spawn explosion fiery embers and shock ring
  public spawnExplosion(x: number, y: number, radius: number = 40): void {
    // Shock ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: radius * 0.8,
      color: '#f97316',
      alpha: 1,
      life: 0.3,
      maxLife: 0.3,
      shape: 'ring',
    });

    // Fire sparks
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
        alpha: 1,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
        shape: 'circle',
      });
    }
  }

  // Add floating damage number
  public addDamageText(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean = false,
    isAbility: boolean = false
  ): void {
    const text = Math.round(damage).toString();
    let color = '#f8fafc'; // clean white
    let fontSize = 18;

    if (isCrit) {
      color = '#facc15'; // yellow gold
      fontSize = 24;
    } else if (isAbility) {
      color = '#38bdf8'; // sky blue
      fontSize = 22;
    }

    this.floatingTexts.push({
      id: ++this.textIdCounter,
      text: isCrit ? `${text}!` : text,
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      vx: (Math.random() - 0.5) * 30,
      vy: -75 - Math.random() * 30,
      color,
      fontSize,
      opacity: 1,
      life: 0.7,
      maxLife: 0.7,
    });
  }

  public clear(): void {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShakeIntensity = 0;
    this.screenShakeDuration = 0;
  }
}
