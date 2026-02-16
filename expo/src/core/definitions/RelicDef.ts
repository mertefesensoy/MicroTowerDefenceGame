// RelicDef.ts
// Relic type definitions — ported from MicroTDCore/Definitions/RelicDef.swift

/**
 * Relic effect types
 */
export type EffectType =
    | 'towerDamageMultiplier'
    | 'towerRangeMultiplier'
    | 'towerFireRateMultiplier'
    | 'coinMultiplier'
    | 'startingCoins'
    | 'enemySlowOnHit';

/**
 * Single effect applied by a relic
 */
export interface RelicEffect {
    type: EffectType;
    value: number;
}

/**
 * Relic rarity tiers
 */
export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Relic definition (from JSON or hardcoded)
 */
export interface RelicDef {
    id: string;
    name: string;
    description: string;
    rarity: RelicRarity;
    effects: RelicEffect[];
}

/**
 * Container for all relic definitions
 */
export class RelicDefinitions {
    constructor(public readonly relics: RelicDef[]) { }

    /**
     * Find relic by ID
     */
    relic(id: string): RelicDef | undefined {
        return this.relics.find(r => r.id === id);
    }

    /**
     * Get all relics of a specific rarity
     */
    relicsByRarity(rarity: RelicRarity): RelicDef[] {
        return this.relics.filter(r => r.rarity === rarity);
    }
}
