// Enemy.ts
// Runtime enemy entity

import type { EnemyDef } from '../definitions/EnemyDef';

/**
 * Slow effect active on enemy
 */
export interface SlowEffect {
    amount: number;  // 0.0 to 1.0 (1.0 = full slow, 0% speed)
    remainingTicks: number;
}

/**
 * Runtime enemy instance moving along path
 */
export class Enemy {
    // Runtime state
    private _currentHP: number;
    private _pathProgress = 0.0;
    private _slowEffect: SlowEffect | null = null;

    constructor(
        public readonly instanceId: number,  // Deterministic ID for rendering
        public readonly typeID: string,
        public readonly baseDef: EnemyDef
    ) {
        this._currentHP = baseDef.hp;
    }

    get currentHP(): number {
        return this._currentHP;
    }

    get pathProgress(): number {
        return this._pathProgress;
    }

    get slowEffect(): SlowEffect | null {
        return this._slowEffect;
    }

    get isAlive(): boolean {
        return this._currentHP > 0;
    }

    get hasReachedEnd(): boolean {
        return this._pathProgress >= 1.0;
    }

    get effectiveSpeed(): number {
        if (this._slowEffect) {
            return this.baseDef.speed * (1.0 - this._slowEffect.amount);
        }
        return this.baseDef.speed;
    }

    /**
     * Apply damage and return whether enemy died
     */
    takeDamage(damage: number): boolean {
        this._currentHP -= damage;
        return this._currentHP <= 0;
    }

    /**
     * Apply slow effect (refresh duration, keep strongest)
     */
    applySlow(amount: number, durationTicks: number): void {
        if (this._slowEffect) {
            // Keep strongest slow, refresh duration
            const strongestAmount = Math.max(this._slowEffect.amount, amount);
            this._slowEffect = { amount: strongestAmount, remainingTicks: durationTicks };
        } else {
            this._slowEffect = { amount, remainingTicks: durationTicks };
        }
    }

    /**
     * Move enemy along path
     */
    move(deltaProgress: number): void {
        this._pathProgress += deltaProgress;
    }

    /**
     * Update slow effect duration
     */
    tickSlow(): void {
        if (!this._slowEffect) return;

        this._slowEffect.remainingTicks--;
        if (this._slowEffect.remainingTicks <= 0) {
            this._slowEffect = null;
        }
    }
}
