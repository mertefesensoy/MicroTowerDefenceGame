// RunManager.ts
// Manages progression profile lifecycle and run application
// Ported from MicroTDCore/Persistence/RunManager.swift

import type { ProfileStoreInterface } from './ProfileStore';
import type {
    ProgressionProfile,
    LastRunMetadata,
    RunSummary,
    ProgressionEvent,
} from '../core/definitions/ProgressionTypes';
import { ProgressionRules, createDefaultProfile } from '../core/definitions/ProgressionTypes';
import { ProgressionSystem } from '../core/systems/ProgressionSystem';

/**
 * Manages the active progression profile and handles run completion.
 * Ensures idempotent run application and re-entrancy safety.
 */
export class RunManager {
    private readonly store: ProfileStoreInterface;
    private readonly rules: ProgressionRules;
    private readonly progressionSystem: ProgressionSystem;

    public profile: ProgressionProfile;
    public lastRun: LastRunMetadata | null;

    // Guard against re-entrant saves
    private inFlightRunSeeds = new Set<number>();

    // Private constructor — use static factory RunManager.make()
    private constructor(
        store: ProfileStoreInterface,
        rules: ProgressionRules,
        profile: ProgressionProfile,
        lastRun: LastRunMetadata | null,
    ) {
        this.store = store;
        this.rules = rules;
        this.progressionSystem = new ProgressionSystem(rules);
        this.profile = profile;
        this.lastRun = lastRun;
    }

    /**
     * Async factory to initialize RunManager (loads profile from store).
     */
    static async make(
        store: ProfileStoreInterface,
        rules: ProgressionRules = new ProgressionRules(),
    ): Promise<RunManager> {
        const { profile, lastRun } = await store.load(rules);
        return new RunManager(store, rules, profile, lastRun);
    }

    /**
     * Apply a completed run to the profile and persist.
     * Idempotent: rejects duplicate runSeeds.
     * Re-entrancy safe: rejects concurrent calls for the same seed.
     *
     * @returns Events generated (XP gained, level ups, unlocks). Empty array if skipped.
     */
    async applyRun(summary: RunSummary): Promise<ProgressionEvent[]> {
        // Idempotency: reject duplicate runSeeds (prevents double-award)
        if (this.lastRun && this.lastRun.runSeed === summary.runSeed) {
            if (__DEV__) {
                console.warn(`⚠️ RunManager: Duplicate runSeed ${summary.runSeed} detected — skipping`);
            }
            return [];
        }

        // Re-entrancy guard
        if (this.inFlightRunSeeds.has(summary.runSeed)) {
            if (__DEV__) {
                console.warn(`⚠️ RunManager: RunSeed ${summary.runSeed} already in-flight — skipping`);
            }
            return [];
        }

        this.inFlightRunSeeds.add(summary.runSeed);

        try {
            // Compute-then-commit pattern:
            // 1. Clone profile
            const newProfile: ProgressionProfile = {
                xp: this.profile.xp,
                level: this.profile.level,
                unlocks: new Set(this.profile.unlocks),
            };

            // 2. Apply run (mutates clone)
            const events = this.progressionSystem.applyRun(summary, newProfile);

            // 3. Create metadata
            const newLastRun: LastRunMetadata = {
                runSeed: summary.runSeed,
                didWin: summary.didWin,
                wavesCleared: summary.wavesCleared,
                ticksSurvived: summary.ticksSurvived,
            };

            // 4. Persist (off-main via async)
            await this.store.save(newProfile, newLastRun);

            // 5. Commit to memory only on success
            this.profile = newProfile;
            this.lastRun = newLastRun;

            return events;
        } finally {
            this.inFlightRunSeeds.delete(summary.runSeed);
        }
    }

    /**
     * Reset profile to default (for testing or user request).
     */
    async resetProfile(): Promise<void> {
        await this.store.reset();
        this.profile = createDefaultProfile();
        this.lastRun = null;
        this.inFlightRunSeeds.clear();
    }
}
