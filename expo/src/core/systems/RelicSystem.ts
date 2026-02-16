// RelicSystem.ts
// Relic inventory and modifier management — ported from MicroTDCore/Systems/RelicSystem.swift

import type { RelicDef, EffectType } from '../definitions/RelicDef';
import { RelicDatabase } from '../definitions/RelicDatabase';
import { Relic } from '../entities/Relic';
import type { SeededRNG } from '../SeededRNG';

/**
 * Manages relic inventory, offers, and combined modifier computation.
 * Uses deterministic RNG for reproducible relic offers.
 */
export class RelicSystem {
    private readonly database: RelicDatabase;
    private readonly rng: SeededRNG;
    private readonly inventory: Relic[] = [];

    // Cached combined modifiers (recomputed on relic change)
    private cachedDamageMultiplier = 1.0;
    private cachedRangeMultiplier = 1.0;
    private cachedFireRateMultiplier = 1.0;
    private cachedCoinMultiplier = 1.0;
    private cachedSlowOnHit = 0.0;
    private cachedStartingCoins = 0.0;

    constructor(database: RelicDatabase, rng: SeededRNG) {
        this.database = database;
        this.rng = rng;
    }

    /**
     * Get all owned relics
     */
    get ownedRelics(): readonly Relic[] {
        return this.inventory;
    }

    /**
     * Generate relic offer IDs using deterministic RNG.
     * Excludes already-owned relic IDs.
     */
    makeOfferIDs(count: number, excludeOwned: boolean = true): string[] {
        const ownedIDs = new Set(this.inventory.map(r => r.id));
        let candidates = this.database.all;

        if (excludeOwned) {
            candidates = candidates.filter(r => !ownedIDs.has(r.id));
        }

        if (candidates.length === 0) return [];

        // Deterministic shuffle using RNG
        const shuffled = [...candidates];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.rng.nextInt(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.slice(0, Math.min(count, shuffled.length)).map(r => r.id);
    }

    /**
     * Generate relic choices (full RelicDef objects)
     */
    generateChoices(count: number): RelicDef[] {
        const ids = this.makeOfferIDs(count);
        const choices: RelicDef[] = [];
        for (const id of ids) {
            const def = this.database.relic(id);
            if (def) choices.push(def);
        }
        return choices;
    }

    /**
     * Apply a chosen relic to the inventory
     */
    applyRelic(id: string): void {
        const def = this.database.relic(id);
        if (!def) {
            throw new Error(`Relic not found: ${id}`);
        }

        this.inventory.push(new Relic(def));
        this.recomputeModifiers();
    }

    /**
     * Choose a relic from an offer (convenience alias)
     */
    chooseRelic(id: string): void {
        this.applyRelic(id);
    }

    // ─── Combined Modifier Accessors ───

    get combinedDamageMultiplier(): number { return this.cachedDamageMultiplier; }
    get combinedRangeMultiplier(): number { return this.cachedRangeMultiplier; }
    get combinedFireRateMultiplier(): number { return this.cachedFireRateMultiplier; }
    get combinedCoinMultiplier(): number { return this.cachedCoinMultiplier; }
    get combinedSlowOnHit(): number { return this.cachedSlowOnHit; }
    get combinedStartingCoins(): number { return this.cachedStartingCoins; }

    /**
     * Get combined multiplier for a specific effect type
     */
    combinedMultiplier(effectType: EffectType): number {
        let result = 1.0;
        for (const relic of this.inventory) {
            result *= relic.multiplier(effectType);
        }
        return result;
    }

    /**
     * Get combined additive value for a specific effect type
     */
    combinedAdditiveValue(effectType: EffectType): number {
        let result = 0;
        for (const relic of this.inventory) {
            result += relic.additiveValue(effectType);
        }
        return result;
    }

    // ─── Internal ───

    private recomputeModifiers(): void {
        this.cachedDamageMultiplier = this.combinedMultiplier('towerDamageMultiplier');
        this.cachedRangeMultiplier = this.combinedMultiplier('towerRangeMultiplier');
        this.cachedFireRateMultiplier = this.combinedMultiplier('towerFireRateMultiplier');
        this.cachedCoinMultiplier = this.combinedMultiplier('coinMultiplier');
        this.cachedSlowOnHit = this.combinedAdditiveValue('enemySlowOnHit');
        this.cachedStartingCoins = this.combinedAdditiveValue('startingCoins');
    }
}
