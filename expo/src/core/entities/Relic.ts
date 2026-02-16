// Relic.ts
// Runtime relic instance — ported from MicroTDCore/Entities/Relic.swift

import type { RelicDef, EffectType } from '../definitions/RelicDef';

/**
 * A relic instance held in the player's inventory during a run.
 * Wraps a RelicDef and provides modifier calculation helpers.
 */
export class Relic {
    public readonly id: string;
    public readonly definition: RelicDef;

    constructor(definition: RelicDef) {
        this.id = definition.id;
        this.definition = definition;
    }

    /**
     * Get the combined multiplier for a specific effect type.
     * For multiplicative effects, returns the product of all matching effects.
     * Returns 1.0 if no matching effects found (identity for multiplication).
     */
    multiplier(effectType: EffectType): number {
        let result = 1.0;
        for (const effect of this.definition.effects) {
            if (effect.type === effectType) {
                result *= effect.value;
            }
        }
        return result;
    }

    /**
     * Get the combined additive value for a specific effect type.
     * For additive effects (like startingCoins), returns the sum of all matching effects.
     * Returns 0 if no matching effects found (identity for addition).
     */
    additiveValue(effectType: EffectType): number {
        let result = 0;
        for (const effect of this.definition.effects) {
            if (effect.type === effectType) {
                result += effect.value;
            }
        }
        return result;
    }
}
