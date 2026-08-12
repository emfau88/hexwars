import type { Particle, Point } from '../core/types';

export class EffectsRenderer {
  readonly particles: Particle[] = [];

  burst(point: Point, color: string, count: number, random = Math.random): void {
    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = 15 + random() * 45;
      this.particles.push({ x: point.x, y: point.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.35 + random() * 0.35, max: 0.7, color });
    }
  }

  update(deltaSeconds: number): void {
    for (const particle of this.particles) {
      particle.x += particle.vx * deltaSeconds; particle.y += particle.vy * deltaSeconds;
      particle.life -= deltaSeconds; particle.vx *= 0.96; particle.vy *= 0.96;
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) if (this.particles[index].life <= 0) this.particles.splice(index, 1);
  }

  draw(context: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      context.globalAlpha = Math.max(0, Math.min(1, particle.life / particle.max));
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, 2, 2);
    }
    context.globalAlpha = 1;
  }
}

