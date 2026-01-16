// CombatSystem.ts
// Handles tower targeting, damage, and status effects

import { Tower } from '../entities/Tower';
import { Enemy } from '../entities/Enemy';
import { GridPosition } from '../entities/GridPosition';
import type { MapDef } from '../definitions/MapDef';

/**
 * Result of a combat action
 */
export interface CombatResult {
    damage: number;
    targetDied: boolean;
    targetRemainingHP: number;
    slowApplied: boolean;
}

/**
 * Combat system assumptions:
 * - Towers target enemy with **highest path progress** in range (strategic, stable)
 * - Instant damage application (no projectile simulation for MVP)
 * - Slow effect: **refresh duration, keep strongest, no stacking**
 * - Death detection immediate after damage
 */
export class CombatSystem {
    constructor(private readonly mapDef: MapDef) { }

    /**
     * Find best target for tower
     */
    findTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
        const inRange = enemies.filter(enemy => {
            const enemyPos = this.calculatePosition(enemy.pathProgress);
            return tower.position.distance(enemyPos) <= tower.effectiveRange;
        });

        // Target enemy with highest path progress (closest to end)
        if (inRange.length === 0) return null;

        return inRange.reduce((best, current) =>
            current.pathProgress > best.pathProgress ? current : best
        );
    }

    /**
     * Execute tower attack on target
     */
    executeAttack(tower: Tower, target: Enemy): CombatResult {
        const damage = tower.effectiveDamage;
        const wasDied = target.takeDamage(damage);

        tower.recordDamage(damage);
        tower.resetFireCooldown();

        const result: CombatResult = {
            damage,
            targetDied: wasDied,
            targetRemainingHP: target.currentHP,
            slowApplied: false,
        };

        // Apply slow if tower has slow-on-hit
        if (tower.slowOnHit > 0) {
            const slowDuration = 60; // 1 second at 60 ticks/sec
            target.applySlow(tower.slowOnHit, slowDuration);
            result.slowApplied = true;
        }

        if (wasDied) {
            tower.recordKill();
        }

        return result;
    }

    /**
     * Calculate grid position from path progress
     */
    private calculatePosition(pathProgress: number): GridPosition {
        const waypoints = [...this.mapDef.waypoints].sort((a, b) =>
            a.pathProgress - b.pathProgress
        );

        if (waypoints.length === 0) {
            return new GridPosition(0, 0);
        }

        if (pathProgress <= waypoints[0].pathProgress) {
            return waypoints[0].position;
        }

        if (pathProgress >= waypoints[waypoints.length - 1].pathProgress) {
            return waypoints[waypoints.length - 1].position;
        }

        // Find segment
        for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i];
            const end = waypoints[i + 1];

            if (pathProgress >= start.pathProgress && pathProgress <= end.pathProgress) {
                // Linear interpolation
                const t = (pathProgress - start.pathProgress) / (end.pathProgress - start.pathProgress);
                const x = Math.round(start.position.x * (1 - t) + end.position.x * t);
                const y = Math.round(start.position.y * (1 - t) + end.position.y * t);
                return new GridPosition(x, y);
            }
        }

        return waypoints[waypoints.length - 1].position;
    }
}
