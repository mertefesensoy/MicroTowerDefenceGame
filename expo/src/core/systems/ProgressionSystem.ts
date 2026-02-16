// ProgressionSystem.ts
// Pure logic for applying run results to player profile
// Ported from MicroTDCore/Systems/ProgressionSystem.swift

import type { ProgressionProfile, RunSummary, ProgressionEvent } from '../definitions/ProgressionTypes';
import { ProgressionRules } from '../definitions/ProgressionTypes';

/**
 * Pure logic system that processes run summaries and updates player profiles.
 * No I/O — just computation. Persistence is handled by ProfileStore/RunManager.
 */
export class ProgressionSystem {
    private readonly rules: ProgressionRules;

    constructor(rules: ProgressionRules = new ProgressionRules()) {
        this.rules = rules;
    }

    /**
     * Apply a completed run to a profile. Mutates the profile in place and
     * returns events describing what changed (XP gained, level ups, unlocks).
     */
    applyRun(summary: RunSummary, profile: ProgressionProfile): ProgressionEvent[] {
        const events: ProgressionEvent[] = [];

        // Calculate XP earned
        const xpGained = this.rules.calculateXP(summary);
        if (xpGained <= 0) return events;

        // Apply XP
        const previousLevel = profile.level;
        profile.xp += xpGained;

        events.push({
            type: 'xpGained',
            amount: xpGained,
            newTotal: profile.xp,
        });

        // Check for level ups
        const newLevel = this.rules.levelForXP(profile.xp);
        if (newLevel > previousLevel) {
            profile.level = newLevel;
            events.push({
                type: 'leveledUp',
                newLevel: newLevel,
            });

            // Award any unlocks for gained levels
            for (let lvl = previousLevel + 1; lvl <= newLevel; lvl++) {
                const levelUnlocks = this.rules.unlockSchedule
                    .filter(u => u.level === lvl)
                    .map(u => u.itemID);

                for (const itemID of levelUnlocks) {
                    if (!profile.unlocks.has(itemID)) {
                        profile.unlocks.add(itemID);
                        events.push({
                            type: 'unlocked',
                            itemID,
                        });
                    }
                }
            }
        }

        return events;
    }

    /**
     * Reconcile unlocks — ensure profile has all unlocks it should for its level.
     * Used after loading a profile to handle cases where unlocks were missed.
     */
    reconcileUnlocks(profile: ProgressionProfile): void {
        const expectedUnlocks = this.rules.unlocksForLevel(profile.level);
        for (const itemID of expectedUnlocks) {
            profile.unlocks.add(itemID);
        }
    }
}
