// TowerDef.ts
// Tower type definitions

/**
 * Tower definition (from JSON or hardcoded)
 */
export interface TowerDef {
    id: string;
    name: string;
    cost: number;
    range: number;
    fireRate: number;  // attacks per second
    damage: number;
    description: string;
    upgradePaths: string[];
}

/**
 * Container for all tower definitions
 */
export class TowerDefinitions {
    constructor(public readonly towers: TowerDef[]) { }

    /**
     * Find tower by ID
     */
    tower(id: string): TowerDef | undefined {
        return this.towers.find(t => t.id === id);
    }
}
