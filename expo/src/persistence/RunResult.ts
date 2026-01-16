// RunResult.ts
// Run result data structure and storage

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Result of a completed run
 */
export interface RunResult {
    id: string;
    timestamp: number;
    seed: number;
    wavesCompleted: number;
    totalCoins: number;
    totalKills: number;
    totalDamage: number;
    finalLives: number;
    isVictory: boolean;
    durationSeconds: number;
}

const STORAGE_KEY = '@micro_td_runs';
const MAX_STORED_RUNS = 50;

/**
 * Save a run result to persistent storage
 */
export async function saveRunResult(result: RunResult): Promise<void> {
    try {
        // Load existing runs
        const existing = await loadRunHistory();

        // Add new run at the beginning
        const updated = [result, ...existing];

        // Keep only the most recent runs
        const trimmed = updated.slice(0, MAX_STORED_RUNS);

        // Save back to storage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save run result:', error);
    }
}

/**
 * Load run history from persistent storage
 */
export async function loadRunHistory(): Promise<RunResult[]> {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const runs = JSON.parse(data) as RunResult[];
        return runs;
    } catch (error) {
        console.error('Failed to load run history:', error);
        return [];
    }
}

/**
 * Get statistics from run history
 */
export async function getRunStats(): Promise<{
    totalRuns: number;
    victories: number;
    defeats: number;
    avgWavesCompleted: number;
    bestRun: RunResult | null;
}> {
    const runs = await loadRunHistory();

    if (runs.length === 0) {
        return {
            totalRuns: 0,
            victories: 0,
            defeats: 0,
            avgWavesCompleted: 0,
            bestRun: null,
        };
    }

    const victories = runs.filter(r => r.isVictory).length;
    const defeats = runs.length - victories;
    const avgWavesCompleted = runs.reduce((sum, r) => sum + r.wavesCompleted, 0) / runs.length;

    // Best run = most waves completed, then most coins
    const bestRun = runs.reduce((best, current) => {
        if (current.wavesCompleted > best.wavesCompleted) return current;
        if (current.wavesCompleted === best.wavesCompleted && current.totalCoins > best.totalCoins) {
            return current;
        }
        return best;
    }, runs[0]);

    return {
        totalRuns: runs.length,
        victories,
        defeats,
        avgWavesCompleted: Math.round(avgWavesCompleted * 10) / 10,
        bestRun,
    };
}

/**
 * Clear all run history
 */
export async function clearRunHistory(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear run history:', error);
    }
}
