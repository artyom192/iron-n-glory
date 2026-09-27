import { Obstacle } from '../types/game';

export interface Point {
  x: number;
  y: number;
}

export class Physics {
  // Distance between two points
  public static distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Angle in radians from p1 to p2
  public static angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  // Circle vs Circle collision resolve
  public static resolveCircleCollision(
    c1: { x: number; y: number; vx: number; vy: number; radius: number; mass?: number },
    c2: { x: number; y: number; vx: number; vy: number; radius: number; mass?: number }
  ): boolean {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = c1.radius + c2.radius;

    if (dist < minDist && dist > 0.001) {
      const overlap = (minDist - dist) / 2;
      const nx = dx / dist;
      const ny = dy / dist;

      c1.x -= nx * overlap;
      c1.y -= ny * overlap;
      c2.x += nx * overlap;
      c2.y += ny * overlap;
      return true;
    }
    return false;
  }

  // Circle vs Obstacle (AABB rectangle) collision resolve
  public static resolveObstacleCollision(
    circle: { x: number; y: number; radius: number },
    obs: Obstacle
  ): boolean {
    // Find closest point on obstacle rect to circle center
    const closestX = Math.max(obs.x - obs.width / 2, Math.min(circle.x, obs.x + obs.width / 2));
    const closestY = Math.max(obs.y - obs.height / 2, Math.min(circle.y, obs.y + obs.height / 2));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < circle.radius) {
      if (dist === 0) {
        // Circle center is inside rect, push out upwards
        circle.y -= circle.radius;
        return true;
      }
      const overlap = circle.radius - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      circle.x += nx * overlap;
      circle.y += ny * overlap;
      return true;
    }
    return false;
  }

  // Circle vs Segment / Ray for projectile hit
  public static pointInRect(p: Point, obs: Obstacle): boolean {
    return (
      p.x >= obs.x - obs.width / 2 &&
      p.x <= obs.x + obs.width / 2 &&
      p.y >= obs.y - obs.height / 2 &&
      p.y <= obs.y + obs.height / 2
    );
  }

  // Keep entity inside arena bounds
  public static clampToArena(
    entity: { x: number; y: number; radius: number },
    arenaWidth: number,
    arenaHeight: number
  ): void {
    const margin = entity.radius + 16;
    if (entity.x < margin) entity.x = margin;
    if (entity.x > arenaWidth - margin) entity.x = arenaWidth - margin;
    if (entity.y < margin) entity.y = margin;
    if (entity.y > arenaHeight - margin) entity.y = arenaHeight - margin;
  }
}
