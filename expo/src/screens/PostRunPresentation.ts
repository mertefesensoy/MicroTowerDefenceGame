// PostRunPresentation.ts
// View model for the post-run summary screen
// Ported from MicroTDCore/UI/PostRunPresentation.swift

/**
 * Save status for persistence feedback
 */
export type SaveStatus =
    | { type: 'saved'; seed: number }
    | { type: 'failed'; errorMessage: string }
    | { type: 'protectedData' };

/**
 * View model for the post-run summary screen.
 * Populated from finalized data (RunManager events + persistence verification).
 * Decoupled from the active GameState.
 */
export interface PostRunPresentation {
    // Run Outcome
    didWin: boolean;
    wavesCompleted: number;
    totalCoins: number;
    durationStats: string;  // formatted "Time: 12:34" or similar

    // Progression Rewards
    xpGained: number;
    startLevel: number;
    endLevel: number;
    startFraction: number;  // 0.0 to 1.0 (progress toward next level before run)
    endFraction: number;    // 0.0 to 1.0 (progress toward next level after run)
    unlocks: string[];      // IDs of newly unlocked items

    // Persistence Status
    saveStatus: SaveStatus;
}

/**
 * Check if the player leveled up during this run
 */
export function didLevelUp(presentation: PostRunPresentation): boolean {
    return presentation.endLevel > presentation.startLevel;
}

/**
 * Create a PostRunPresentation from run data and progression events
 */
export function createPostRunPresentation(params: {
    didWin: boolean;
    wavesCompleted: number;
    totalCoins: number;
    ticksSurvived: number;
    xpGained: number;
    startLevel: number;
    endLevel: number;
    startXP: number;
    endXP: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    unlocks: string[];
    saveStatus: SaveStatus;
}): PostRunPresentation {
    const seconds = Math.floor(params.ticksSurvived / 60);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const durationStats = `Time: ${minutes}:${String(remainingSeconds).padStart(2, '0')}`;

    // Calculate XP bar fractions
    const levelRange = params.xpForNextLevel - params.xpForCurrentLevel;
    const startFraction = levelRange > 0
        ? Math.max(0, Math.min(1, (params.startXP - params.xpForCurrentLevel) / levelRange))
        : 0;
    const endFraction = levelRange > 0
        ? Math.max(0, Math.min(1, (params.endXP - params.xpForCurrentLevel) / levelRange))
        : 0;

    return {
        didWin: params.didWin,
        wavesCompleted: params.wavesCompleted,
        totalCoins: params.totalCoins,
        durationStats,
        xpGained: params.xpGained,
        startLevel: params.startLevel,
        endLevel: params.endLevel,
        startFraction,
        endFraction,
        unlocks: params.unlocks,
        saveStatus: params.saveStatus,
    };
}
