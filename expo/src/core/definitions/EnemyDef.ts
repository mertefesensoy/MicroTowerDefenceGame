// EnemyDef.ts
// Enemy type definitions

/**
 * Enemy definition (from JSON or hardcoded)
 */
export interface EnemyDef {
    id: string;
    name: string;
    hp: number;
    speed: number;  // grid cells per second
    coinReward: number;
    livesCost: number;
    description: string;
    isBoss: boolean;
}

/**
 * Container for all enemy definitions
 */
export class EnemyDefinitions {
    constructor(public readonly enemies: EnemyDef[]) { }

    /**
     * Find enemy by ID
     */
    enemy(id: string): EnemyDef | undefined {
        return this.enemies.find(e => e.id === id);
    }
}
