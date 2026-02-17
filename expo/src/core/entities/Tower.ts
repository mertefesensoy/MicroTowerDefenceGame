// Tower.ts
// Runtime tower entity

import type { TowerDef } from '../definitions/TowerDef';
import { GridPosition } from './GridPosition';
import { SimulationClock } from '../SimulationClock';

/**
 * Runtime tower instance placed on grid
 */
export class Tower {
    // Runtime state
    private _ticksSinceLastFire = 0;
    private _kills = 0;
    private _totalDamage = 0;

    // Modified stats (from relics/upgrades)
    damageMultiplier = 1.0;
    rangeMultiplier = 1.0;
    fireRateMultiplier = 1.0;
    slowOnHit = 0.0;

    constructor(
        public readonly instanceId: number,  // Deterministic ID for rendering
        public readonly typeID: string,
        public readonly position: GridPosition,
        public readonly baseDef: TowerDef
    ) {
        this.slowOnHit = this.baseDef.slowOnHit || 0.0;
    }

    get ticksSinceLastFire(): number {
        return this._ticksSinceLastFire;
    }

    get kills(): number {
        return this._kills;
    }

    get totalDamage(): number {
        return this._totalDamage;
    }

    get effectiveDamage(): number {
        return this.baseDef.damage * this.damageMultiplier;
    }

    get effectiveRange(): number {
        return this.baseDef.range * this.rangeMultiplier;
    }

    get effectiveFireRate(): number {
        return this.baseDef.fireRate * this.fireRateMultiplier;
    }

    get ticksPerShot(): number {
        return Math.floor(SimulationClock.TICKS_PER_SECOND / this.effectiveFireRate);
    }

    canFire(): boolean {
        return this._ticksSinceLastFire >= this.ticksPerShot;
    }

    incrementTick(): void {
        this._ticksSinceLastFire++;
    }

    resetFireCooldown(): void {
        this._ticksSinceLastFire = 0;
    }

    recordDamage(damage: number): void {
        this._totalDamage += damage;
    }

    recordKill(): void {
        this._kills++;
    }
}
