// ProgressionTypes.ts
// Meta-progression types — ported from MicroTDCore/Definitions/ProgressionTypes.swift

/**
 * Persistent player profile across runs
 */
export interface ProgressionProfile {
    xp: number;
    level: number;
    unlocks: Set<string>;
}

/**
 * Create a default profile for new players
 */
export function createDefaultProfile(): ProgressionProfile {
    return { xp: 0, level: 1, unlocks: new Set() };
}

/**
 * Summary of a completed run (input to progression system)
 */
export interface RunSummary {
    runSeed: number;
    didWin: boolean;
    wavesCleared: number;
    enemiesDefeated: number;
    totalCoinsEarned: number;
    relicsCollected: number;
    ticksSurvived: number;
}

/**
 * Events emitted by progression system after applying a run
 */
export type ProgressionEvent =
    | { type: 'xpGained'; amount: number; newTotal: number }
    | { type: 'leveledUp'; newLevel: number }
    | { type: 'unlocked'; itemID: string };

/**
 * Metadata from the last completed run (for persistence)
 */
export interface LastRunMetadata {
    runSeed: number;
    didWin: boolean;
    wavesCleared: number;
    ticksSurvived: number;
}

/**
 * Versioned save file envelope
 */
export interface ProgressionSaveFile {
    schemaVersion: number;
    profile: {
        xp: number;
        level: number;
        unlocks: string[];  // serialized from Set<string>
    };
    lastRun: LastRunMetadata | null;
    savedAt: string;  // ISO 8601
}

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Unlock definition: item unlocked at a specific level
 */
export interface UnlockDefinition {
    level: number;
    itemID: string;
}

/**
 * Rules governing XP calculation, leveling, and unlocks
 */
export class ProgressionRules {
    /**
     * XP required for each level (cumulative).
     * Level 1 → 2 requires 100 XP, Level 2 → 3 requires 250 XP, etc.
     */
    readonly xpPerLevel: number[];

    /**
     * Items unlocked at each level
     */
    readonly unlockSchedule: UnlockDefinition[];

    constructor(
        xpPerLevel: number[] = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000],
        unlockSchedule: UnlockDefinition[] = [
            { level: 2, itemID: 'relic_uncommon_pack' },
            { level: 2, itemID: 'tower_sniper' },
            { level: 3, itemID: 'relic_rare_pack' },
            { level: 3, itemID: 'tower_missile' },
            { level: 4, itemID: 'relic_legendary_pack' },
            { level: 5, itemID: 'map_fortress' },
        ]
    ) {
        this.xpPerLevel = xpPerLevel;
        this.unlockSchedule = unlockSchedule;
    }

    /**
     * Calculate XP earned from a run summary
     */
    calculateXP(summary: RunSummary): number {
        let xp = 0;
        xp += summary.wavesCleared * 20;
        xp += summary.enemiesDefeated * 2;
        xp += summary.relicsCollected * 10;
        if (summary.didWin) {
            xp += 100;
        }
        return xp;
    }

    /**
     * Get XP required to reach the next level
     */
    xpRequiredForLevel(level: number): number {
        if (level < 1) return 0;
        if (level - 1 >= this.xpPerLevel.length) {
            // Beyond defined levels — linear extrapolation
            const lastXP = this.xpPerLevel[this.xpPerLevel.length - 1];
            const extraLevels = level - this.xpPerLevel.length;
            return lastXP + extraLevels * 2000;
        }
        return this.xpPerLevel[level - 1];
    }

    /**
     * Determine level from cumulative XP
     */
    levelForXP(xp: number): number {
        let level = 1;
        for (let i = 1; i < this.xpPerLevel.length; i++) {
            if (xp >= this.xpPerLevel[i]) {
                level = i + 1;
            } else {
                break;
            }
        }
        // Check beyond defined levels
        if (level >= this.xpPerLevel.length) {
            const lastXP = this.xpPerLevel[this.xpPerLevel.length - 1];
            const remaining = xp - lastXP;
            if (remaining > 0) {
                level += Math.floor(remaining / 2000);
            }
        }
        return level;
    }

    /**
     * Get all unlocks earned up to (and including) a given level
     */
    unlocksForLevel(level: number): string[] {
        return this.unlockSchedule
            .filter(u => u.level <= level)
            .map(u => u.itemID);
    }
}
